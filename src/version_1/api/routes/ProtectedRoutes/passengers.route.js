import express from "express";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import {
  getPassengersController,
  getPassengerDetailController,
  createPassengerController,
  updatePassengerController,
  deletePassengerController,
  getPassengerDetailByPhoneController,
} from "../../controllers/passengers/passengers.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";
import { passengerRegistrationsRoute } from "./passengerRegistrations.route.js";
import { passengerDeliveringRequestsRoute } from "./passengerDeliveringRequests.route.js";

export const passengersRoute = express.Router();

passengersRoute.get(
  "/",
  authMiddleware,
  specialCharacterValidateMiddleware,
  getPassengersController
);
passengersRoute.use("/registrations", passengerRegistrationsRoute);
passengersRoute.use("/delivering-requests", passengerDeliveringRequestsRoute);
passengersRoute.get(
  "/phone/:phone",
  authMiddleware,
  specialCharacterValidateMiddleware,
  getPassengerDetailByPhoneController
);
passengersRoute.get(
  "/:id",
  authMiddleware,
  specialCharacterValidateMiddleware,
  getPassengerDetailController
);
passengersRoute.post(
  "/",
  authMiddleware,
  // specialCharacterValidateMiddleware,
  createPassengerController
);
passengersRoute.put(
  "/:id",
  authMiddleware,
  specialCharacterValidateMiddleware,
  updatePassengerController
);
passengersRoute.delete(
  "/:id",
  authMiddleware,
  specialCharacterValidateMiddleware,
  deletePassengerController
);

// Thêm route cho ghi chú
// passengersRoute.post(
//   "/:id/notes", // Route thêm ghi chú cho hành khách
//   authMiddleware,
//   specialCharacterValidateMiddleware,
//   createPassengerNoteController // Controller xử lý ghi chú
// );
