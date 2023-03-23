import { Router, Request, Response } from 'express';
import { connectToDatabase } from '../middleware/db';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.send('List of all stocks');
});

router.get('/:id', async (req: Request, res: Response) => {
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

export default router;