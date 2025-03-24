import express from "express";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import {
    getDeliveringRequestsController, getDeliveringRequestDetailController, deliveringRequestLocationController,
    createDeliveringRequestController, updateDeliveringRequestController, deleteDeliveringRequestController
} from "../../controllers/deliveringRequests/deliveringRequests.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";

export const deliveringRequestsRoute = express.Router();

deliveringRequestsRoute.get("/", authMiddleware, specialCharacterValidateMiddleware, getDeliveringRequestsController);
deliveringRequestsRoute.get("/:id", authMiddleware, specialCharacterValidateMiddleware, getDeliveringRequestDetailController);
deliveringRequestsRoute.post("/", authMiddleware, specialCharacterValidateMiddleware, createDeliveringRequestController);
deliveringRequestsRoute.post("/location", specialCharacterValidateMiddleware, deliveringRequestLocationController);
deliveringRequestsRoute.put("/:id", authMiddleware, specialCharacterValidateMiddleware, updateDeliveringRequestController);
deliveringRequestsRoute.delete("/:id", authMiddleware, specialCharacterValidateMiddleware, deleteDeliveringRequestController);
