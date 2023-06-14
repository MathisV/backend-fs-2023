import { Router, Request, Response } from "express";
import { connectToDatabase } from "../middleware/db";
import Binance from "node-binance-api";
import axios, { AxiosHeaders } from "axios";
import * as token from '../middleware/token';
import { logger } from '../middleware/logger';

const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_API_SECRET,
});

const router = Router();

router.get("/", token.authenticateToken, async (req: Request, res: Response) => {
  const user_id = req.user.id;

  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).json({ message: "Error connecting to database", status: 500 });
    logger(req, res, () => { });
    return;
  }

  // Get all stocks for this user
  try {
    const stocks = await connection.query(
      "SELECT symbol FROM stocks WHERE id = ? ORDER BY orderIndex DESC",
      [user_id]
    );
    connection.end();
    res.json(stocks[0]);
    logger(req, res, () => { });
  } catch (error) {
    console.error("Error querying the database:", error);
    res.status(500).json({ message: "Error querying the database", status: 500 });
    logger(req, res, () => { });
  }
});

router.get("/:symbol", token.authenticateToken, async (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  const user_id = req.user.id;

  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).json({ message: "Error connecting to database", status: 500 });
    logger(req, res, () => { });
    return;
  }

  try {
    const rows = await connection.query(
      "SELECT * FROM stocks WHERE id = ? AND symbol = ?",
      [user_id, symbol]
    );
    connection.end();
    const obj_rows = Object.values(JSON.parse(JSON.stringify(rows[0])));
    if (obj_rows.length === 0) {
      res.status(404).json({ message: "Stock not found", status: 404 });
      logger(req, res, () => { });
      return;
    } else if (obj_rows.length == 1) {
      const element = JSON.parse(JSON.stringify(obj_rows[0]));
      let headers = {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      };
      // Axios post request on https://api.flaticon.com/v3/app/authentication
      const data = await axios.post(
        "https://api.flaticon.com/v3/app/authentication",
        {
          apikey: process.env.FLATICON_API,
        },
        { headers: headers }
      );
      let token: String = data.data.data.token;
      var headers_get = {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + token
      };
      // Use flaticon API to get icon of stock
      const icon = await axios.get(
        "https://api.flaticon.com/v3/search/icons/priority?q=" + symbol,
        { headers: headers_get }
      )
      const icon_url = icon.data.data[0].images['512'];
      binance.prices(symbol + "USDT", (error: any, ticker: any) => {
        const result = {
          info: element[0],
          icon: icon_url,
          symbol: symbol,
          price: ticker?.[symbol + "USDT"],
        };
        res.json(result);
        logger(req, res, () => { });
        return;
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Error querying the database", status: 500, error: error });
    logger(req, res, () => { });
    return;
  }
});

// POST method for adding a stock
router.post("/:symbol", token.authenticateToken, async (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  const user_id = req.user.id;

  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).json({ message: "Error connecting to database", status: 500 });
    logger(req, res, () => { });
    return;
  }

  // Check if the stock already exists for this user
  try {
    const rows = await connection.query(
      "SELECT * FROM stocks WHERE id = ? AND symbol = ?",
      [user_id, symbol]
    );
    const obj_rows = Object.values(JSON.parse(JSON.stringify(rows[0])));
    if (obj_rows.length != 0) {
      res.status(409).json({ message: "Stock already exists", status: 409 });
      logger(req, res, () => { });
      return;
    }
  } catch (error) {
    res.status(500).json({ message: "Error querying the database", status: 500 });
    logger(req, res, () => { });
    return;
  }

  // Get the current count of stocks for this user
  let stockCount;
  try {
    const countRows = await connection.query(
      "SELECT COUNT(*) AS count FROM stocks WHERE id = ?",
      [user_id]
    );
    stockCount = Object.values(JSON.parse(JSON.stringify(countRows[0])));
    stockCount = JSON.parse(JSON.stringify(stockCount[0])).count;
  } catch (error) {
    res.status(500).json({ message: "Error querying the database for count", status: 500 });
    logger(req, res, () => { });
    return;
  }
  console.log("Count: ", stockCount);
  // Insert the new stock into the database
  try {
    await connection.query(
      "INSERT INTO stocks (id, symbol, orderIndex) VALUES (?, ?, ?)",
      [user_id, symbol, stockCount]
    );
    connection.end();
    res.status(201).json({ message: "Stock added", status: 201 });
    logger(req, res, () => { });
    return;
  } catch (error) {
    res.status(500).json({ message: "Error inserting into the database", status: 500 });
    logger(req, res, () => { });
    return;
  }

  logger(req, res, () => { });
});

// DELETE method for removing a stock
router.delete("/:symbol", token.authenticateToken, async (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  const user_id = req.user.id;

  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).json({ message: "Error connecting to database", status: 500 });
    logger(req, res, () => { });
    return;
  }

  // Check if the stock exists for this user
  try {
    const rows = await connection.query(
      "SELECT * FROM stocks WHERE id = ? AND symbol = ?",
      [user_id, symbol]
    );
    const obj_rows = Object.values(JSON.parse(JSON.stringify(rows[0])));
    if (obj_rows.length === 0) {
      res.status(404).json({ message: "Stock does not exist for this user", status: 404 });
      logger(req, res, () => { });
      console.log("Stock does not exist for this user");
      return;
    }
  } catch (error) {
    res.status(500).json({ message: "Error querying the database", status: 500 });
    logger(req, res, () => { });
    return;
  }

  // Delete the stock from the database
  try {
    await connection.query(
      "DELETE FROM stocks WHERE id = ? AND symbol = ?",
      [user_id, symbol]
    );
    connection.end();
    res.status(200).json({ message: "Stock deleted", status: 200 });
    logger(req, res, () => { });
    return;
  } catch (error) {
    res.status(500).json({ message: "Error deleting from the database", status: 500 });
    logger(req, res, () => { });
    return;
  }
});

router.post("/:symbol/up", token.authenticateToken, async (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  const user_id = req.user.id;

  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).json({ message: "Error connecting to database", status: 500 });
    logger(req, res, () => { });
    return;
  }

  try {
    // Retrieve the current orderIndex for the stock and the max orderIndex
    const rows = await connection.query("SELECT orderIndex, (SELECT MAX(orderIndex) as maxOrderIndex FROM stocks WHERE id = ?) as maxOrderIndex FROM stocks WHERE id = ? AND symbol = ?", [user_id, user_id, symbol]);
    const obj_rows = Object.values(JSON.parse(JSON.stringify(rows[0])));
    console.log("obj_rows", obj_rows);
    if (obj_rows.length === 0) {
      res.status(404).json({ message: "Stock not found", status: 404 });
      logger(req, res, () => { });
      return;
    }
    let element = JSON.parse(JSON.stringify(obj_rows[0]));
    let currentOrderIndex = element.orderIndex;
    let maxOrderIndex = element.maxOrderIndex;
    console.log("pos", currentOrderIndex, maxOrderIndex);

    if (currentOrderIndex < maxOrderIndex) { // Ensure we're not already at the top
      // Swap the orderIndex with the one above
      await connection.query(
        "UPDATE stocks SET orderIndex = ? WHERE id = ? AND orderIndex = ?",
        [currentOrderIndex, user_id, currentOrderIndex + 1]
      );
      await connection.query(
        "UPDATE stocks SET orderIndex = ? WHERE id = ? AND symbol = ?",
        [currentOrderIndex + 1, user_id, symbol]
      );
      console.log("pos", currentOrderIndex, maxOrderIndex);
      res.status(200).json({ message: "Order updated", status: 200, currentOrderIndex: currentOrderIndex, maxOrderIndex: maxOrderIndex });
      logger(req, res, () => { });
    } else {
      res.status(409).json({ message: "Already at top", status: 409, currentOrderIndex: currentOrderIndex, maxOrderIndex: maxOrderIndex });
      logger(req, res, () => { });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating the database", status: 500 });
    logger(req, res, () => { });
  } finally {
    connection.end();
  }
});

router.post("/:symbol/down", token.authenticateToken, async (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  const user_id = req.user.id;

  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).json({ message: "Error connecting to database", status: 500 });
    logger(req, res, () => { });
    return;
  }

  try {
    // Retrieve the current orderIndex for the stock
    const rows = await connection.query(
      "SELECT orderIndex FROM stocks WHERE id = ? AND symbol = ?",
      [user_id, symbol]
    );
    const obj_rows = Object.values(JSON.parse(JSON.stringify(rows[0])));
    if (obj_rows.length === 0) {
      res.status(404).json({ message: "Stock not found", status: 404 });
      logger(req, res, () => { });
      return;
    }
    let currentOrderIndex = JSON.parse(JSON.stringify(obj_rows[0])).orderIndex;

    if (currentOrderIndex > 0) { // Ensure we're not already at the bottom
      // Swap the orderIndex with the one below
      await connection.query(
        "UPDATE stocks SET orderIndex = ? WHERE id = ? AND orderIndex = ?",
        [currentOrderIndex, user_id, currentOrderIndex - 1]
      );
      await connection.query(
        "UPDATE stocks SET orderIndex = ? WHERE id = ? AND symbol = ?",
        [currentOrderIndex - 1, user_id, symbol]
      );
      res.status(200).json({ message: "Order updated", status: 200, currentOrderIndex: currentOrderIndex });
      logger(req, res, () => { });
    } else {
      res.status(409).json({ message: "Already at bottom", status: 409, currentOrderIndex: currentOrderIndex });
      logger(req, res, () => { });
    }

  } catch (error) {
    res.status(500).json({ message: "Error updating the database", status: 500 });
    logger(req, res, () => { });
  } finally {
    connection.end();
  }
});



export default router;
