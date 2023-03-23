import { Router, Request, Response } from 'express';
import { connectToDatabase } from '../middleware/db';
import request from 'request';

const router: Router = Router();

// List all stocks
router.get('/', async (req: Request, res: Response) => {
  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).send('Error connecting to database');
    return;
  }

  try {
    const rows = await connection.query('SELECT * FROM stocks');
    connection.end();

    if (rows[0] === null) {
      res.status(404).send('No stocks found');
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    connection.end();
    console.error('Error querying the database:', error);
    res.status(500).send('Error querying the database');
  }
});

// Get a specific stock
router.get('/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  
const url: string = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol='+symbol+'&apikey='+process.env.ALPHA_VANTAGE_API_KEY
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
      request.get(url, (err, call, data) => {
        if (err) {
          return console.log(err);
        }
        if (call.statusCode !== 200) {
          return console.log('Status:', call.statusCode);
        }
        // data is already parsed as JSON:
        
        res.json(JSON.parse(data));
      });
    }
  } catch (error) {
    connection.end();
    console.error('Error querying the database:', error);
    res.status(500).send('Error querying the database');
  }
});

// Add a new stock
router.post('/add', async (req: Request, res: Response) => {
  const symbol = req.body.symbol;

  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).send('Error connecting to database');
    return;
  }

  try {
    const rows = await connection.query('INSERT INTO stocks (symbol) VALUES (?)', [symbol]);
    connection.end();

  
    res.json({ message: 'Stock added', id: rows[0] });
  } catch (error) {
    connection.end();
    console.error('Error querying the database:', error);
    res.status(500).send('Error querying the database');
  }
});

// Delete a stock
router.delete('/delete/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol;

  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).send('Error connecting to database');
    return;
  }

  try {
    const rows = await connection.query('DELETE FROM stocks WHERE symbol = ?', [symbol]);
    connection.end();
    const result = JSON.parse(JSON.stringify(rows))
    if (result[0].affectedRows === 0) {
      res.status(404).send('Stock not found');
    } else {
      res.json({ message: 'Stock deleted' });
    }
  } catch (error) {
    connection.end();
    console.error('Error querying the database:', error);
    res.status(500).send('Error querying the database');
  }
});

export default router;