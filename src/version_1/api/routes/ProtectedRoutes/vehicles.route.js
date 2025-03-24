import express from "express";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";
import { createVehicleController, deleteVehicleController, getVehicleDetailController, getVehiclesController, updateVehicleController } from "../../controllers/vehicles/vehicles.controller.js";

export const vehiclesRoute = express.Router();

vehiclesRoute.get(
  "/",
  authMiddleware,
  specialCharacterValidateMiddleware,
  getVehiclesController
);
vehiclesRoute.get(
  "/:id",
  authMiddleware,
  specialCharacterValidateMiddleware,
  getVehicleDetailController
);
vehiclesRoute.post(
  "/",
  authMiddleware,
  specialCharacterValidateMiddleware,
  createVehicleController
);
vehiclesRoute.put(
  "/:id",
  authMiddleware,
  specialCharacterValidateMiddleware,
  updateVehicleController
);
vehiclesRoute.delete(
  "/:id",
  authMiddleware,
  specialCharacterValidateMiddleware,
  deleteVehicleController
);