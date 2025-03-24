/** @format */

import connectDatabase from "../../config/database.config.js";
import { handleQueryService } from "./index.js";

export const getPassengerByPhoneService = async (passengerPhone) => {
  try {
    const result = await connectDatabase.query(
      `SELECT * FROM passengers WHERE phone = $1`,
      [passengerPhone]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching route metadata: " + error.message);
  }
};

export const getPassengerRoutesService = async (
  passengerId,
  pageSizeNum,
  skip
) => {
  try {
    const result = await connectDatabase.query(
      `WITH filtered_routes AS (
                SELECT 
                r.*,
                dr.id AS request_id,
                dr.name AS request_name,
            dr.delivering_date,
            dr.guest_number
            FROM delivering_routes r
            JOIN delivering_requests dr ON dr.id = r.requestid
            WHERE $1 = ANY(r.passengers)
        ),
        paginated_routes AS (
        SELECT 
            fr.request_id,
            fr.request_name,
            fr.delivering_date,
            fr.guest_number,
            json_agg(
                jsonb_build_object(
                    'route_id', fr.id,
                    'departure_time', fr.departure_time,
                    'arrival_time', fr.arrival_time,
                    'departure_location', fr.departure_location,
                    'destination_location', fr.destination_location,
                    'type', fr.type,
                    'status', fr.status
                )
            ) AS routes,
            COUNT(*) OVER() AS total
            FROM filtered_routes fr
            GROUP BY fr.request_id, fr.request_name, fr.delivering_date, fr.guest_number
            ORDER BY fr.delivering_date DESC -- Adjust ordering as needed
            LIMIT $2 
            OFFSET $3 
        )
        SELECT * FROM paginated_routes;
        `,
      [passengerId, pageSizeNum, skip]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching route metadata: " + error.message);
  }
};

export const getAllPassengerService = async (
  page,
  pageSizeNum = 10,
  skip = 0,
  order = "desc",
  isdelete = "false"
) => {
  try {
    var query = "";
    if (page == 0) {
      query = `SELECT 
    psr.*,  
    COUNT(psr.*) OVER() AS total,
    jsonb_agg(
        jsonb_build_object(
            'note_type', passenger_note.note_type,
            'description', passenger_note.description
        )
    ) AS notes
FROM 
    passengers psr
LEFT JOIN 
    passenger_note ON psr.id = passenger_note.passenger_id
WHERE 
    psr.isdelete =${isdelete}
GROUP BY 
    psr.id
ORDER BY 
    psr.createat ${order};`;
    } else {
      query = `SELECT 
    psr.*, 
    COUNT(psr.*) OVER() AS total,
    jsonb_agg(
        jsonb_build_object(
            'note_type', passenger_note.note_type,
            'description', passenger_note.description
        )
    ) AS notes
FROM 
    passengers psr
LEFT JOIN 
    passenger_note ON psr.id = passenger_note.passenger_id
WHERE 
    psr.isdelete = ${isdelete}
GROUP BY 
    psr.id
ORDER BY 
    psr.createat ${order}
        LIMIT $1 OFFSET $2`;
    }

    const result = await connectDatabase.query(
      query,
      page == 0 ? null : [pageSizeNum, skip]
    );

    return result.rows;
  } catch (error) {
    console.error("Error fetching route metadata: " + error.message);
  }
};

export const getPassengerNoteService = async (passenger_id) => {
  const query = `
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'note_type', passenger_note.note_type,
                'description', passenger_note.description
            )
        ) AS notes
    FROM 
        passenger_note
    WHERE 
        passenger_note.passenger_id = $1
  `;

  try {
    const result = await connectDatabase.query(query, [passenger_id]);
    return result.rows[0].notes; // Trả về danh sách ghi chú của hành khách
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw error;
  }
};

export const createpassengerNoteService = async (table, payload) => {
  try {
    const result = await connectDatabase.query(
      `INSERT INTO ${table}(${Object.keys(payload).join(", ")}) 
      VALUES (${Array.from(
        { length: Object.keys(payload).length },
        (item, i) => `$${i + 1}`
      ).join(", ")}) RETURNING *`,
      Object.values(payload)
    );
    return result.rows;
  } catch (error) {
    console.error("Error inserting data into table: " + error.message);
  }
};
