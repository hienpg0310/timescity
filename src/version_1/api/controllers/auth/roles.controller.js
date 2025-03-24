import {
    createService,
    getAllService,
    getByIdService,
    updateService,
} from "../../services/index.js";
import {
    getRolePermissionsService,
    updateRolePermissionsService,
} from "../../services/roles.service.js";
import { isUUID } from "../../../utils/common.js";
const dbTable = "roles";

export const getRolesController = async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            order = "desc",
            isdelete = "false",
        } = req.query;
        if (
            isNaN(Number(page)) ||
            isNaN(Number(pageSize)) ||
            Number(pageSize) < 1 ||
            (order != "asc" && order != "desc")
        ) {
            return res.status(400).json({ message: "Invalid parameter" });
        }

        const pageNum = parseInt(page, 10);
        const pageSizeNum = parseInt(pageSize, 10);
        const skip = (pageNum - 1) * pageSizeNum;

        const roles = await getAllService(
            dbTable,
            pageNum,
            pageSizeNum,
            skip,
            order,
            isdelete
        );
        const total = roles.length > 0 ? roles[0].total : 0;

        return res.status(200).json({
            roles: roles,
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

export const createRolesController = async (req, res) => {
    try {
        if (!req.body.name || !req.body.permissions)
            return res.status(400).json({ message: "Missing Required Fields" });
        if (!Array.isArray(req.body.permissions))
            return res.status(400).json({ message: "Invalid Permissions" });

        const payload = {
            name: req.body.name,
            description: req.body.description ?? "",
        };

        const roleRows = await createService(dbTable, payload);

        req.body.permissions.forEach((element) => {
            createService("roles_permissions", {
                roleid: roleRows[0].id,
                permissionid: element,
            });
        });

        return res.status(201).json({
            role: roleRows[0],
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const updateRolesController = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isUUID(id)) return res.status(400).json({ message: "Invalid id" });
        if (!req.body.name || !req.body.permissions)
            return res.status(400).json({ message: "Missing Required Fields" });
        if (req.body.permissions) {
            if (!Array.isArray(req.body.permissions))
                return res.status(400).json({ message: "Invalid Permissions" });
        }

        const roles = await getByIdService(dbTable, id);
        if (roles.length === 0)
            return res.status(404).json({ message: "Role not found" });

        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(req.body)) {
            if (key !== "permissions") {
                fields.push(`${key} = $${fields.length + 1}`);
                values.push(value);
            }
        }
        fields.push(`updateat = $${fields.length + 1}`);
        values.push(new Date());
        values.push(id);

        const updatedRole = await updateService(dbTable, fields, values);

        const currentRolePermissions = await getRolePermissionsService(id);
        const newRolePermissions = new Set(req.body.permissions);
        const updatedRolePermissions = [
            ...currentRolePermissions.map((item) => ({
                ...item,
                isdelete: !newRolePermissions.has(item.permissionid),
            })),
            ...req.body.permissions
                .filter(
                    (permissionid) =>
                        !currentRolePermissions.some(
                            (item) => item.permissionid === permissionid
                        )
                )
                .map((permissionid) => ({ permissionid, isdelete: false })),
        ];

        updatedRolePermissions.forEach((element) => {
            const existRolePermission = currentRolePermissions.find(
                (permission) => permission.permissionid === element.permissionid
            );

            if (existRolePermission) {
                if (existRolePermission.isdelete !== element.isdelete) {
                    updateRolePermissionsService(
                        id,
                        element.permissionid,
                        element.isdelete
                    );
                }
            } else {
                createService("roles_permissions", {
                    roleid: id,
                    permissionid: element.permissionid,
                });
            }
        });

        return res.status(200).json({
            message: "Update success",
            role: updatedRole,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};
