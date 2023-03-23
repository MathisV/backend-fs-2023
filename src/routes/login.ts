import { Router, Request, Response } from 'express';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { connectToDatabase } from '../middleware/db';
import { JWT_SECRET, app } from '../main';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
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

export default router;