import bcrypt from "bcrypt";
import { getDefaultRoleService } from "../../services/roles.service.js"
import { isUUID, validatePagination } from "../../../utils/common.js"
import { createService, getAllService, getByIdService, updateService } from "../../services/index.js";
import { getEmployeeRolesService, updateEmployeeRolesService } from "../../services/employees.service.js";
const dbTable = "employees"

export const getEmployeesController = async (req, res) => {
    try {
        const { pageNum, pageSizeNum, order, isdelete, skip } = validatePagination(req)

        const dataRows = await getAllService(
            dbTable,
            pageNum,
            pageSizeNum,
            skip,
            order,
            isdelete
        );
        const total = dataRows.length > 0 ? dataRows[0].total : 0;

        return res.status(200).json({
            data: dataRows,
            total: total,
            currentPage: pageNum == 0 ? 1 : pageNum,
            totalPages: pageNum == 0 ? 1 : Math.ceil(total / pageSizeNum),
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const getEmployeeDetailController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUUID(id)) return res.status(400).json({ message: 'Invalid id' });

        const dataRows = await getByIdService(dbTable, id);
        if (dataRows.length === 0) return res.status(404).json({ message: "Data not found" });

        return res.status(200).json({
            data: dataRows[0],
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

export const createEmployeeController = async (req, res) => {
    try {
        if (!req.body.firstname || !req.body.username || !req.body.password)
            return res.status(400).json({ message: "Missing Required Fields" });

        const employeeRows = await createService(dbTable, req.body);
        await createService("employee_credentials", {
            employeeid: employeeRows[0].id,
            username: req.body.username,
            password: await bcrypt.hash(req.body.password ?? "123456", 10),
        });

        const roleRows = await getDefaultRoleService("Employee")        
        await createService("employees_roles", {
            employeeid: employeeRows[0].id,
            roleid: roleRows[0].id,
        });

        return res.status(201).json({
            employee: employeeRows[0],
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

export const updateEmployeeController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUUID(id)) return res.status(400).json({ message: 'Invalid id' });

        const dataRows = await getByIdService(dbTable, id);
        if (dataRows.length === 0) return res.status(404).json({ message: "Data not found" });

        const fields = [];
        const values = [];

        for (const [key, value] of Object.entries(req.body)) {
            fields.push(`${key} = $${fields.length + 1}`);
            values.push(value);
        }
        values.push(id);

        const updatedData = await updateService(dbTable, fields, values);

        return res.status(200).json({
            data: updatedData[0],
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

export const deleteEmployeeController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUUID(id)) return res.status(400).json({ message: 'Invalid id' });

        const dataRows = await getByIdService(dbTable, id);
        if (dataRows.length === 0) return res.status(404).json({ message: "Data not found" });

        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries({ isdelete: true })) {
            fields.push(`${key} = $${fields.length + 1}`);
            values.push(value);
        }
        values.push(id);

        const updatedData = await updateService(dbTable, fields, values);

        return res.status(200).json({
            data: updatedData[0],
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

export const getEmployeeRolesController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUUID(id)) return res.status(400).json({ message: 'Invalid id' });

        const dataRows = await getByIdService(dbTable, id);
        if (dataRows.length === 0) return res.status(404).json({ message: "Data not found" });

        const roles = await getEmployeeRolesService(id);

        return res.status(200).json({
            roles: roles,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}

export const updateEmployeeRolesController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUUID(id)) return res.status(400).json({ message: 'Invalid id' });
        if (!req.body.roles) return res.status(400).json({ message: 'Missing Required Fields' });
        if (req.body.roles) {
            if (!Array.isArray(req.body.roles)) return res.status(400).json({ message: 'Invalid Roles' });
        }

        const dataRows = await getByIdService(dbTable, id);
        if (dataRows.length === 0) return res.status(404).json({ message: "Data not found" });

        const currentEmployeeRoles = await getEmployeeRolesService(id);
        const newEmployeeRoles = new Set(req.body.roles);
        const updatedEmployeeRoles = [
            ...currentEmployeeRoles.map(item => ({
                ...item,
                isdelete: !newEmployeeRoles.has(item.roleid)
            })),
            ...req.body.roles
                .filter(roleid => !currentEmployeeRoles.some(item => item.roleid === roleid))
                .map(roleid => ({ roleid, isdelete: false }))
        ];

        updatedEmployeeRoles.forEach(element => {
            const existEmployeeRoles = currentEmployeeRoles.find(role => role.roleid === element.roleid)

            if (existEmployeeRoles) {
                if (existEmployeeRoles.isdelete !== element.isdelete) updateEmployeeRolesService(id, element.roleid, element.isdelete)
            } else {
                createService("employees_roles", {
                    employeeid: id,
                    roleid: element.roleid
                })
            }
        });

        return res.status(200).json({
            message: "Update success",
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
}
