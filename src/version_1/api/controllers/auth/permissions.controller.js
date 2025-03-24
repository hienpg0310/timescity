import { getAllService } from "../../services/index.js";
const dbTable = "permissions";

export const getPermissionsController = async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            order = "desc",
            isdelete = "false",
        } = req.query;

        if (
            isNaN(Number(page)) ||
            isNaN(Number(pageSize)) ||
            Number(pageSize) < 1 ||
            (order != "asc" && order != "desc")
        ) {
            return res.status(400).json({ message: "Invalid parameter" });
        }

        const pageNum = parseInt(page, 10);
        const pageSizeNum = parseInt(pageSize, 10);
        const skip = (pageNum - 1) * pageSizeNum;

        const permissions = await getAllService(
            dbTable,
            pageNum,
            pageSizeNum,
            skip,
            order,
            isdelete
        );
        const total = permissions.length > 0 ? permissions[0].total : 0;

        return res.status(200).json({
            permissions: permissions,
            total: total,
            currentPage: pageNum == 0 ? 1 : pageNum,
            totalPages: pageNum == 0 ? 1 : Math.ceil(total / pageSizeNum),
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};
