import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { connectToDatabase } from './db';
import { JWT_SECRET, app } from '../main';
import { logger } from './logger';

// Middleware pour vérifier le token Bearer
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided", status: 401 });
  }

  // Connect to database
  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).json({ message: "Error connecting to database", status: 500 });
    return;
  }

  const rows = await connection.query(
    "SELECT * FROM users WHERE bearer = ?",
    [token]
  );
  const obj_rows = Object.values(JSON.parse(JSON.stringify(rows[0])));
  if (obj_rows.length === 0) {
    res.status(404).json({ message: "User not found", status: 404 });
    return;
  } else {
    const element = JSON.parse(JSON.stringify(obj_rows));
    jwt.verify(token, JWT_SECRET, (err: VerifyErrors | null, user: any) => {
      if (err) return res.status(403).json({ message: "Expired token", status: 403 });

      req.user = user;
      next();
    });

  }

  logger(req, res, () => { });
}
