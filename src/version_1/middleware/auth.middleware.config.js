import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { getIdByAccessTokenService, getRouteMetadataService } from "../api/services/auth.service.js";

dotenv.config();

export const authMiddleware = async (req, res, next) => {
  const csrfToken = req.headers['x-csrf-token'];

  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).send('No token provided');

  const accessToken = authHeader.split(' ')[1]
  if (!accessToken) return res.status(401).json({ message: 'No access token provided' });

  try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_PRIVATE_KEY)    
    const idRows = await getIdByAccessTokenService(accessToken, decoded.id)
    if (!idRows.length > 0) return res.status(403).json({ message: 'Invalid token' })
    if (!csrfToken || csrfToken !== idRows[0].csrf_token) {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }

    // if (decoded.ip !== req.ip || decoded.userAgent !== req.headers['user-agent']) {
    //   return res.status(403).json({ message: 'Invalid or expired token' });
    // }

    req.user = decoded;
    const routeName = req.baseUrl + req.path;
    const { permissions } = await getRouteMetadataService(routeName);

    const userPermissions = req.user.permissions;
    const hasRequiredPermission = permissions.length === 0 || permissions.some(permission => userPermissions.includes(permission));

    if (!hasRequiredPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  } catch (error) {
    if (error.message == "jwt expired") {
      return res.status(403).json({ message: error.message, error: error.message });
    } else {
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
};