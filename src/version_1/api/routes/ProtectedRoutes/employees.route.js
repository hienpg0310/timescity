import express from "express";
import { specialCharacterValidateMiddleware } from "../../../middleware/specialCharacterValidate.middleware.config.js";
import {
    getEmployeesController, getEmployeeDetailController,
    createEmployeeController, updateEmployeeController, deleteEmployeeController,
    getEmployeeRolesController, updateEmployeeRolesController
} from "../../controllers/employees/employees.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.config.js";

export const employeesRoute = express.Router();

employeesRoute.get("/", authMiddleware, specialCharacterValidateMiddleware, getEmployeesController);
employeesRoute.get("/:id", authMiddleware, specialCharacterValidateMiddleware, getEmployeeDetailController);
employeesRoute.post("/", authMiddleware, specialCharacterValidateMiddleware, createEmployeeController);
employeesRoute.put("/:id", authMiddleware, specialCharacterValidateMiddleware, updateEmployeeController);
employeesRoute.delete("/:id", authMiddleware, specialCharacterValidateMiddleware, deleteEmployeeController);
employeesRoute.get("/roles/:id", authMiddleware, specialCharacterValidateMiddleware, getEmployeeRolesController);
employeesRoute.put("/roles/:id", authMiddleware, specialCharacterValidateMiddleware, updateEmployeeRolesController);