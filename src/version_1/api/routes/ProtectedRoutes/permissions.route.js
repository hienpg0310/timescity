import express from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import { getPermissionsController } from "../../controllers/auth/permissions.controller.js";

export const permissionsRoute = express.Router();

permissionsRoute.get("/", authMiddleware, specialCharacterValidateMiddleware, getPermissionsController);