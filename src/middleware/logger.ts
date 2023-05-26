import { NextFunction, Request, Response } from "express";

// Logger function to log the date and hour, request method, path, ipv4 and response code  to the console
export const logger = (req: Request, res: Response, next: NextFunction) => {
    if (res.statusCode >= 400) {
        console.log(`[${new Date().toISOString()}] WARN - ${req.method} - ${req.originalUrl} - ${req.ip} => ${res.statusCode}`);   
    } else if (res.statusCode >= 200) {
        console.log(`[${new Date().toISOString()}] INFO - ${req.method} - ${req.originalUrl} - ${req.ip} => ${res.statusCode}`);
    } else if (res.statusCode >= 500) {
        console.log(`[${new Date().toISOString()}] ERROR - ${req.method} - ${req.originalUrl} - ${req.ip} => ${res.statusCode}`);
    }
    next();
    }