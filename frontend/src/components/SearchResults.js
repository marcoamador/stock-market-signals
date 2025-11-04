import React from 'react';
import './SearchResults.css';

function SearchResults({ results, onAdd, loading }) {
  if (loading) {
    return (
      <div className="search-results">
        <div className="loading">Searching...</div>
      </div>
    );
  }

  return (
    <div className="search-results">
      <h2>Search Results</h2>
      <div className="results-list">
        {results.map((stock) => (
          <div key={stock.symbol} className="result-item">
            <div className="stock-info">
              <div className="stock-symbol">{stock.symbol}</div>
              <div className="stock-description">{stock.description}</div>
              <div className="stock-type">{stock.type}</div>
            </div>
            <button
              onClick={() => onAdd(stock.symbol, stock.description)}
              className="add-btn"
            >
              + Add to Watchlist
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchResults;
