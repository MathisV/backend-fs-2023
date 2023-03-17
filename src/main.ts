import express, { Request, Response, NextFunction } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Charge les variables d'environnement du fichier .env
dotenv.config();

const app = express();
const port = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

// Configuration de la base de données MariaDB
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

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

// Connexion à la base de données MariaDB
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    //console.log('Connected to MariaDB');
    return connection;
  } catch (error) {
    console.error('Error connecting to MariaDB:', error);
    return null;
  }
}

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

// Route pour récupérer la liste des stocks
app.get('/stocks/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol;

  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).send('Error connecting to database');
    return;
  }

  try {
    const rows = await connection.query('SELECT * FROM stocks WHERE symbol = ?', [symbol]);
    connection.end();

    if (rows[0] === null) {
      res.status(404).send('Stock not found');
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    connection.end();
    console.error('Error querying the database:', error);
    res.status(500).send('Error querying the database');
  }
});

app.listen(port, () => {
  console.log(`Le serveur est en écoute sur http://localhost:${port}`);
});
