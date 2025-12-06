import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define the shape of the decoded JWT payload
interface JwtPayload {
    userId: string;
    tenantId: string;
    email: string;
}

// Define an interface to extend the Express Request object with our custom fields
// This is necessary to attach tenantId and userId to the request
export interface AuthRequest extends Request {
  tenantId?: string;
  userId?: string;
}

// Ensure this matches the secret used in auth.service.ts and your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECURE_DEFAULT_SECRET'; 

/**
 * Middleware to verify JWT and extract tenant context (Authorization).
 * This protects the dashboard API endpoints.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    // 1. Check for token in the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required. Use format: Bearer [token]' });
    }

    // 2. Extract the token (removing "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // 3. Verify the token using the secret key
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        
        // 4. Attach tenantId and userId to the request object
        //    This is the core of Multi-Tenancy Authorization.
        (req as AuthRequest).tenantId = decoded.tenantId;
        (req as AuthRequest).userId = decoded.userId;

        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error);
        // Respond with 401 Unauthorized for bad/expired tokens
        return res.status(401).json({ message: 'Invalid or expired token.' }); 
    }
};