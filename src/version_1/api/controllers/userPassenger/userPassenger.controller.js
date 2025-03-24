import { getByIdService, updateService } from "../../services/index.js";
import {
    getDriverJourneyService,
    getToTalDriverJourneyService,
} from "../../services/userdriver.service.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const dbTable = "delivering_requests";

export const createUserDeliveringRequestController = async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const accessToken = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_PRIVATE_KEY
        );
        const passenger = await getByIdService("passengers", decoded.id);
        if (passenger.length === 0)
            return res.status(404).json({ message: "Passenger not found" });

        if (!req.body.name || !req.body.delivering_date || !req.body.routes) return res.status(400).json({ message: 'Missing Required Fields' });
        if (!Array.isArray(req.body.routes || req.body.routes.length < 1)) return res.status(400).json({ message: "Invalid body" });

        const dataRows = await createService("passenger_delivering_requests", {
            passengerid: decoded.id,
            request_name: req.body.name, request_delivering_date: req.body.delivering_date, request_guest_number: req.body.guest_number,
            routes: JSON.stringify(req.body.routes)
        })        

        return res.status(201).json({
            data: dataRows[0]
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}
