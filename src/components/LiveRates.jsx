// src/components/LiveRates.jsx
import React, { useEffect, useState } from 'react';
import './LiveRates.css';
import { getMetalRates, formatCurrencyINR } from '../services/metalRates';

const POLL_MS = 8000; // 8s

export default function LiveRates({ marketLabel = 'Local Market', pollMs = POLL_MS, useLiveApi = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function refresh() {
    try {
      setError(null);
      const res = await getMetalRates({ market: marketLabel, useLiveApi });
      setData(res);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch rates');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [marketLabel, pollMs, useLiveApi]);

  return (
    <div className="live-rates">
      <div className="live-rates__header">
        <h3 className="live-rates__title">Live Metal Rates</h3>
        <div className="live-rates__updated">
          {loading ? 'Loading…' : error ? error : `Updated: ${new Date(data?.updatedAt || Date.now()).toLocaleTimeString()}`}
        </div>
      </div>

      <div className="live-rates__table-wrap">
        <table className="live-rates__table">
          <thead>
            <tr>
              <th>Metal</th>
              <th>Central</th>
              <th>India</th>
              <th>Local</th>
            </tr>
          </thead>
          <tbody>
            {data && (
              <>
                <tr>
                  <td>Gold (per g)</td>
                  <td>{formatCurrencyINR(data.gold.central)}</td>
                  <td>{formatCurrencyINR(data.gold.india)}</td>
                  <td>{formatCurrencyINR(data.gold.local)}</td>
                </tr>
                <tr>
                  <td>Silver (per g)</td>
                  <td>{formatCurrencyINR(data.silver.central)}</td>
                  <td>{formatCurrencyINR(data.silver.india)}</td>
                  <td>{formatCurrencyINR(data.silver.local)}</td>
                </tr>
                <tr>
                  <td>Platinum (per g)</td>
                  <td>{formatCurrencyINR(data.platinum.central)}</td>
                  <td>{formatCurrencyINR(data.platinum.india)}</td>
                  <td>{formatCurrencyINR(data.platinum.local)}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
