import { handleQueryService } from "./index.js";

export const getDriverRolesService = async (driverid) => {
    try {
        const query = `SELECT ur.roleid, r.name, r.description, ur.isdelete
	            FROM drivers_roles ur JOIN roles r ON ur.roleid = r.id 
	            WHERE ur.driverid = $1`;
        return await handleQueryService(query, [driverid]);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const getDriverCredentialsService = async (driverid) => {
    try {
        const query = `SELECT cre.username, cre.password
	            FROM driver_credentials cre
	            WHERE cre.driverid = $1 AND cre.isdelete = false`;
        return await handleQueryService(query, [driverid]);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const updateDriverRolesService = async (driverid, roleid, isdelete) => {
    try {
        let query = `UPDATE drivers_roles
            SET isdelete=${isdelete}
	        WHERE driverid = $1 AND roleid = $2 RETURNING *`;

        return await handleQueryService(query, [driverid, roleid]);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const getAvailableDriversService = async (startTime, endTime, pageSizeNum = 10, skip = 0, isdelete = "false") => {
    try {
        const query = `SELECT dr.*, COUNT(dr.*) OVER() as total FROM drivers dr WHERE dr.id NOT IN (
        SELECT DISTINCT rt.driverid
            FROM delivering_routes rt
            WHERE
            rt.departure_time::DATE BETWEEN timestamp '${startTime}'::DATE AND timestamp '${endTime}'::DATE
            AND(rt.arrival_time::TIME BETWEEN timestamp '${startTime}'::TIME AND timestamp '${endTime}'::TIME OR
            rt.departure_time::TIME BETWEEN timestamp '${startTime}'::TIME AND timestamp '${endTime}'::TIME OR
            (rt.departure_time::TIME >= timestamp '${startTime}'::TIME AND rt.arrival_time::TIME <= timestamp '${endTime}'::TIME))            
            AND (rt.status = 'Pending' Or
             rt.status = 'Confirmed' Or
             rt.status = 'Arrived' Or
             rt.status = 'Picked' Or
             rt.status = 'Cancel')) AND dr.isdelete = ${isdelete}
        LIMIT $1 OFFSET $2;`;        
        return await handleQueryService(query, [pageSizeNum, skip]);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};