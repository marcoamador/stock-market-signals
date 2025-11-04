import React, { useState, useEffect } from 'react';
import './App.css';
import api from './services/api';
import SearchBar from './components/SearchBar';
import Watchlist from './components/Watchlist';
import SearchResults from './components/SearchResults';

function App() {
  const [watchlist, setWatchlist] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch watchlist on component mount
  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const data = await api.getWatchlistWithPrices();
      setWatchlist(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch watchlist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchQuery('');
      return;
    }

    try {
      setLoading(true);
      setSearchQuery(query);
      const data = await api.searchStocks(query);
      setSearchResults(data.result || []);
      setError(null);
    } catch (err) {
      setError('Failed to search stocks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (symbol, name) => {
    try {
      await api.addToWatchlist(symbol, name);
      fetchWatchlist();
      setSearchResults([]);
      setSearchQuery('');
      setError(null);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Stock already in watchlist');
      } else {
        setError('Failed to add stock to watchlist');
      }
      console.error(err);
    }
  };

  const handleRemoveFromWatchlist = async (symbol) => {
    try {
      await api.removeFromWatchlist(symbol);
      fetchWatchlist();
      setError(null);
    } catch (err) {
      setError('Failed to remove stock from watchlist');
      console.error(err);
    }
  };

  const handleRefresh = () => {
    fetchWatchlist();
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>Stock Market Watchlist</h1>
          <p>Track your favorite stocks in real-time</p>
        </header>

        <SearchBar onSearch={handleSearch} />

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="close-btn">×</button>
          </div>
        )}

        {searchQuery && searchResults.length > 0 && (
          <SearchResults
            results={searchResults}
            onAdd={handleAddToWatchlist}
            loading={loading}
          />
        )}

        {searchQuery && searchResults.length === 0 && !loading && (
          <div className="no-results">
            No results found for "{searchQuery}"
          </div>
        )}

        <Watchlist
          watchlist={watchlist}
          onRemove={handleRemoveFromWatchlist}
          onRefresh={handleRefresh}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default App;
