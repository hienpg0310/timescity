import { handleQueryService } from "./index.js";

export const getRolePermissionsService = async (roleid) => {
    try {
        const query = `SELECT rp.permissionid, rp.isdelete
	            FROM roles_permissions rp
	            WHERE rp.roleid = $1`;
        return await handleQueryService(query, [roleid]);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const updateRolePermissionsService = async (
    roleid,
    permissionsid,
    isdelete
) => {
    try {
        let query = `UPDATE roles_permissions
            SET isdelete=${isdelete}
	        WHERE roleid = $1 AND permissionid = $2 RETURNING *`;

        return await handleQueryService(query, [roleid, permissionsid]);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const getDefaultRoleService = async (type = "Driver") => {
    try {
        const query = `SELECT ${type == "Driver"
                ? "dr.driver_roleid AS id"
                : type == "Passenger"
                    ? "dr.passenger_roleid AS id"
                    : "dr.employee_roleid AS id"
            } FROM default_roles dr`;
        return await handleQueryService(query);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};
