import React, { useState } from 'react';
import { loadHistory, exportCSV } from './helpers';

export default function History({ onNav }) {
  const [history, setHistory] = useState(loadHistory);
  const [search, setSearch] = useState('');

  const filtered = history.filter(bill => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      bill.customerName.toLowerCase().includes(q) ||
      bill.mobileNumber.includes(q) ||
      bill.billNo.toString().includes(q) ||
      bill.date.toLowerCase().includes(q) ||
      (bill.tokenNo && bill.tokenNo.includes(q))
    );
  });

  const handleClearHistory = () => {
    if (window.confirm('Clear all bill history? This cannot be undone.')) {
      localStorage.removeItem('ll_bill_history');
      localStorage.removeItem('ll_bill_counter');
      setHistory([]);
    }
  };

  return (
    <div className="container page-fade-in">
      <div className="nav-bar">
        <button className="nav-btn" onClick={() => onNav('billing')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          New Bill
        </button>
        <button className="nav-btn active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          History
        </button>
        <button className="nav-btn" onClick={() => onNav('dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="17" y1="9" x2="9" y2="9" />
            <line x1="17" y1="15" x2="9" y2="15" />
          </svg>
          Dashboard
        </button>
      </div>

      <div className="history-header">
        <div>
          <h1 className="history-title">Bill History</h1>
          <span className="history-count">{filtered.length} bill{filtered.length !== 1 ? 's' : ''} {search && `matching "${search}"`}</span>
        </div>
        {history.length > 0 && (
          <div className="history-actions">
            <button className="btn-export" onClick={() => exportCSV(history)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 14, height: 14, marginRight: 6, verticalAlign: 'middle'}}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
            <button className="btn-clear-history" onClick={handleClearHistory}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 14, height: 14, marginRight: 6, verticalAlign: 'middle'}}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear All
            </button>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="history-search">
          <input type="text" placeholder="Search by name, phone, bill no, or date..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width: 48, height: 48, stroke: 'var(--ink-faint)'}}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="history-empty-text">{search ? 'No bills match your search' : 'No bills yet'}</div>
          <div className="history-empty-sub">{search ? 'Try a different search term' : 'Bills will appear here after you send them via WhatsApp'}</div>
        </div>
      ) : (
        <div className="history-list">
          {filtered.map((bill, idx) => (
            <div key={`${bill.billNo}-${idx}`} className="history-item">
              <div className="history-item-header">
                <span className="history-bill-no">Bill #{bill.billNo}</span>
                <div className="history-meta">
                  {bill.tokenNo && <span>Token {bill.tokenNo}</span>}
                  <span>{bill.date}</span>
                  <span>{bill.time}</span>
                  {bill.deliveryDate && (
                    <span style={{display: 'inline-flex', alignItems: 'center', gap: 4}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 12, height: 12}}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      {bill.deliverySlot || ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="history-item-body">
                <div className="history-customer">{bill.customerName || '—'}</div>
                <div className="history-phone" style={{display: 'flex', alignItems: 'center', gap: 6}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 12, height: 12, stroke: 'var(--ink-light)'}}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  {bill.mobileNumber || '—'}
                </div>
                <div className="history-services-list">
                  {(bill.services || []).map((s, i) => (
                    <span key={i} className="history-service-tag">{s.label}: {s.qty} {s.unit} — ₹{s.amount}</span>
                  ))}
                </div>
              </div>
              <div className="history-item-footer">
                {bill.delivered && (
                  <span className="delivered-badge" style={{marginRight:'auto', display: 'inline-flex', alignItems: 'center', gap: 4}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: 12, height: 12}}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Delivered
                  </span>
                )}
                <span className="history-total">Total: ₹{bill.total}/-</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <footer className="footer">Built for Laundry Lounge &nbsp;·&nbsp; Bangalore</footer>
    </div>
  );
}
