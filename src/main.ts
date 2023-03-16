import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import dotenv from 'dotenv';

// Charge les variables d'environnement du fichier .env
dotenv.config();

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware pour analyser le contenu JSON des requêtes entrantes
app.use(express.json());

// Middleware pour vérifier le token Bearer
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: VerifyErrors | null, user: any) => {
    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
}

// Route pour générer un token JWT
app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Vérifiez les identifiants de l'utilisateur ici (par exemple, recherchez l'utilisateur dans la base de données et vérifiez le mot de passe)
  // Pour l'instant, nous supposerons que les informations d'identification sont valides

  const user = {
    username: username,
  };

  const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
  res.json({ accessToken });
});

// Route protégée par authentification
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Accès autorisé', user: req.user });
});

app.listen(port, () => {
  console.log(`Le serveur est en écoute sur http://localhost:${port}`);
});
