require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const ALPACA_API_KEY_ID = process.env.ALPACA_API_KEY_ID;
const ALPACA_API_SECRET_KEY = process.env.ALPACA_API_SECRET_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'watchlist.db'));

// Create watchlist table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Alpaca API base URLs
const ALPACA_DATA_URL = 'https://data.alpaca.markets';
const ALPACA_API_URL = 'https://paper-api.alpaca.markets';

// Alpaca API headers helper
const getAlpacaHeaders = () => ({
  'APCA-API-KEY-ID': ALPACA_API_KEY_ID,
  'APCA-API-SECRET-KEY': ALPACA_API_SECRET_KEY
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Search for stocks
app.get('/api/stocks/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    if (!ALPACA_API_KEY_ID || !ALPACA_API_SECRET_KEY) {
      return res.status(500).json({ error: 'API keys not configured' });
    }

    // Get all active US equity assets from Alpaca
    const response = await axios.get(`${ALPACA_API_URL}/v2/assets`, {
      headers: getAlpacaHeaders(),
      params: {
        status: 'active',
        asset_class: 'us_equity'
      }
    });

    // Filter assets based on search query (symbol or name)
    const searchTerm = query.toUpperCase();
    const filteredAssets = response.data
      .filter(asset =>
        asset.symbol.toUpperCase().includes(searchTerm) ||
        asset.name.toUpperCase().includes(searchTerm)
      )
      .slice(0, 50) // Limit to 50 results
      .map(asset => ({
        symbol: asset.symbol,
        description: asset.name,
        type: asset.class,
        displaySymbol: asset.symbol
      }));

    res.json({ result: filteredAssets, count: filteredAssets.length });
  } catch (error) {
    console.error('Error searching stocks:', error.message);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

// Get stock quote (current price)
app.get('/api/stocks/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!ALPACA_API_KEY_ID || !ALPACA_API_SECRET_KEY) {
      return res.status(500).json({ error: 'API keys not configured' });
    }

    // Use Alpaca's snapshot endpoint for comprehensive data
    const response = await axios.get(
      `${ALPACA_DATA_URL}/v2/stocks/${symbol.toUpperCase()}/snapshot`,
      { headers: getAlpacaHeaders() }
    );

    const snapshot = response.data;
    const latestTrade = snapshot.latestTrade;
    const prevDaily = snapshot.prevDailyBar;
    const dailyBar = snapshot.dailyBar;

    // Transform to match Finnhub format for frontend compatibility
    const transformedData = {
      c: latestTrade?.p || dailyBar?.c || 0, // current price
      d: latestTrade?.p && prevDaily?.c ? latestTrade.p - prevDaily.c : 0, // change
      dp: latestTrade?.p && prevDaily?.c ? ((latestTrade.p - prevDaily.c) / prevDaily.c) * 100 : 0, // percent change
      h: dailyBar?.h || 0, // high
      l: dailyBar?.l || 0, // low
      o: dailyBar?.o || 0, // open
      pc: prevDaily?.c || 0 // previous close
    };

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching stock quote:', error.message);
    res.status(500).json({ error: 'Failed to fetch stock quote' });
  }
});

// Get company profile (basic info from assets)
app.get('/api/stocks/profile/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!ALPACA_API_KEY_ID || !ALPACA_API_SECRET_KEY) {
      return res.status(500).json({ error: 'API keys not configured' });
    }

    const response = await axios.get(
      `${ALPACA_API_URL}/v2/assets/${symbol.toUpperCase()}`,
      { headers: getAlpacaHeaders() }
    );

    const asset = response.data;

    // Transform to basic profile format
    const profile = {
      name: asset.name,
      ticker: asset.symbol,
      exchange: asset.exchange,
      tradable: asset.tradable,
      status: asset.status
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching company profile:', error.message);
    res.status(500).json({ error: 'Failed to fetch company profile' });
  }
});

// Get all watchlist items
app.get('/api/watchlist', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM watchlist ORDER BY added_at DESC');
    const watchlist = stmt.all();
    res.json(watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error.message);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// Add stock to watchlist
app.post('/api/watchlist', (req, res) => {
  try {
    const { symbol, name } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const stmt = db.prepare('INSERT INTO watchlist (symbol, name) VALUES (?, ?)');
    const result = stmt.run(symbol.toUpperCase(), name || null);

    res.status(201).json({
      id: result.lastInsertRowid,
      symbol: symbol.toUpperCase(),
      name: name || null,
      message: 'Stock added to watchlist'
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Stock already in watchlist' });
    }
    console.error('Error adding to watchlist:', error.message);
    res.status(500).json({ error: 'Failed to add stock to watchlist' });
  }
});

// Remove stock from watchlist
app.delete('/api/watchlist/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const stmt = db.prepare('DELETE FROM watchlist WHERE symbol = ?');
    const result = stmt.run(symbol.toUpperCase());

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Stock not found in watchlist' });
    }

    res.json({ message: 'Stock removed from watchlist' });
  } catch (error) {
    console.error('Error removing from watchlist:', error.message);
    res.status(500).json({ error: 'Failed to remove stock from watchlist' });
  }
});

// Get watchlist with current prices
app.get('/api/watchlist/prices', async (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM watchlist ORDER BY added_at DESC');
    const watchlist = stmt.all();

    if (!ALPACA_API_KEY_ID || !ALPACA_API_SECRET_KEY) {
      return res.json(watchlist.map(item => ({
        ...item,
        quote: null,
        error: 'API keys not configured'
      })));
    }

    // Fetch current prices for all watchlist items
    const watchlistWithPrices = await Promise.all(
      watchlist.map(async (item) => {
        try {
          const response = await axios.get(
            `${ALPACA_DATA_URL}/v2/stocks/${item.symbol}/snapshot`,
            { headers: getAlpacaHeaders() }
          );

          const snapshot = response.data;
          const latestTrade = snapshot.latestTrade;
          const prevDaily = snapshot.prevDailyBar;
          const dailyBar = snapshot.dailyBar;

          // Transform to match Finnhub format for frontend compatibility
          const quote = {
            c: latestTrade?.p || dailyBar?.c || 0,
            d: latestTrade?.p && prevDaily?.c ? latestTrade.p - prevDaily.c : 0,
            dp: latestTrade?.p && prevDaily?.c ? ((latestTrade.p - prevDaily.c) / prevDaily.c) * 100 : 0,
            h: dailyBar?.h || 0,
            l: dailyBar?.l || 0,
            o: dailyBar?.o || 0,
            pc: prevDaily?.c || 0
          };

          return {
            ...item,
            quote
          };
        } catch (error) {
          return {
            ...item,
            quote: null,
            error: 'Failed to fetch price'
          };
        }
      })
    );

    res.json(watchlistWithPrices);
  } catch (error) {
    console.error('Error fetching watchlist with prices:', error.message);
    res.status(500).json({ error: 'Failed to fetch watchlist with prices' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Alpaca API Keys configured: ${!!(ALPACA_API_KEY_ID && ALPACA_API_SECRET_KEY)}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
