require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

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

// Finnhub API base URL
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

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

    if (!FINNHUB_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await axios.get(`${FINNHUB_BASE_URL}/search`, {
      params: {
        q: query,
        token: FINNHUB_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error searching stocks:', error.message);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

// Get stock quote (current price)
app.get('/api/stocks/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!FINNHUB_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
      params: {
        symbol: symbol.toUpperCase(),
        token: FINNHUB_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching stock quote:', error.message);
    res.status(500).json({ error: 'Failed to fetch stock quote' });
  }
});

// Get company profile
app.get('/api/stocks/profile/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    if (!FINNHUB_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await axios.get(`${FINNHUB_BASE_URL}/stock/profile2`, {
      params: {
        symbol: symbol.toUpperCase(),
        token: FINNHUB_API_KEY
      }
    });

    res.json(response.data);
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

    if (!FINNHUB_API_KEY) {
      return res.json(watchlist.map(item => ({
        ...item,
        quote: null,
        error: 'API key not configured'
      })));
    }

    // Fetch current prices for all watchlist items
    const watchlistWithPrices = await Promise.all(
      watchlist.map(async (item) => {
        try {
          const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
            params: {
              symbol: item.symbol,
              token: FINNHUB_API_KEY
            }
          });
          return {
            ...item,
            quote: response.data
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
  console.log(`API Key configured: ${!!FINNHUB_API_KEY}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
