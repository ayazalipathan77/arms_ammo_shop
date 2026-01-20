import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyToken, JWTPayload } from '../utils/jwt';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        req.user = decoded;
        next();
    } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid or expired token' });
    }
};

export const authorizeRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication required' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(StatusCodes.FORBIDDEN).json({ message: 'Insufficient permissions' });
            return;
        }

        next();
    };
};
