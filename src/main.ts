import express, { Request, Response, NextFunction } from 'express';
import routes from './routes';
import dotenv from 'dotenv';
import * as db from './middleware/db';
import * as login from './routes/login';
import * as token from './middleware/token';

// Charge les variables d'environnement du fichier .env
dotenv.config();

export const env = process.env;
export const app = express();
const port = 3000;
export const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

interface Stock {
  id: number;
  symbol: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware pour analyser le contenu JSON des requêtes entrantes
app.use(express.json());

app.use('/api', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  next(err);
});

// Route protégée par authentification
app.get('/protected', token.authenticateToken, (req, res) => {
  res.json({ message: 'Accès autorisé', user: req.user });
});

app.listen(port, () => {
  console.log(`Le serveur est en écoute sur http://localhost:${port}`);
});
