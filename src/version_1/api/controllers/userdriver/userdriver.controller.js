import { getByIdService, updateService } from "../../services/index.js";
import {
    getDriverJourneyService,
    getToTalDriverJourneyService,
} from "../../services/userdriver.service.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { imgUpload } from "../../../utils/fileHandle.js";
import { folderNames } from "../../../utils/constants.js";
import path from "path";
import { isUUID, validatePagination } from "../../../utils/common.js";
import { getRoutesByRequestIdService } from "../../services/deliveringRequests.service.js";
dotenv.config();
const dbTable = "drivers";

export const getDriverDetailController = async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const accessToken = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_PRIVATE_KEY
        );
        const dataRows = await getByIdService(dbTable, decoded.id);
        if (dataRows.length === 0)
            return res.status(404).json({ message: "Data not found" });

        return res.status(200).json({
            data: dataRows[0],
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const getDriverJourneyController = async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const accessToken = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_PRIVATE_KEY
        );
        const driver = await getByIdService(dbTable, decoded.id);
        if (driver.length === 0)
            return res.status(404).json({ message: "Driver not found" });

        const {
            page = 1,
            pageSize = 10,
            order = "desc",
            status = "",
            start = "",
            end = "",
        } = req.query;
        if (
            isNaN(Number(page)) ||
            isNaN(Number(pageSize)) ||
            Number(pageSize) < 1 ||
            (order != "asc" && order != "desc")
        ) {
            return res.status(400).json({ message: "Invalid parameter" });
        }

        const pageNum = parseInt(page, 10);
        const pageSizeNum = parseInt(pageSize, 10);
        const skip = (pageNum - 1) * pageSizeNum;

        const dataRows = await getDriverJourneyService(
            decoded.id,
            pageNum,
            pageSizeNum,
            skip,
            order,
            status,
            start,
            end
        );
        // const total = await getToTalDriverJourneyService(
        //     decoded.id,
        //     status,
        //     start,
        //     end
        // );        
        const total = dataRows.length > 0 ? dataRows[0].total : 0

        return res.status(200).json({
            data: dataRows,
            total: parseInt(total),
            currentPage: pageNum == 0 ? 1 : pageNum,
            totalPages:
                pageNum == 0 ? 1 : Math.ceil(total[0].total / pageSizeNum),
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const getDriverJourneyDetailController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUUID(id)) return res.status(400).json({ message: 'Invalid id' });
        const { pageNum, pageSizeNum, order, isdelete, skip } = validatePagination(req);

        const dataRows = await getByIdService("delivering_requests", id);
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
};

export const updateDriverDetailController = async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const accessToken = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_PRIVATE_KEY
        );

        const dataRows = await getByIdService(dbTable, decoded.id);
        if (dataRows.length === 0)
            return res.status(404).json({ message: "Data not found" });

        const fields = [];
        const values = [];
        let imagePath = null
        if (req.files) {
            const filePath = imgUpload(
                req.files.image_url,
                folderNames.driver,
                dataRows[0]
            );

            imagePath = `${process.env.BASE_URL}/image/${folderNames.driver
                }/${path.basename(filePath)}`
        }

        const payload = {
            ...(req.body.first_name && { first_name: req.body.first_name }),
            ...(req.body.last_name && { last_name: req.body.last_name }),
            ...(req.body.dob && { dob: req.body.dob }),
            ...(req.body.email && { email: req.body.email }),
            ...(req.body.phone_number && { phone_number: req.body.phone_number }),
            ...(req.body.address && { address: req.body.address }),
            ...(req.body.deviceid && { deviceid: req.body.deviceid }),
            ...(imagePath && { image_url: imagePath }),
        };

        for (const [key, value] of Object.entries(payload)) {
            fields.push(`${key} = $${fields.length + 1}`);
            values.push(value);
        }
        values.push(decoded.id);

        const updatedData = await updateService(dbTable, fields, values);

        return res.status(200).json({
            data: updatedData[0],
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const updateDriverJourneyController = async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const accessToken = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_PRIVATE_KEY
        );
        const driver = await getByIdService(dbTable, decoded.id);
        if (driver.length === 0)
            return res.status(404).json({ message: "Driver not found" });

        const { journeyid = "", status = "", latitude = "", longtitude = "" } = req.query;
        if (journeyid === "") {
            return res.status(400).json({ message: "Invalid parameter" });
        }

        const fields = [];
        const values = [];

        const payload = {
            ...(status != "" ? { status: status } : {}),
            ...(latitude != "" ? { driver_lat: latitude } : {}),
            ...(longtitude != "" ? { driver_long: longtitude } : {})
        }

        for (const [key, value] of Object.entries(payload)) {
            fields.push(`${key} = $${fields.length + 1}`);
            values.push(value);
        }
        values.push(journeyid);
        const dataRows = await updateService("delivering_routes", fields, values);

        return res.status(200).json({
            data: dataRows,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};
