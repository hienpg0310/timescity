import express from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import { createInsuranceController } from "../../controllers/insurances/insurance.controller.js";

export const insuranceRoute = express.Router();

insuranceRoute.post(
  "/",
  authMiddleware,
  createInsuranceController,
);