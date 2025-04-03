// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import apiRouter from "./version_1/api/routes/index.js";
// import bodyParser from "body-parser";
// import fileUpload from "express-fileupload";
// import path from "path";
// import { fileURLToPath } from "url";
// import cookieParser from "cookie-parser";
// import { folderNames } from "./version_1/utils/constants.js";
// import { initializeApp, cert } from "firebase-admin/app";
// import { readFileSync } from "fs";
// import http from "http";

// dotenv.config();
// const port = process.env.PORT || 5001;
// const app = express();
// // const serviceAccount = JSON.parse(
// //   readFileSync(
// //     "./src/version_1/utils/drivermanagement-d9fb7-firebase-adminsdk-fbsvc-b9b747be3b.json",
// //     "utf8"
// //   )
// // );

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const server = http.createServer(app);
// app.use(cors());

// // initializeApp({
// //   credential: cert(serviceAccount),
// // });

// app.use(fileUpload());
// app.use(cors({ credentials: true }));
// for (const [key, value] of Object.entries(folderNames)) {
//   if (key != folderNames.assests) {
//     app.use(
//       express.static(path.join(__dirname, `../${folderNames.assests}/${value}`))
//     );
//   }
// }
// app.use(cookieParser());
// app.use(bodyParser.json());
// app.use(
//   bodyParser.urlencoded({
//     extended: false,
//   })
// );

// app.use(apiRouter);
// app.use("*", (req, res) => {
//   res.status(400);
//   res.json({
//     message: "Error path",
//   });
// });

// server.listen(port, () => {
//   console.log(`🚀 Server is running on ${port}`);
// });


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./version_1/api/routes/index.js";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import { folderNames } from "./version_1/utils/constants.js";
import http from "http";
import { readFileSync } from "fs";

dotenv.config();

const port = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ credentials: true }));
app.use(fileUpload());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Static Files
if (folderNames?.assests) {
  Object.entries(folderNames).forEach(([key, value]) => {
    if (key !== folderNames.assests) {
      app.use(
        express.static(
          path.join(__dirname, `../${folderNames.assests}/${value}`)
        )
      );
    }
  });
}

// API Routes
app.use(apiRouter);

// 404 Error Handler
app.use("*", (req, res) => {
  res.status(400).json({ message: "Error path" });
});

// Start Server
server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});
