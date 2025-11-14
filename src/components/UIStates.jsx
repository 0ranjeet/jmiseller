import React from 'react';
import Header from './Header';

export const LoadingState = ({ title }) => (
  <div className="orders-container">
    <Header title={title} />
    <div className="loading-state">Loading...</div>
  </div>
);

export const ErrorState = ({ title, error }) => (
  <div className="orders-container">
    <Header title={title} />
    <div className="error-state">
      <p className="error">{error}</p>
      <button onClick={() => window.location.reload()} className="retry-btn">
        Try Again
      </button>
    </div>
  </div>
);

export const EmptyState = ({ message }) => (
  <div className="empty-state">
    <p>{message}</p>
  </div>
);