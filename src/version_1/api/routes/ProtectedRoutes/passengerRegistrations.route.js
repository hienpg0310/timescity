import express from "express";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import {
  getPassengerRegistrationsController,
  updatePassengerRegistrationController,
} from "../../controllers/passengers/passengerRegistrations.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";

export const passengerRegistrationsRoute = express.Router();

passengerRegistrationsRoute.get(
  "/",
  authMiddleware,
  specialCharacterValidateMiddleware,
  getPassengerRegistrationsController
);
passengerRegistrationsRoute.put(
  "/:id",
  authMiddleware,
  specialCharacterValidateMiddleware,
  updatePassengerRegistrationController
);
