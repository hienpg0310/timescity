import { Router } from "express";
// import { unAuthRoute } from "./unAuth.route.js";
// import { driversRoute } from "./ProtectedRoutes/drivers.route.js";
// import { employeesRoute } from "./ProtectedRoutes/employees.route.js";
// import { permissionsRoute } from "./ProtectedRoutes/permissions.route.js";
// import { rolesRoute } from "./ProtectedRoutes/roles.route.js";
// import { userDriverRoute } from "./ProtectedRoutes/userDriver.route.js";
// import { deliveringRequestsRoute } from "./ProtectedRoutes/deliveringRequests.route.js";
// import { passengersRoute } from "./ProtectedRoutes/passengers.route.js";
// import { vehiclesRoute } from "./ProtectedRoutes/vehicles.route.js";
// import { insuranceRoute } from "./ProtectedRoutes/insurance.route.js";
// import { userPassengerRoute } from "./ProtectedRoutes/userPassenger.route.js";
// import { mapRoute } from "./ProtectedRoutes/map.route.js";
import videoStreamRoute from "./ProtectedRoutes/videoStream.route.js";


const router = Router();
// router.use("/", unAuthRoute);

// #region Protected Route
// router.use("/permissions", permissionsRoute);
// router.use("/roles", rolesRoute);
// router.use("/drivers", driversRoute);
// router.use("/vehicles", vehiclesRoute);
// router.use("/userdriver", userDriverRoute);
// router.use("/user-passenger", userPassengerRoute);
// router.use("/employees", employeesRoute);
// router.use("/passengers", passengersRoute);
// router.use("/delivering-requests", deliveringRequestsRoute);
// router.use("/insurance", insuranceRoute);
// router.use("/map", mapRoute);
router.use("/stream", videoStreamRoute);

// #endregion

export default router;
