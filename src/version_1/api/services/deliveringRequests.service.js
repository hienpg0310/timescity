import { handleQueryService } from "./index.js";
import connectDatabase from "../../config/database.config.js";

export const getRoutesByRequestIdService = async (requestid, page, pageSizeNum, order, isdelete, skip) => {
    try {
        var query = "";
        if (page == 0) {
            query = `SELECT tbl.*, COUNT(tbl.*) OVER() as total, 
            dr.first_name as driver_first_name, dr.last_name as driver_last_name,
            vh.model as vehicle_model, vh.number as vehicle_number, vh.type as vehicle_type, vh.fuel as vehicle_fuel, vh.capacity as vehicle_capacity, vh.insurance_date as vehicle_insurance_date 
            FROM delivering_routes tbl JOIN drivers dr ON tbl.driverid = dr.id JOIN vehicles vh ON tbl.vehicleid = vh.id
        WHERE tbl.isdelete = ${isdelete} AND tbl.requestid = '${requestid}'
        ORDER BY tbl.createat ${order}`;        
        } else {
            query = `SELECT tbl.*, COUNT(tbl.*) OVER() as total, 
            dr.first_name as driver_first_name, dr.last_name as driver_last_name,
            vh.model as vehicle_model, vh.number as vehicle_number, vh.type as vehicle_type, vh.fuel as vehicle_fuel, vh.capacity as vehicle_capacity, vh.insurance_date as vehicle_insurance_date 
            FROM delivering_routes tbl JOIN drivers dr ON tbl.driverid = dr.id JOIN vehicles vh ON tbl.vehicleid = vh.id
        WHERE tbl.isdelete = ${isdelete} AND tbl.requestid = '${requestid}'
        ORDER BY tbl.createat ${order} 
        LIMIT $1 OFFSET $2`;
        }        

        return await handleQueryService(query, page == 0 ? undefined : [pageSizeNum, skip]);
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);        
    }
};

export const getAllDeliveryRequestsService = async (
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
          ORDER BY tbl.delivering_date ${order}`;
      } else {
        query = `SELECT tbl.*, COUNT(tbl.*) OVER() as total FROM ${table} tbl
          WHERE isdelete = ${isdelete} 
          ORDER BY tbl.delivering_date ${order} 
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
  