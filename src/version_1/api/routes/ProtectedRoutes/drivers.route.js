import express from "express";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import {
    getDriversController, getDriverDetailController,
    createDriverController, updateDriverController, deleteDriverController,
    getDriverRolesController, updateDriverRolesController
} from "../../controllers/drivers/drivers.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";

export const driversRoute = express.Router();

driversRoute.get("/", authMiddleware, specialCharacterValidateMiddleware, getDriversController);
driversRoute.get("/:id", authMiddleware, specialCharacterValidateMiddleware, getDriverDetailController);
driversRoute.post("/", authMiddleware, specialCharacterValidateMiddleware, createDriverController);
driversRoute.put("/:id", authMiddleware, specialCharacterValidateMiddleware, updateDriverController);
driversRoute.delete("/:id", authMiddleware, specialCharacterValidateMiddleware, deleteDriverController);
driversRoute.get("/roles/:id", authMiddleware, specialCharacterValidateMiddleware, getDriverRolesController);
driversRoute.put("/roles/:id", authMiddleware, specialCharacterValidateMiddleware, updateDriverRolesController);