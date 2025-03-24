import axios from "axios";
import dotenv from "dotenv";
import { convertToUnixTimestamp } from "../../../utils/common.js";
dotenv.config();

export const getSuggestLocationController = async (req, res) => {
    try {
        const { search } = req.query
        const response = await axios.get("https://maps.googleapis.com/maps/api/place/autocomplete/json",
            {
                params: {
                    input: search,
                    key: process.env.GGMAP_API,
                    components: "country:vn",
                }
            }
        )

        const suggestions = response.data.predictions.map((place) => ({
            value: place.description || "Unknown Address",
            label: place.description || "Unknown Address",
            data: {
                position: {
                    lat: place.place_id,
                    lng: place.place_id
                }
            }
        }));

        return res.status(200).json({
            data: suggestions
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const getTravelTimeController = async (req, res) => {
    try {
        const { origin, destination } = req.body
        if (!origin || !destination) return res.status(400).json({ message: "Missing Required Fields" });

        const departureLocation = await axios.get("https://maps.googleapis.com/maps/api/place/details/json",
            {
                params: {
                    place_id: origin.lat,
                    key: process.env.GGMAP_API
                }
            }
        )

        const destinationLocation = await axios.get("https://maps.googleapis.com/maps/api/place/details/json",
            {
                params: {
                    place_id: destination.lat,
                    key: process.env.GGMAP_API
                }
            }
        )

        const response = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json",
            {
                params: {
                    origins: `${departureLocation?.data?.result?.geometry?.location?.lat},${departureLocation?.data?.result?.geometry?.location?.lng}`,
                    destinations: `${destinationLocation?.data?.result?.geometry?.location?.lat},${destinationLocation?.data?.result?.geometry?.location?.lng}`,
                    mode: 'driving',
                    key: process.env.GGMAP_API
                }
            }
        )

        let travelTime = ""
        let travelDistance = ""
        if (response.data.status === 'OK') {
            const element = response.data.rows[0].elements[0];
            if (element.status === 'OK') {
                travelTime = element.duration;
                travelDistance = element.distance;
            } else {
                console.error(`Error in element: ${element.status}`);
            }
        } else {
            console.error(`API response error: ${response.data.status}`);
        }

        return res.status(200).json({
            data: {
                travel_time: travelTime,
                travel_distance: travelDistance
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const getTravelTimeByLatLngController = async (req, res) => {
    try {
        const { origin, destination } = req.body
        if (!origin || !destination) return res.status(400).json({ message: "Missing Required Fields" });        

        const response = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json",
            {
                params: {
                    origins: `${origin.lat},${origin.lng}`,
                    destinations: `${destination.lat},${destination.lng}`,
                    mode: 'driving',
                    key: process.env.GGMAP_API
                }
            }
        )

        let travelTime = ""
        let travelDistance = ""
        if (response.data.status === 'OK') {
            const element = response.data.rows[0].elements[0];
            if (element.status === 'OK') {
                travelTime = element.duration;
                travelDistance = element.distance;
            } else {
                console.error(`Error in element: ${element.status}`);
            }
        } else {
            console.error(`API response error: ${response.data.status}`);
        }

        return res.status(200).json({
            data: {
                travel_time: travelTime,
                travel_distance: travelDistance
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const getArrivalTimeController = async (req, res) => {
    try {
        const { origin, destination, departure_time } = req.body
        if (!origin || !destination || !departure_time) return res.status(400).json({ message: "Missing Required Fields" });
        const unixDepartureTime = convertToUnixTimestamp(departure_time)
        const departureLocation = await axios.get("https://maps.googleapis.com/maps/api/place/details/json",
            {
                params: {
                    place_id: origin.lat,
                    key: process.env.GGMAP_API
                }
            }
        )

        const destinationLocation = await axios.get("https://maps.googleapis.com/maps/api/place/details/json",
            {
                params: {
                    place_id: destination.lat,
                    key: process.env.GGMAP_API
                }
            }
        )

        const response = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json",
            {
                params: {
                    origins: `${departureLocation?.data?.result?.geometry?.location?.lat},${departureLocation?.data?.result?.geometry?.location?.lng}`,
                    destinations: `${destinationLocation?.data?.result?.geometry?.location?.lat},${destinationLocation?.data?.result?.geometry?.location?.lng}`,
                    mode: "driving",
                    departure_time: unixDepartureTime,
                    key: process.env.GGMAP_API
                }
            }
        )

        if (response.data.status === 'OK') {
            const element = response.data.rows[0].elements[0];
            if (element.status === 'OK') {
                const travelTimeInSeconds = element.duration_in_traffic
                    ? element.duration_in_traffic.value
                    : element.duration.value;

                const arrivalTime = new Date(unixDepartureTime * 1000 + travelTimeInSeconds * 1000);

                return res.status(200).json({
                    data: {
                        arrivalTime: arrivalTime.toISOString(),
                    }
                });
            } else {
                console.error(`API Element Status: ${element.status}`);
                return res.status(500).json({ message: "Error get arrival time" })
            }
        } else {
            console.error(`API Response Status: ${response.data.status}`);
            return res.status(500).json({ message: "Error get arrival time" })
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const getAddressByLatLngController = async (req, res) => {
    try {
        const { lat, lng } = req.body
        if (!lat || !lng) return res.status(400).json({ message: "Missing Required Fields" });
        const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json",
            {
                params: {
                    latlng: `${lat},${lng}`,
                    key: process.env.GGMAP_API
                }
            }
        )

        if (response.data.status === 'OK') {
            const address = response.data.results[0].formatted_address;
            return res.status(200).json({
                data: {
                    address: address
                }
            });
        } else {
            console.error(`API Response Status: ${response.data.status}`);
            return res.status(500).json({ message: "Error get arrival time" })
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};