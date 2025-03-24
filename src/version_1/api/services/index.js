import connectDatabase from "../../config/database.config.js";

export const handleQueryService = async (query, values = undefined) => {
  try {
    const result = values
      ? await connectDatabase.query(query, values)
      : await connectDatabase.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching route metadata: " + error.message);
  }
};

export const getAllService = async (
  table,
  page,
  pageSizeNum = 10,
  skip = 0,
  order = "desc",
  isdelete = "false"
) => {
  try {
    var query = "";
    if (page == 0) {
      query = `SELECT tbl.*, COUNT(tbl.*) OVER() as total FROM ${table} tbl
        WHERE isdelete = ${isdelete} 
        ORDER BY tbl.createat ${order}`;
    } else {
      query = `SELECT tbl.*, COUNT(tbl.*) OVER() as total FROM ${table} tbl
        WHERE isdelete = ${isdelete} 
        ORDER BY tbl.createat ${order} 
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

export const getByIdService = async (table, id) => {
  try {    
    const result = await connectDatabase.query(
      `SELECT * FROM ${table} WHERE id = $1`,
      [id]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching route metadata: " + error.message);
  }
};

export const createService = async (table, payload) => {
  try {
    const result = await connectDatabase.query(
      `INSERT INTO ${table}(${Object.keys(payload).join(
        ", "
      )}) VALUES (${Array.from(
        { length: Object.keys(payload).length },
        (item, i) => `$${i + 1}`
      ).join(", ")}) RETURNING *`,
      Object.values(payload)
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching route metadata: " + error.message);
  }
};

export const updateService = async (table, fields, values) => {
  try {
    let query = `UPDATE ${table} SET `;
    query += fields.join(", ");
    query += ` WHERE id = $${fields.length + 1} RETURNING *`;

    const result = await connectDatabase.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Error fetching route metadata: " + error.message);
  }
};
