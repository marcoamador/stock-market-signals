import React from 'react';
import './Watchlist.css';

function Watchlist({ watchlist, onRemove, onRefresh, loading }) {
  const formatPrice = (price) => {
    return price ? `$${price.toFixed(2)}` : 'N/A';
  };

  const formatChange = (change, percentChange) => {
    if (!change || !percentChange) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${percentChange.toFixed(2)}%)`;
  };

  const getChangeClass = (change) => {
    if (!change) return '';
    return change >= 0 ? 'positive' : 'negative';
  };

  return (
    <div className="watchlist">
      <div className="watchlist-header">
        <h2>My Watchlist</h2>
        <button onClick={onRefresh} className="refresh-btn" disabled={loading}>
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {watchlist.length === 0 ? (
        <div className="empty-watchlist">
          <div className="empty-icon">📊</div>
          <p>Your watchlist is empty</p>
          <p className="empty-subtitle">Search and add stocks to start tracking</p>
        </div>
      ) : (
        <div className="watchlist-grid">
          {watchlist.map((item) => (
            <div key={item.id} className="watchlist-item">
              <div className="item-header">
                <div>
                  <div className="item-symbol">{item.symbol}</div>
                  {item.name && <div className="item-name">{item.name}</div>}
                </div>
                <button
                  onClick={() => onRemove(item.symbol)}
                  className="remove-btn"
                  title="Remove from watchlist"
                >
                  ×
                </button>
              </div>

              {item.quote && item.quote.c ? (
                <div className="item-details">
                  <div className="price-section">
                    <div className="current-price">{formatPrice(item.quote.c)}</div>
                    <div className={`price-change ${getChangeClass(item.quote.d)}`}>
                      {formatChange(item.quote.d, item.quote.dp)}
                    </div>
                  </div>

                  <div className="stats-grid">
                    <div className="stat">
                      <span className="stat-label">Open</span>
                      <span className="stat-value">{formatPrice(item.quote.o)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">High</span>
                      <span className="stat-value">{formatPrice(item.quote.h)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Low</span>
                      <span className="stat-value">{formatPrice(item.quote.l)}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Prev Close</span>
                      <span className="stat-value">{formatPrice(item.quote.pc)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-data">
                  {item.error || 'Price data unavailable'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Watchlist;
