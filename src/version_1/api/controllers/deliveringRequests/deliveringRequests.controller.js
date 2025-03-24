import bcrypt from "bcrypt";
import { getDefaultRoleService } from "../../services/roles.service.js"
import { isUUID, validatePagination } from "../../../utils/common.js"
import { createService, getAllService, getByIdService, updateService } from "../../services/index.js";
import { getAllDeliveryRequestsService, getRoutesByRequestIdService } from "../../services/deliveringRequests.service.js";
import { getCompanyByNameService } from "../../services/companies.service.js";
import { getPassengerByPhoneService } from "../../services/passengers.service.js";
import { WebSocket, WebSocketServer } from 'ws'
import { sendNotification } from "../../services/notification.service.js"
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const dbTable = "delivering_requests"
let wss = null;
const clientsByRouteId = {};

export const getDeliveringRequestsController = async (req, res) => {
    try {
        const { pageNum, pageSizeNum, order, isdelete, skip } = validatePagination(req);

        const dataRows = await getAllDeliveryRequestsService(dbTable, pageNum, pageSizeNum, skip, order, isdelete);
        const total = dataRows.length > 0 ? dataRows[0].total : 0;

        const data = await Promise.all(
            dataRows.map(async (element) => {
                const routeRows = await getRoutesByRequestIdService(element.id, 0, pageSizeNum, order, isdelete, skip);

                const passengerRowsNested = await Promise.all(
                    routeRows.flatMap((route) =>
                        route.passengers.map((passengerId) => getByIdService("passengers", passengerId))
                    )
                );

                // Flatten the array of arrays into a single-level array
                const passengerRows = passengerRowsNested.flat();

                return {
                    ...element,
                    routes: routeRows,
                    passengers: passengerRows,
                };
            })
        );

        return res.status(200).json({
            data: data,
            total: total,
            currentPage: pageNum === 0 ? 1 : pageNum,
            totalPages: pageNum === 0 ? 1 : Math.ceil(total / pageSizeNum),
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const getDeliveringRequestDetailController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUUID(id)) return res.status(400).json({ message: 'Invalid id' });
        const { pageNum, pageSizeNum, order, isdelete, skip } = validatePagination(req);

        const dataRows = await getByIdService(dbTable, id);
        if (dataRows.length === 0) return res.status(404).json({ message: "Data not found" });

        const routeData = await getRoutesByRequestIdService(id, pageNum, pageSizeNum, order, isdelete, skip)

        return res.status(200).json({
            data: {
                ...dataRows[0],
                routes: routeData
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

export const createDeliveringRequestController = async (req, res) => {
    try {
        if (!req.body.name || !req.body.delivering_date || !req.body.routes) return res.status(400).json({ message: 'Missing Required Fields' });
        if (!Array.isArray(req.body.routes || req.body.routes.length < 1)) return res.status(400).json({ message: "Invalid body" });

        const dataRows = await createService(dbTable, {
            name: req.body.name, delivering_date: req.body.delivering_date, guest_number: req.body.guest_number
        })
        var newRoutes = []
        let driverDeviceID = ''
        var bodyFieldError = false
        for (let i = 0; i < req.body.routes.length; i++) {
            const element = req.body.routes[i];
            if (!element.departure_time || !element.arrival_time ||
                !element.departure_location || !element.destination_location ||
                !element.passengers || !element.driverid ||
                !element.departure_lat || !element.departure_long ||
                !element.destination_lat || !element.destination_long) {
                bodyFieldError = true
                break;
            }

            if (!Array.isArray(element.passengers || element.passengers.length < 1)) {
                bodyFieldError = true
                break;
            }

            if (new Date(`${element.arrival_time} UTC`) < new Date(`${element.departure_time} UTC`)) {
                bodyFieldError = true
                break;
            }

            const driverRows = await getByIdService("drivers", element.driverid)
            if (driverRows.length === 0) return res.status(404).json({ message: "Data not found" });
            driverDeviceID = driverRows[0].deviceid

            var passengerRows = []
            for (let index = 0; index < element.passengers.length; index++) {
                const item = element.passengers[index];
                getPassengerByPhoneService(item.phone)
                    .then((res) => {
                        if (res.length > 0) {
                            passengerRows.push(res[0].id)
                        } else {
                            createService("passengers", {
                                first_name: item.first_name,
                                last_name: item.last_name,
                                phone: item.phone,
                                email: item.email,
                                company_name: item.companyName
                            }).then((r) => {
                                passengerRows.push(r[0].id)
                                getDefaultRoleService("Passenger")
                                    .then((res) => {
                                        createService("passengers_roles", {
                                            passengerid: r[0].id,
                                            roleid: res[0].id,
                                        });
                                    })
                            })
                        };
                    })
            }

            const departureLocation = await axios.get("https://maps.googleapis.com/maps/api/place/details/json",
                {
                    params: {
                        place_id: element.departure_lat,
                        key: process.env.GGMAP_API
                    }
                }
            )

            const destinationLocation = await axios.get("https://maps.googleapis.com/maps/api/place/details/json",
                {
                    params: {
                        place_id: element.destination_lat,
                        key: process.env.GGMAP_API
                    }
                }
            )

            const newRoute = await createService("delivering_routes", {
                departure_time: element.departure_time,
                arrival_time: element.arrival_time,
                departure_location: element.departure_location,
                destination_location: element.destination_location,
                passengers: passengerRows,
                driverid: element.driverid,
                note: element.note ?? "",
                requestid: dataRows[0].id,
                departure_lat: departureLocation?.data?.result?.geometry?.location?.lat,
                departure_long: departureLocation?.data?.result?.geometry?.location?.lng,
                destination_lat: destinationLocation?.data?.result?.geometry?.location?.lat,
                destination_long: destinationLocation?.data?.result?.geometry?.location?.lng,
                vehicleid: element.vehicleid ?? ""
            })

            newRoutes.push(newRoute[0])
        }

        if (bodyFieldError) {
            return res.status(400).json({ message: 'Request fields invalid' })
        }

        //#region notification
        await sendNotification(driverDeviceID, {
            title: "Yêu cầu đón khách",
            body: "Bạn có một yêu cầu đón khách mới",
            data: {
                ...dataRows[0],
                routes: newRoutes,
                type: "CreateJourney"
            }
        }).catch((err) => {
            console.error(err.message)
        });
        //#endregion

        return res.status(201).json({
            data: {
                ...dataRows[0],
                routes: newRoutes
            }
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

export const updateDeliveringRequestController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUUID(id)) return res.status(400).json({ message: 'Invalid id' });
        const { pageNum, pageSizeNum, order, isdelete, skip } = validatePagination(req);

        const dataRows = await getByIdService(dbTable, id);
        if (dataRows.length === 0) return res.status(404).json({ message: "Data not found" });

        const fields = [];
        const values = [];
        const payload = {
            ...(req.body.name && { name: req.body.name }),
            ...(req.body.delivering_date && { delivering_date: req.body.delivering_date }),
            ...(req.body.guest_number && { guest_number: req.body.guest_number }),
        };

        for (const [key, value] of Object.entries(payload)) {
            fields.push(`${key} = $${fields.length + 1}`);
            values.push(value);
        }
        values.push(id);

        const updatedData = await updateService(dbTable, fields, values);

        const routeRows = await getRoutesByRequestIdService(dataRows[0].id, pageNum, pageSizeNum, order, isdelete, skip)
        if (routeRows.length === 0) return res.status(404).json({ message: "Data not found" });

        let departureLocation = null
        let destinationLocation = null
        if (req.body.departure_lat) {
            departureLocation = await axios.get("https://maps.googleapis.com/maps/api/place/details/json",
                {
                    params: {
                        place_id: req.body.departure_lat,
                        key: process.env.GGMAP_API
                    }
                }
            )
        }

        if (req.body.destination_lat) {
            destinationLocation = await axios.get("https://maps.googleapis.com/maps/api/place/details/json",
                {
                    params: {
                        place_id: req.body.destination_lat,
                        key: process.env.GGMAP_API
                    }
                }
            )
        }

        const fieldsRoute = [];
        const valuesRoute = [];
        const payloadRoute = {
            ...(req.body.departure_time && { departure_time: req.body.departure_time }),
            ...(req.body.arrival_time && { arrival_time: req.body.arrival_time }),
            ...(req.body.departure_location && { departure_location: req.body.departure_location }),
            ...(req.body.destination_location && { destination_location: req.body.destination_location }),
            ...(req.body.driverid && { driverid: req.body.driverid }),
            ...(req.body.vehicleid && { vehicleid: req.body.vehicleid }),
            ...(departureLocation && { departure_lat: departureLocation?.data?.result?.geometry?.location?.lat }),
            ...(departureLocation && { departure_long: departureLocation?.data?.result?.geometry?.location?.lng }),
            ...(destinationLocation && { destination_lat: destinationLocation?.data?.result?.geometry?.location?.lat }),
            ...(destinationLocation && { destination_long: destinationLocation?.data?.result?.geometry?.location?.lng }),
        };

        for (const [key, value] of Object.entries(payloadRoute)) {
            fieldsRoute.push(`${key} = $${fieldsRoute.length + 1}`);
            valuesRoute.push(value);
        }
        valuesRoute.push(routeRows[0].id);
        const currentDriverRows = await getByIdService("drivers", routeRows[0].driverid)
        const passengerRows = await getByIdService("passengers", routeRows[0].passengers[0])

        let updatedDataRoute = routeRows
        if (fieldsRoute.length > 0) {
            updatedDataRoute = await updateService("delivering_routes", fieldsRoute, valuesRoute);

            let newDriver = null
            if (req.body.driverid) {
                const driverRows = await getByIdService("drivers", req.body.driverid)
                if (driverRows.length === 0) return res.status(404).json({ message: "Data not found" });
                newDriver = driverRows[0]

                if (newDriver.deviceid != currentDriverRows[0].deviceid) {
                    await sendNotification(newDriver.deviceid, {
                        title: "Yêu cầu đón khách",
                        body: `Bạn có một yêu cầu đón khách mới`,
                        data: {
                            ...updatedData[0],
                            routes: updatedDataRoute,
                            type: "CreateJourney"
                        },
                    })
                        .catch((err) => console.error('Send notification error', err.message))

                    await sendNotification(currentDriverRows[0].deviceid, {
                        title: "Thay đổi thông tin tài xế đưa rước",
                        body: `${passengerRows[0].gender == "Male" ? "Mr." : "Ms."} ${passengerRows[0].last_name} ${passengerRows[0].first_name} đã được chuyển sang một tài xế khác`,
                        data: {
                            ...updatedData[0],
                            routes: updatedDataRoute,
                            type: "UpdateJourney"
                        },
                    })
                        .catch((err) => console.error('Send notification error', err.message))
                }
            }
        } else {
            await sendNotification(currentDriverRows[0].deviceid, {
                title: "Cập nhật thông tin đón khách",
                body: `Thông tin đón ${passengerRows[0].gender == "Male" ? "Mr." : "Ms."} ${passengerRows[0].last_name} ${passengerRows[0].first_name} đã được cập nhật`,
                data: {
                    ...updatedData[0],
                    routes: updatedDataRoute,
                    type: "UpdateJourney"
                },
            })
                .catch((err) => console.error('Send notification error', err.message))
        }

        return res.status(200).json({
            data: {
                ...updatedData[0],
                routes: updatedDataRoute
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

export const deleteDeliveringRequestController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUUID(id)) return res.status(400).json({ message: 'Invalid id' });

        const dataRows = await getByIdService(dbTable, id);
        if (dataRows.length === 0) return res.status(404).json({ message: "Data not found" });

        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries({ isdelete: true })) {
            fields.push(`${key} = $${fields.length + 1}`);
            values.push(value);
        }
        values.push(id);

        const updatedData = await updateService(dbTable, fields, values);

        return res.status(200).json({
            data: updatedData[0],
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

export const deliveringRequestLocationController = async (req, res) => {
    // try {
    //     if (!req.body.routeid || !req.body.status) return res.status(400).json({ message: 'Missing Required Fields' });
    //     if (!isUUID(req.body.routeid)) return res.status(400).json({ message: 'Invalid id' });

    //     const { routeid, status } = req.body; // Get the routeid and status from the request body

    //     // If the status is "Picked", we either start a new WebSocket server or use the existing one
    //     if (status == 'Picked') {
    //         // Check if the WebSocket server is already created
    //         if (!wss) {
    //             // If the WebSocket server doesn't exist, create it
    //             wss = new WebSocketServer({ port: 8080 }, () => {
    //                 console.log('WebSocket server is running on ws://localhost:8080');
    //                 res.status(200).send({ message: 'WebSocket server created.' });
    //             });
    //         }

    //         wss.on('connection', (ws) => {
    //             console.log('A new client connected.');

    //             // Assign the connection to the specific routeid
    //             ws.currentRouteId = routeid; // Store routeid directly on the WebSocket object

    //             // Register the WebSocket connection under the routeid
    //             if (!clientsByRouteId[ws.currentRouteId]) {
    //                 clientsByRouteId[ws.currentRouteId] = [];
    //             }
    //             clientsByRouteId[ws.currentRouteId].push(ws);

    //             ws.on('message', (data) => {
    //                 try {
    //                     const locationData = JSON.parse(data);

    //                     // Update routeid if it's part of the message, otherwise use the default routeid
    //                     ws.currentRouteId = locationData.routeid ?? ws.currentRouteId;

    //                     const fields = [];
    //                     const values = [];

    //                     const payload = {
    //                         driver_lat: locationData.latitude,
    //                         driver_long: locationData.longitude,
    //                     };

    //                     for (const [key, value] of Object.entries(payload)) {
    //                         fields.push(`${key} = $${fields.length + 1}`);
    //                         values.push(value);
    //                     }
    //                     values.push(locationData.routeid);

    //                     updateService("delivering_routes", fields, values);
    //                 } catch (error) {
    //                     console.error('Error processing message:', error);
    //                 }
    //             });

    //             ws.on('close', () => {
    //                 console.log('Client disconnected.');

    //                 // Remove client from the map if the routeid is known
    //                 if (ws.currentRouteId && clientsByRouteId[ws.currentRouteId]) {
    //                     clientsByRouteId[ws.currentRouteId] = clientsByRouteId[ws.currentRouteId].filter(client => client !== ws);
    //                     if (clientsByRouteId[ws.currentRouteId].length === 0) {
    //                         delete clientsByRouteId[ws.currentRouteId];
    //                     }
    //                 }
    //             });

    //             ws.on('error', (error) => {
    //                 console.error('WebSocket error:', error);
    //             });
    //         });
    //     } else if (status == 'Completed') {
    //         console.log('Terminating WebSocket connections for routeid:', routeid);

    //         // Close all connected clients for the given routeid
    //         if (clientsByRouteId[routeid]) {
    //             clientsByRouteId[routeid].forEach((client) => {
    //                 if (client.readyState === WebSocket.OPEN) {
    //                     client.close();
    //                 }
    //             });
    //             delete clientsByRouteId[routeid]; // Remove the clients from the map
    //         }

    //         res.status(200).send({ message: `Terminated WebSocket connections for routeid: ${routeid}` });
    //     }
    // } catch (error) {
    //     return res.status(500).json({ message: error.message });
    // }
};