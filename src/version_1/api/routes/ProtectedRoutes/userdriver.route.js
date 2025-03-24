import express from "express";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import {
    getDriverDetailController,
    getDriverJourneyController,
    updateDriverDetailController,
    updateDriverJourneyController,
    getDriverJourneyDetailController
} from "../../controllers/userdriver/userdriver.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";

export const userDriverRoute = express.Router();

userDriverRoute.get("/detail", authMiddleware, specialCharacterValidateMiddleware, getDriverDetailController);
userDriverRoute.put("/detail", authMiddleware, specialCharacterValidateMiddleware, updateDriverDetailController);
userDriverRoute.get("/journey", authMiddleware, specialCharacterValidateMiddleware, getDriverJourneyController);
userDriverRoute.get("/journey/:id", authMiddleware, specialCharacterValidateMiddleware, getDriverJourneyDetailController);
userDriverRoute.put("/journey", authMiddleware, specialCharacterValidateMiddleware, updateDriverJourneyController);