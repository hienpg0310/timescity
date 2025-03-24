import { handleQueryService } from "./index.js";

export const getDriverJourneyService = async (
    id,
    page,
    pageSizeNum = 10,
    skip = 0,
    order,
    status,
    start,
    end
) => {
    let conditionQuery = ""
    const statusArray = status ? status.split("*") : [];
    if (statusArray.length > 0) {
        conditionQuery += `AND drou.status IN ('${statusArray.join("','")}') `;
    }

    if (start) {
        conditionQuery += `AND drou.departure_time >= '${start}' `;
    }

    if (end) {
        conditionQuery += `AND drou.departure_time <= '${end}' `;
    }

    let query = `
        SELECT 
            dreq.*,
            drou.*, 
            p.phone AS passenger_phone,

            (SELECT COUNT(*) 
            FROM public.delivering_routes drou_inner
            JOIN public.delivering_requests dreq_inner
            ON drou_inner.requestid = dreq_inner.id
            JOIN public.passengers p_inner
            ON drou_inner.passengers[1] = p_inner.id
            WHERE drou_inner.driverid = $1 ${conditionQuery}) AS total

        FROM 
            public.delivering_routes drou 
        JOIN 
            public.delivering_requests dreq 
        ON 
            drou.requestid = dreq.id 
        JOIN 
            public.passengers p 
        ON 
            drou.passengers[1] = p.id 
        WHERE 
            drou.driverid = $1
    `;

    query += conditionQuery

    query += `ORDER BY drou.createat ${order}`;
    if (page != 0) {
        query += ` LIMIT $2 OFFSET $3`;
        return await handleQueryService(query, [id, pageSizeNum, skip]);
    } else {
        return await handleQueryService(query, [id]);
    }
};

export const getToTalDriverJourneyService = async (id, status, start, end) => {
    let query = `
        SELECT 
            COUNT(drou.id) AS total
        FROM 
            public.delivering_routes drou
        WHERE 
            drou.driverid = $1
    `;

    const statusArray = status ? status.split("*") : [];
    if (statusArray.length > 0) {
        query += `AND drou.status IN ('${statusArray.join("','")}') `;
    }

    if (start) {
        query += `AND drou.departure_time >= '${start}' `;
    }

    if (end) {
        query += `AND drou.departure_time <= '${end}' `;
    }

    return await handleQueryService(query, [id]);
};
