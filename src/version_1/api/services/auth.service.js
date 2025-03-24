import { createService, handleQueryService, updateService } from "./index.js"
const dbTable = "tokens"

export const getIdByRefreshTokenService = async (refreshtoken, actorid) => {
    try {
        const query =
            `Select ut.id, ut.csrf_token FROM ${dbTable} ut WHERE ut.refresh_token = $1 AND ut.isdelete = false AND ut.actorid = $2`
        return await handleQueryService(query, [refreshtoken, actorid])
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const getIdByAccessTokenService = async (accesstoken, actorid) => {
    try {
        const query =
            `Select ut.id, ut.csrf_token FROM ${dbTable} ut WHERE ut.access_token = $1 AND ut.isdelete = false AND ut.actorid = $2`
        return await handleQueryService(query, [accesstoken, actorid])
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const createTokensService = async (accesstoken, refreshtoken, csrftoken, actorid) => {
    try {
        const payload = {
            refresh_token: refreshtoken,
            access_token: accesstoken,
            csrf_token: csrftoken,
            actorid: actorid
        };

        return await createService(dbTable, payload);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const updateExpiredTokensService = async (id) => {
    try {
        const payload = {
            isdelete: true,
        };

        const fields = [];
        const values = [];
        for (const [key, value] of Object.entries(payload)) {
            fields.push(`${key} = $${fields.length + 1}`);
            values.push(value);
        }
        values.push(id);

        return await updateService(dbTable, fields, values);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const loginService = async (username) => {
    try {
        const query = `SELECT cre.id, cre.password, cre.driverid
        FROM driver_credentials cre JOIN drivers usr ON cre.driverid = usr.id 
        WHERE cre.username = $1 AND cre.isdelete = false AND usr.isdelete = false`;

        return await handleQueryService(query, [username]);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const employeeLoginService = async (username) => {
    try {
        const query = `SELECT cre.id, cre.password, cre.employeeid
        FROM employee_credentials cre JOIN employees emp ON cre.employeeid = emp.id 
        WHERE cre.username = $1 AND cre.isdelete = false AND emp.isdelete = false`;

        return await handleQueryService(query, [username]);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const passengerLoginService = async (username) => {
    try {
        const query = `SELECT cre.id, cre.password, cre.passengerid
        FROM passenger_credentials cre 
        JOIN passengers pas ON cre.passengerid = pas.id 
        JOIN passenger_registrations reg ON reg.passengerid = pas.id
        WHERE cre.username = $1 AND cre.isdelete = false AND pas.isdelete = false AND reg.status = 'Approved'`;

        return await handleQueryService(query, [username]);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const getRouteMetadataService = async (routeName) => {
    try {
        const normalizeRouteName = routeName.replace(
            /\/[a-f0-9\-]{36}$/,
            "/:id"
        );
        const resultRows = await handleQueryService(
            `SELECT permissions
        FROM routes_permissions
        WHERE name = $1`,
            [normalizeRouteName]
        );

        if (resultRows.length > 0) {
            return {
                permissions: resultRows[0].permissions || [],
            };
        }

        return { permissions: [] };
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const getDriverRolesAndPermissionsService = async (driverid) => {
    try {
        const roleRows = await handleQueryService(
            `SELECT r.name
            FROM drivers_roles ur
            INNER JOIN roles r ON ur.roleid = r.id
            WHERE ur.driverid = $1 AND ur.isdelete = false`,
            [driverid]
        );
        const roles = roleRows.map((row) => row.name);

        const permissionRows = await handleQueryService(
            `SELECT DISTINCT p.value
            FROM drivers_roles ur
            INNER JOIN roles_permissions rp ON ur.roleid = rp.roleid
            INNER JOIN permissions p ON rp.permissionid = p.id
            WHERE ur.driverid = $1 AND rp.isdelete = false`,
            [driverid]
        );
        const permissions = permissionRows.map((permission) => permission.value);

        return {
            roles,
            permissions,
        };
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const getEmployeeRolesAndPermissionsService = async (userid) => {
    try {
        const roleRows = await handleQueryService(
            `SELECT r.name
            FROM employees_roles er
            INNER JOIN roles r ON er.roleid = r.id
            WHERE er.employeeid = $1`,
            [userid]
        );
        const roles = roleRows.map((row) => row.name);

        const permissionRows = await handleQueryService(
            `SELECT DISTINCT p.value
            FROM employees_roles er
            INNER JOIN roles_permissions rp ON er.roleid = rp.roleid
            INNER JOIN permissions p ON rp.permissionid = p.id
            WHERE er.employeeid = $1 AND rp.isdelete = false`,
            [userid]
        );
        const permissions = permissionRows.map((permission) => permission.value);

        return {
            roles,
            permissions,
        };
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};

export const getPassengerRolesAndPermissionsService = async (userid) => {
    try {
        const roleRows = await handleQueryService(
            `SELECT r.name
            FROM passengers_roles er
            INNER JOIN roles r ON er.roleid = r.id
            WHERE er.passengerid = $1`,
            [userid]
        );
        const roles = roleRows.map((row) => row.name);

        const permissionRows = await handleQueryService(
            `SELECT DISTINCT p.value
            FROM passengers_roles er
            INNER JOIN roles_permissions rp ON er.roleid = rp.roleid
            INNER JOIN permissions p ON rp.permissionid = p.id
            WHERE er.passengerid = $1 AND rp.isdelete = false`,
            [userid]
        );
        const permissions = permissionRows.map((permission) => permission.value);

        return {
            roles,
            permissions,
        };
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};