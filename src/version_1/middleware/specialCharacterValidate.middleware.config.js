export const specialCharacterValidateMiddleware = (req, res, next) => {
    // const specialCharacterRegex = /[`!#$%^&()+\=\[\]{};'"\\|<>\?~]/;

    // const validateObject = (obj, location) => {
    //     for (const [key, value] of Object.entries(obj)) {
    //         if (
    //             typeof value === "string" &&
    //             specialCharacterRegex.test(value)
    //         ) {
    //             console.error(
    //                 `Special characters detected in '${location}' of '${
    //                     req.baseUrl + req.path
    //                 }' at '${key}'`
    //             );
    //             return `Invalid character`;
    //         }
    //     }
    //     return null;
    // };

    // let errorMessage = validateObject(req.body, "body");
    // if (errorMessage) {
    //     return res.status(400).json({ message: errorMessage });
    // }

    // errorMessage = validateObject(req.query, "query");
    // if (errorMessage) {
    //     return res.status(400).json({ message: errorMessage });
    // }

    next();
};
