import connectDatabase from "../../config/database.config.js";

export const getCompanyByNameService = async (name) => {
    try {
        const result = await connectDatabase.query(
            `SELECT * FROM companies WHERE name LIKE '%$${name}%'`
        );
        return result.rows;
    } catch (error) {
        console.error("Error fetching route metadata: " + error.message);
    }
};