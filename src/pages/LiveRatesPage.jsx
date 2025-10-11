// src/pages/LiveRatesPage.jsx
import React from 'react';
import PageHeader from '../components/PageHeader';
import LiveRates from '../components/LiveRates';

export default function LiveRatesPage() {
  return (
    <>
      <PageHeader title="Live Rates" />
      <div className="app-container">
        <div className="main-content">
          <LiveRates marketLabel="Local Market" />
        </div>
      </div>
    </>
  );
}
