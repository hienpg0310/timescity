import { Router } from "express";

import videoStreamRoute from "./ProtectedRoutes/videoStream.route.js";

const router = Router();
router.use("/stream", videoStreamRoute);

// #endregion

export default router;
