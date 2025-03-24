export const isUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
};

export const validatePagination = (req) => {
    const { page = 1, pageSize = 10, order = "desc", isdelete = "false" } = req.query;

    if (isNaN(Number(page)) || isNaN(Number(pageSize)) || Number(pageSize) < 1 ||
        (order !== "asc" && order !== "desc")) {
        return { error: "Invalid parameter", status: 400 };
    }

    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    return { pageNum, pageSizeNum, order, isdelete, skip };
};

export const convertToUnixTimestamp = (dateString) => {
    const date = new Date(dateString); // Parse the string
    if (isNaN(date.getTime())) {
       console.error('Invalid date format. Use YYYY-MM-DD hh:mm:ss.');
    }
    return Math.floor(date.getTime() / 1000); // Convert to Unix timestamp
};