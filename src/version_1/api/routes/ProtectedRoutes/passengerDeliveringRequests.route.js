import express from "express";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import {
  getPassengerDeliveringRequestsController,
  updatePassengerDeliveringRequestController,
} from "../../controllers/passengers/passengerDeliveringRequests.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";

export const passengerDeliveringRequestsRoute = express.Router();

passengerDeliveringRequestsRoute.get(
  "/",
  authMiddleware,
  specialCharacterValidateMiddleware,
  getPassengerDeliveringRequestsController
);
passengerDeliveringRequestsRoute.put(
  "/:id",
  authMiddleware,
  specialCharacterValidateMiddleware,
  updatePassengerDeliveringRequestController
);
