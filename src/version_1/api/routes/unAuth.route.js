import express from "express";
import rateLimit from "express-rate-limit";
import { specialCharacterValidateMiddleware } from "../../middleware/specialCharacterValidate.middleware.config.js";
import { loginController, employeeLoginController, refreshTokenController, passengerLoginController, passengerSignupController } from "../controllers/auth/auth.controller.js";
import { getImgByNameController } from "../controllers/unauth/imgs.controller.js"
import { folderNames } from "../../utils/constants.js";
import { sendNotification } from "../services/notification.service.js"
import axios from "axios";
import { getByIdService } from "../services/index.js";
import { getAllDeliveryRequestsService, getRoutesByRequestIdService } from "../services/deliveringRequests.service.js";


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts, please try again later',
});

export const unAuthRoute = express.Router();

// unAuthRoute.post("/login", loginLimiter, loginController);
// unAuthRoute.post("/staff-login", loginLimiter, employeeLoginController);

// unAuthRoute.post("/login", loginController);
// unAuthRoute.post("/passenger-login", passengerLoginController);
// unAuthRoute.post("/passenger-signup", passengerSignupController);
// unAuthRoute.post("/staff-login", employeeLoginController);
// unAuthRoute.post("/send-notification", async (req, res) => {
//   try {

//         const dataRows = await getByIdService("delivering_requests", "2ced79b6-487f-4428-b435-ff16287bb2b5");
//         const routeData = await getRoutesByRequestIdService("2ced79b6-487f-4428-b435-ff16287bb2b5", 0, 10, "desc", "false", 10)

//     await sendNotification(req.body.driverid, {
//       data: {
//         title: "Yêu cầu đón khách",
//         body: "Bạn có một yêu cầu đón khách mới",
//         type: "CreateJourney",
//         ...dataRows[0],
//         routes: routeData
//       }
//     });

//     return res.json({
//       status: 200,
//       message: "Notification sent successful",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: error.message,
//     });
//   }
// });
// unAuthRoute.get("/suggest-location", async (req, res) => {
//   try {
//     const response = await axios.get("https://maps.googleapis.com/maps/api/place/autocomplete/json?input=202 Lý Chính Thắng&radius=50000&key=AIzaSyCkZk4WVh_Sq3EgGcqJy7EGC8_Q0juvYwA")
//     console.log(response.data, "ưlmve");

//     return res.json({
//       status: 200,
//       message: "Data sent successful",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: error.message,
//     });
//   }
// });

// unAuthRoute.post("/refresh-token", refreshTokenController);
// for (const [key, value] of Object.entries(folderNames)) {
//   if (key != folderNames.assests) {
//     unAuthRoute.get(`/image/${value}/:id`, specialCharacterValidateMiddleware, getImgByNameController);
//   }
// }
