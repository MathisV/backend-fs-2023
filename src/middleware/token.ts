import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { connectToDatabase } from './db';
import { JWT_SECRET, app } from '../main';

// Middleware pour vérifier le token Bearer
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
  
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, JWT_SECRET, (err: VerifyErrors | null, user: any) => {
      if (err) return res.sendStatus(403);
  
      req.user = user;
      next();
    });
  }
