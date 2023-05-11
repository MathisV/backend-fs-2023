import { Router, Request, Response } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { connectToDatabase } from '../middleware/db';
import { JWT_SECRET, app } from '../main';
import { sha256 } from 'js-sha256';
import * as token from '../middleware/token';
import { logger } from '../middleware/logger';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
    // Vérifiez les identifiants de l'utilisateur ici (par exemple, recherchez l'utilisateur dans la base de données et vérifiez le mot de passe)
    // Pour l'instant, nous supposerons que les informations d'identification sont valides
  
    const user = {
      username: req.body.username,
      password: sha256(req.body.password),
    };

    // Vérifier si l'utilisateur existe dans la base de données et si le mot de passe est correct
    const connection = await connectToDatabase();
    if (!connection) {
      res.status(500).json({message: "Error connecting to database", status: 500});
      logger(req, res, () => {});
      return;
    }
    
    const rows = await connection.query(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [user.username, user.password]
    );
    const obj_rows = Object.values(JSON.parse(JSON.stringify(rows[0])));
    if (obj_rows.length === 0) {
      res.status(404).json({message: "User not found", status: 404});
      logger(req, res, () => {});
      return;
    } else if (obj_rows.length == 1) {
      const element = JSON.parse(JSON.stringify(obj_rows));

      // Générer un jeton d'accès
      const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
      //res.json({ accessToken });

      // Mettre à jour le bearer de l'utilisateur dans la base de données
      const update = await connection.query(
        "UPDATE users SET bearer = ? WHERE username = ?",
        [accessToken, user.username]
      );
      connection.end();
      const result = {
        status: 200,
        message: 'Login successful',
        token: accessToken,
      }
      res.json(result);
      logger(req, res, () => {});
    }
  });


router.post('/register', async (req: Request, res: Response) => {
  const user = {
    username: req.body.username,
    password: sha256(req.body.password),
  };
  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).json({message: "Error connecting to database", status: 500});
    return;
  }

  // check id username already exists
  const rows = await connection.query(
    "SELECT * FROM users WHERE username = ?",
    [user.username]
  );
  const obj_rows = Object.values(JSON.parse(JSON.stringify(rows[0])));
  console.log(obj_rows[0]);
  console.log(obj_rows.length);
  if (obj_rows.length != 0) {
    res.status(409).json({message: "Username already exists", status: 409});
    return;
  } else
  {
    const reg = await connection.query(
      "INSERT INTO users (username, password, bearer) VALUES (?, ?, 'null')",
      [user.username, user.password]
    );
    connection.end();
    if (reg) {
      res.status(201).json({message: "User created", status: 201});
      return;
    } 
  }
});

router.post('/logout', token.authenticateToken, async (req: Request, res: Response) => {
  // logout user with bearer
  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).json({message: "Error connecting to database", status: 500});
    return;
  }
  const rows = await connection.query(
    "SELECT * FROM users WHERE bearer = ?",
    [req.headers['authorization']?.split(' ')[1]]
  );
  const obj_rows = Object.values(JSON.parse(JSON.stringify(rows[0])));
  if (obj_rows.length === 0) {
    res.status(404).json({message: "User not found", status: 404});
    return;
  } else if (obj_rows.length == 1) {
    const element = JSON.parse(JSON.stringify(obj_rows));
    console.log(element[0].username);

    // Mettre à jour le bearer de l'utilisateur dans la base de données
    const update = await connection.query(
      "UPDATE users SET bearer = ? WHERE username = ?",
      ['null', element[0].username]
    );
    connection.end();
    if (update) {
      console.log("Bearer updated");
      res.json({message: "Logout successful", status: 200});
    } else  {
      res.status(500).json({message: "Error on logout", status: 500});
      return;
    }
  }
});

router.get('/isAuthenticated', token.authenticateToken, (req: Request, res: Response) => {
  res.json({message: "Authenticated", status: 200});
});

export default router;