# Stock Market Watchlist Application

A full-stack web application for tracking stock prices in real-time. Built with React frontend and Express backend, integrated with Finnhub Stock API.

## Features

- **Real-time Stock Prices**: Get current stock prices and market data
- **Stock Search**: Search for stocks by symbol or company name
- **Watchlist Management**: Add and remove stocks from your personal watchlist
- **Persistent Storage**: Watchlist data is saved using SQLite database
- **Live Price Updates**: Refresh watchlist to get latest prices
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- Node.js
- Express.js
- SQLite (better-sqlite3)
- Axios for API calls
- Finnhub Stock API

### Frontend
- React 18
- Axios for HTTP requests
- CSS3 with modern styling

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Finnhub API key (free tier available)

## Getting Started

### 1. Get a Finnhub API Key

1. Visit [Finnhub.io](https://finnhub.io/)
2. Sign up for a free account
3. Get your API key from the dashboard

### 2. Clone and Install

```bash
# Install dependencies for all packages
npm run install:all
```

### 3. Configure Backend

```bash
# Create .env file in backend directory
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your Finnhub API key:
```
FINNHUB_API_KEY=your_api_key_here
PORT=5000
```

### 4. Run the Application

#### Option 1: Run Both (Recommended)
```bash
# Start both backend and frontend together
npm start
```

#### Option 2: Run Separately

Terminal 1 - Backend:
```bash
npm run start:backend
```

Terminal 2 - Frontend:
```bash
npm run start:frontend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Stock Endpoints

- `GET /api/stocks/search?query=<query>` - Search for stocks
- `GET /api/stocks/quote/:symbol` - Get current price for a stock
- `GET /api/stocks/profile/:symbol` - Get company profile

### Watchlist Endpoints

- `GET /api/watchlist` - Get all watchlist items
- `GET /api/watchlist/prices` - Get watchlist with current prices
- `POST /api/watchlist` - Add stock to watchlist
  - Body: `{ "symbol": "AAPL", "name": "Apple Inc." }`
- `DELETE /api/watchlist/:symbol` - Remove stock from watchlist

### Health Check

- `GET /api/health` - Check if server is running

## Usage

1. **Search for Stocks**: Use the search bar to find stocks by symbol (e.g., "AAPL") or company name (e.g., "Apple")

2. **Add to Watchlist**: Click the "+ Add to Watchlist" button on any search result

3. **View Prices**: Your watchlist displays:
   - Current price
   - Price change (amount and percentage)
   - Open, High, Low prices
   - Previous close price

4. **Refresh Prices**: Click the "Refresh" button to get the latest prices

5. **Remove Stocks**: Click the "×" button on any watchlist item to remove it

## Project Structure

```
stock-market-signals/
├── backend/
│   ├── server.js           # Express server and API routes
│   ├── package.json
│   ├── .env.example
│   └── watchlist.db        # SQLite database (created automatically)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.js
│   │   │   ├── SearchResults.js
│   │   │   ├── Watchlist.js
│   │   │   └── *.css
│   │   ├── services/
│   │   │   └── api.js      # API client
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   └── package.json
├── package.json
└── README.md
```

## Database Schema

### Watchlist Table

| Column    | Type      | Description                |
|-----------|-----------|----------------------------|
| id        | INTEGER   | Primary key (auto)         |
| symbol    | TEXT      | Stock symbol (unique)      |
| name      | TEXT      | Company name (optional)    |
| added_at  | DATETIME  | Timestamp when added       |

## Notes

- The free tier of Finnhub API has rate limits (60 calls/minute)
- Market data is delayed by 15 minutes for free tier
- The watchlist is stored locally in SQLite database
- Stock prices are fetched in real-time when you refresh

## Troubleshooting

### API Key Issues
- Make sure your `.env` file is in the `backend/` directory
- Verify your API key is valid on Finnhub.io
- Check that the key is properly set (no quotes or extra spaces)

### CORS Issues
- The backend runs on port 5000, frontend on 3000
- CORS is enabled in the backend for all origins
- Make sure both servers are running

### Database Issues
- The SQLite database file is created automatically
- Located at `backend/watchlist.db`
- Delete it to reset your watchlist

## Future Enhancements

- [ ] User authentication and multiple watchlists
- [ ] Price alerts and notifications
- [ ] Historical price charts
- [ ] Portfolio tracking with buy/sell prices
- [ ] News integration for stocks
- [ ] Export watchlist to CSV/JSON

## License

MIT

## Contributing

Feel free to open issues or submit pull requests!
