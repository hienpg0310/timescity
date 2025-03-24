import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import { folderNames } from "../../../utils/constants.js";

dotenv.config();

export const getImgByNameController = async (req, res) => {
    try {
        const { id } = req.params;
        const descryptImgStr = id
        const foldername = descryptImgStr.split("_")[0]
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const filePath = path.join(
            __dirname,
            `../../../../../${folderNames.assests}/${foldername}`,
            id
        );

        res.set({
            "Access-Control-Allow-Origin": "*",
            "Cross-Origin-Resource-Policy": "cross-origin",
        });

        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        } else {
            return res.status(500).json({
                message: "File not exist",
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const createImgController = async (req, res) => {
    try {
        let reqFile;

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send("No files were uploaded.");
        }

        reqFile = req.files.img;
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const uploadPath = path.join(
            __dirname,
            "../../../../imgs",
            reqFile.name
        );

        reqFile.mv(uploadPath, function (err) {
            if (err) return res.status(500).send(err);

            const fileUrl = `${process.env.BASE_URL}/image/${reqFile.name}`;

            // Send back the file URL as the response
            return res.status(200).json({
                imgPath: fileUrl, // Return the file URL
            });
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};
