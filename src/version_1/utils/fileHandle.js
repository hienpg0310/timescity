import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { folderNames } from "./constants.js";
import bcrypt from "bcrypt";
import { encryptString } from "./hashData.js";

export function imgUpload(img, foldername, actor) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const baseDir = path.join(__dirname, `../../../${folderNames.assests}/${foldername}`);


    // const foldernameDir = path.join(baseDir, actor.name);
    // const name = encryptString({str: `${foldername}_${actor.id}`})
    const name = `${foldername}_${actor.id}`
    const fileName = `${name}.${img.name.split(".").pop()}`;

    // Ensure all directories exist
    [__dirname, baseDir
        // , foldernameDir
    ].forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });

    const finalFilePath = checkAndCreateFile();

    return finalFilePath;


    function checkAndCreateFile() {
        let uniqueFileName = fileName;
        // let finalFilePath = path.join(foldernameDir, uniqueFileName);
        let finalFilePath = path.join(baseDir, uniqueFileName);

        // Check if the file already exists, and generate a unique name if it does
        let counter = 1;
        while (fs.existsSync(finalFilePath)) {
            const ext = path.extname(fileName);
            const baseName = path.basename(fileName, ext);
            uniqueFileName = `${baseName}(${counter})${ext}`;
            // finalFilePath = path.join(foldernameDir, uniqueFileName);
            finalFilePath = path.join(baseDir, uniqueFileName);
            counter++;
        }

        img.mv(finalFilePath, (err) => {
            if (err) console.error(`Failed to move file: ${err.message}`);
        });

        return finalFilePath;
    }
}