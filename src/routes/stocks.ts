import { Router, Request, Response } from "express";
import { connectToDatabase } from "../middleware/db";
import Binance from "node-binance-api";
import axios, { AxiosHeaders } from "axios";

const binance = new Binance().options({
  APIKEY: process.env.BINANCE_API_KEY,
  APISECRET: process.env.BINANCE_API_SECRET,
});



const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("List of all stocks");
});

router.get("/:symbol", async (req: Request, res: Response) => {
  const symbol = req.params.symbol;

  const connection = await connectToDatabase();
  if (!connection) {
    res.status(500).send("Error connecting to database");
    return;
  }

  try {
    const rows = await connection.query(
      "SELECT * FROM stocks WHERE symbol = ?",
      [symbol]
    );
    connection.end();
    const obj_rows = Object.values(JSON.parse(JSON.stringify(rows)));
    if (obj_rows.length === 0) {
      res.status(404).send("Stock not found");
      return;
    } else if (obj_rows.length == 2) {
      const element = JSON.parse(JSON.stringify(obj_rows[0]));
      let headers = {
        "Content-Type":"multipart/form-data",
        Accept:"application/json",
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
        "https://api.flaticon.com/v3/search/icons/priority?q=" + element[0].symbol,
        { headers: headers_get }
      );
      const icon_url = icon.data.data[0].images['512'];
      binance.prices(symbol + "USDT", (error: any, ticker: any) => {
        const result = {
          info: element[0],
          icon: icon_url,
          ticker,
        };
        res.json(result);
      });
    }
  } catch (error) {
    connection.end();
    console.error("Error querying the database:", error);
    res.status(500).send("Error querying the database");
  }
});

router.get("/try/:symbol", async (req: Request, res: Response) => {
  const symbol = req.params.symbol;
  const test = binance.prices(symbol, (error: any, ticker: any) => {
    res.json(ticker);
  });
});

export default router;
