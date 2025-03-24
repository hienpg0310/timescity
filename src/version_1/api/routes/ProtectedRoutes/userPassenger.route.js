import express from "express";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";
import { createUserDeliveringRequestController } from "../../controllers/userPassenger/userPassenger.controller.js";

export const userPassengerRoute = express.Router();

userPassengerRoute.post("/delivering-requests", authMiddleware, specialCharacterValidateMiddleware, createUserDeliveringRequestController);