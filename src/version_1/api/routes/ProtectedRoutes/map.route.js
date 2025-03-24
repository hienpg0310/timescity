import express from "express";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";
import { getSuggestLocationController, getTravelTimeController, getArrivalTimeController, getAddressByLatLngController, getTravelTimeByLatLngController } from "../../controllers/map/map.controller.js";

export const mapRoute = express.Router();

mapRoute.get("/suggest-location", authMiddleware, specialCharacterValidateMiddleware, getSuggestLocationController);
mapRoute.post("/travel-time", authMiddleware, specialCharacterValidateMiddleware, getTravelTimeController);
mapRoute.post("/travel-time-latlng", authMiddleware, specialCharacterValidateMiddleware, getTravelTimeByLatLngController);
mapRoute.post("/arrival-time", authMiddleware, specialCharacterValidateMiddleware, getArrivalTimeController);
mapRoute.post("/location", authMiddleware, specialCharacterValidateMiddleware, getAddressByLatLngController);