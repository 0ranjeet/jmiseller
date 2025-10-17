// src/pages/LiveRatesPage.jsx
import React from 'react';
import PageHeader from '../components/PageHeader';
import LiveRates from '../components/LiveRates';

export default function LiveRatesPage() {
  return (
    <>
      <PageHeader title="Live Rates" />
      <LiveRates marketLabel="Local Market" />

    </>
  );
}
