import express from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import { createRolesController, updateRolesController, getRolesController } from "../../controllers/auth/roles.controller.js";

export const rolesRoute = express.Router();

rolesRoute.get("/", authMiddleware, specialCharacterValidateMiddleware, getRolesController);
rolesRoute.post("/", authMiddleware, specialCharacterValidateMiddleware, createRolesController);
rolesRoute.put("/:id", authMiddleware, specialCharacterValidateMiddleware, updateRolesController);