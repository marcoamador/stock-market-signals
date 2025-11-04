import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = {
  // Search for stocks
  searchStocks: async (query) => {
    const response = await axios.get(`${API_BASE_URL}/stocks/search`, {
      params: { query }
    });
    return response.data;
  },

  // Get stock quote
  getStockQuote: async (symbol) => {
    const response = await axios.get(`${API_BASE_URL}/stocks/quote/${symbol}`);
    return response.data;
  },

  // Get company profile
  getCompanyProfile: async (symbol) => {
    const response = await axios.get(`${API_BASE_URL}/stocks/profile/${symbol}`);
    return response.data;
  },

  // Get watchlist
  getWatchlist: async () => {
    const response = await axios.get(`${API_BASE_URL}/watchlist`);
    return response.data;
  },

  // Get watchlist with prices
  getWatchlistWithPrices: async () => {
    const response = await axios.get(`${API_BASE_URL}/watchlist/prices`);
    return response.data;
  },

  // Add to watchlist
  addToWatchlist: async (symbol, name) => {
    const response = await axios.post(`${API_BASE_URL}/watchlist`, {
      symbol,
      name
    });
    return response.data;
  },

  // Remove from watchlist
  removeFromWatchlist: async (symbol) => {
    const response = await axios.delete(`${API_BASE_URL}/watchlist/${symbol}`);
    return response.data;
  }
};

export default api;
