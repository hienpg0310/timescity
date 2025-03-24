import { handleQueryService } from "./index.js";

export const getEmployeeRolesService = async (employeeid) => {
    try {
        const query =
            `SELECT ur.roleid, r.name, r.description, ur.isdelete
	            FROM employees_roles ur JOIN roles r ON ur.roleid = r.id 
	            WHERE ur.employeeid = $1`
        return await handleQueryService(query, [employeeid])
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
}

export const updateEmployeeRolesService = async (employeeid, roleid, isdelete) => {
    try {
        let query =
            `UPDATE employees_roles
            SET isdelete=${isdelete}
	        WHERE employeeid = $1 AND roleid = $2 RETURNING *`;

        return await handleQueryService(query, [employeeid, roleid]);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
}