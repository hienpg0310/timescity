/** @format */

import connectDatabase from "../../config/database.config.js";
import { handleQueryService } from "./index.js";

export const getAllPassengerRegistrationsService = async (
  page,
  pageSizeNum = 10,
  skip = 0,
  order = "desc",
  isdelete = "false"
) => {
  try {
    var query = "";
    if (page == 0) {
      query = `SELECT tbl.*, COUNT(tbl.*) OVER() as total, 
      pas.first_name as passenger_firstname, pas.last_name as passenger_lastname, pas.company_name as passenger_company
      FROM passenger_registrations tbl JOIN passengers pas ON tbl.passengerid = pas.id
        WHERE tbl.isdelete = ${isdelete} 
        ORDER BY tbl.createat ${order}`;
    } else {
      query = `SELECT tbl.*, COUNT(tbl.*) OVER() as total, 
      pas.first_name as passenger_firstname, pas.last_name as passenger_lastname, pas.company_name as passenger_company
      FROM passenger_registrations tbl JOIN passengers pas ON tbl.passengerid = pas.id
        WHERE tbl.isdelete = ${isdelete} 
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