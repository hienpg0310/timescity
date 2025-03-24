import { handleQueryService } from "./index.js";

export const checkIsInitiatedService = async () => {
  try {
    const query = `SELECT id
        FROM initiate_db 
        WHERE isdelete = false`;

    return await handleQueryService(query);
  } catch (error) {
    console.error("Error fetching route metadata: " + error.message);
  }
};
