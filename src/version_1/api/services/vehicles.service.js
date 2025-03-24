import { handleQueryService } from "./index.js";

export const getInsuranceVehicle = async (vehicleid) => {
  try {
    const query = `SELECT vi.purchase_date, vi.expired_date, vi.isactive, i.company_name, i.name, i.type
	            FROM vehicle_insurance vi JOIN vehicles v ON vi.vehicle_id = v.id JOIN insurance i ON vi.insurance_id = i.id
	            WHERE v.id = $1`;

    return await handleQueryService(query, [vehicleid]);
  } catch (error) {
    console.error("Error fetching route metadata: " + error.message);
  }
};

export const getAvailableVehiclesService = async (startTime, endTime, pageSizeNum = 10, skip = 0, isdelete = "false") => {
  try {
      const query = `SELECT dr.*, COUNT(dr.*) OVER() as total FROM vehicles dr WHERE dr.id NOT IN (
      SELECT DISTINCT rt.vehicleid
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
