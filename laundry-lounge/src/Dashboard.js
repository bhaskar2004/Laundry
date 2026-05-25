import React, { useState, useEffect } from 'react';
import { loadHistory, saveHistory, formatISODate, getTodayISO, getTomorrowISO, shiftDate, DELIVERY_SLOTS } from './helpers';

export default function Dashboard({ onNav }) {
  const [viewDate, setViewDate] = useState(getTodayISO);
  const [history, setHistory] = useState(loadHistory);

  const todayISO = getTodayISO();
  const tomorrowISO = getTomorrowISO();
  const isToday = viewDate === todayISO;
  const isTomorrow = viewDate === tomorrowISO;
  const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatISODate(viewDate);

  const dayBills = history.filter(b => b.deliveryDate === viewDate);
  const pending = dayBills.filter(b => !b.delivered);
  const completed = dayBills.filter(b => b.delivered);
  const revenue = dayBills.reduce((s, b) => s + (b.total || 0), 0);

  const [toast, setToast] = useState(null);
  const [gatewayStatus, setGatewayStatus] = useState({ online: false, connected: false, qr: null });
  const [gatewayUrl, setGatewayUrl] = useState(() => localStorage.getItem('laundry_gateway_url') || 'http://localhost:5001');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(gatewayUrl);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${gatewayUrl}/status`);
        if (res.ok) {
          const data = await res.json();
          setGatewayStatus(data);
        } else {
          setGatewayStatus({ online: false, connected: false, qr: null });
        }
      } catch (e) {
        setGatewayStatus({ online: false, connected: false, qr: null });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [gatewayUrl]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    // Keep it visible for 4 seconds
    setTimeout(() => {
      setToast(prev => prev && prev.message === message ? null : prev);
    }, 4500);
  };

  const handleDeliver = (billNo) => {
    const updated = history.map(b => b.billNo === billNo ? { ...b, delivered: true, status: 'delivered' } : b);
    saveHistory(updated);
    setHistory(updated);
    showToast(`Order #${billNo} marked as delivered!`, 'success');
  };

  const handleNotifyReady = async (bill) => {
    const message = `*LAUNDRY LOUNGE* \n\nHello *${bill.customerName || 'Customer'}*,\nYour clothes from Bill *#${bill.billNo}* are ready for collection!\nTotal Amount: *₹${bill.total}/-*\n\nThank you for choosing Laundry Lounge!`;
    const phone = bill.mobileNumber;

    if (!phone || phone.length < 10) {
      showToast('Invalid customer mobile number.', 'error');
      return;
    }

    const updateHistoryState = () => {
      const updated = history.map(b => b.billNo === bill.billNo ? { ...b, status: 'ready' } : b);
      saveHistory(updated);
      setHistory(updated);
    };

    try {
      showToast('Sending background WhatsApp notification...', 'info');

      const response = await fetch(`${gatewayUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });

      if (response.ok) {
        updateHistoryState();
        showToast(`Ready alert sent to ${bill.customerName}!`, 'success');
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn('Gateway returned error:', errData);
        updateHistoryState();
        showToast('Gateway scanner required. Opening manual WhatsApp...', 'warning');
        const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (err) {
      console.warn('Could not contact WhatsApp gateway:', err);
      updateHistoryState();
      showToast('Gateway offline. Opening manual WhatsApp...', 'warning');
      const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const getSlotIcon = (slotId) => {
    switch (slotId) {
      case 'morning':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M6.34 17.66l2.83-2.83M17.66 6.34l-2.83 2.83" />
          </svg>
        );
      case 'afternoon':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        );
      case 'evening':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M17 18a6 6 0 0 0-9-5.65A6.002 6.002 0 0 0 2 12c0 3.3 2.7 6 6 6h9Z" />
            <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2" />
          </svg>
        );
      default:
        return null;
    }
  };

  const grouped = DELIVERY_SLOTS.map(slot => ({
    ...slot,
    bills: dayBills.filter(b => b.deliverySlot === slot.id),
  })).filter(g => g.bills.length > 0);

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
        <button className="nav-btn" onClick={() => onNav('history')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          History
        </button>
        <button className="nav-btn active">
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
        <h1 className="history-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 24, height: 24 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="17" y1="9" x2="9" y2="9" />
            <line x1="17" y1="15" x2="9" y2="15" />
          </svg>
          Delivery Dashboard
        </h1>
      </div>

      <div className="dash-stats">
        <div className="stat-card"><span className="stat-value">{dayBills.length}</span><span className="stat-label">Total Orders</span></div>
        <div className="stat-card"><span className="stat-value">{pending.length}</span><span className="stat-label">Pending</span></div>
        <div className="stat-card"><span className="stat-value">{completed.length}</span><span className="stat-label">Delivered</span></div>
        <div className="stat-card"><span className="stat-value">₹{revenue}</span><span className="stat-label">Revenue</span></div>
      </div>

      <div className="dash-date-nav">
        <button className="dash-date-btn" onClick={() => setViewDate(d => shiftDate(d, -1))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, marginRight: 4, verticalAlign: 'middle' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Prev
        </button>
        <span className="dash-date-label">{dayLabel} — {formatISODate(viewDate)}</span>
        <button className="dash-date-btn" onClick={() => setViewDate(d => shiftDate(d, 1))}>
          Next
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12, marginLeft: 4, verticalAlign: 'middle' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        {!isToday && <button className="dash-date-btn" onClick={() => setViewDate(todayISO)}>Today</button>}
      </div>

      <div className="dash-layout">
        <div className="dash-main">
          {grouped.length === 0 ? (
            <div className="dash-empty">
              <img src={process.env.PUBLIC_URL + '/Laundry and dry cleaning-bro.svg'} alt="No Deliveries" style={{ width: '280px', height: '280px', objectFit: 'contain', marginBottom: '14px' }} />
              <div className="dash-empty-text">No deliveries scheduled for {dayLabel}</div>
            </div>
          ) : (
            grouped.map(slot => (
              <div key={slot.id} className="slot-group">
                <div className="slot-header">
                  <span className="slot-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>{getSlotIcon(slot.id)}</span>
                  <span className="slot-title" style={{ marginLeft: 8 }}>{slot.label}</span>
                  <span className="slot-count">{slot.time} · {slot.bills.length} order{slot.bills.length !== 1 ? 's' : ''}</span>
                </div>
                {slot.bills.map(bill => (
                  <div key={bill.billNo} className={`delivery-card ${bill.delivered ? 'is-delivered' : ''}`}>
                    <div className="delivery-card-info">
                      <div className="delivery-card-name">{bill.customerName || '—'}</div>
                      <div className="delivery-card-details">
                        <span>Bill #{bill.billNo}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 10, height: 10 }}>
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          {bill.mobileNumber || '—'}
                        </span>
                        {bill.tokenNo && <span>Token {bill.tokenNo}</span>}
                      </div>
                      <div className="delivery-card-services">
                        {(bill.services || []).map((s, i) => (
                          <span key={i}>{s.label}: {s.qty} {s.unit}</span>
                        ))}
                      </div>
                    </div>
                    <div className="delivery-card-right">
                      <span className="delivery-card-total">₹{bill.total}/-</span>
                      {bill.delivered || bill.status === 'delivered' ? (
                        <span className="delivered-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Delivered
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                          {bill.status === 'ready' && (
                            <span className="ready-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              Ready for Collection
                            </span>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className={`btn-notify-ready ${bill.status === 'ready' ? 'resend' : ''}`}
                              onClick={() => handleNotifyReady(bill)}
                            >
                              {bill.status === 'ready' ? 'Resend Alert' : 'Notify Ready'}
                            </button>
                            <button className="btn-deliver" onClick={() => handleDeliver(bill.billNo)}>
                              Mark Done
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
                }
              </div>
            ))
          )}
        </div>
        <div className="dash-sidebar">
          <div className="sidebar-card">
            <img src={process.env.PUBLIC_URL + '/Laundry and dry cleaning-bro.svg'} alt="Laundry logistics" />
            <h3>Logistics Management</h3>
            <p>Monitor your active drop-offs and process laundry slots dynamically.</p>
          </div>

          <div className="sidebar-card gateway-status-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <h3>WhatsApp Gateway</h3>
              <button
                onClick={() => { setIsEditingUrl(!isEditingUrl); setUrlInput(gatewayUrl); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', textDecoration: 'underline', color: 'var(--accent)', fontWeight: 'bold', padding: 0 }}
              >
                {isEditingUrl ? 'Cancel' : 'Configure'}
              </button>
            </div>

            {isEditingUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginTop: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  style={{ padding: '4px 8px', border: '1px solid var(--ink)', fontFamily: 'var(--mono)', fontSize: '0.7rem', width: '100%' }}
                />
                <button
                  onClick={() => {
                    let cleanUrl = urlInput.trim();
                    if (cleanUrl.endsWith('/')) {
                      cleanUrl = cleanUrl.slice(0, -1);
                    }
                    localStorage.setItem('laundry_gateway_url', cleanUrl);
                    setGatewayUrl(cleanUrl);
                    setIsEditingUrl(false);
                    showToast('Gateway URL updated!', 'success');
                  }}
                  style={{ padding: '6px', background: 'var(--ink)', color: 'var(--white)', border: 'none', fontFamily: 'var(--sans)', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Save URL
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-light)', fontFamily: 'var(--mono)', marginTop: 2, marginBottom: 4 }}>
                {gatewayUrl}
              </div>
            )}

            <div className="gateway-status-indicator">
              <span className={`status-dot ${gatewayStatus.online ? (gatewayStatus.connected ? 'online' : 'unlinked') : 'offline'}`} />
              <span className="status-text">
                {!gatewayStatus.online ? 'Offline' : (gatewayStatus.connected ? 'Connected' : 'Scan QR')}
              </span>
            </div>

            {gatewayStatus.online && !gatewayStatus.connected && gatewayStatus.qr ? (
              <div className="qr-container">
                <p className="qr-hint">Scan with WhatsApp to link:</p>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(gatewayStatus.qr)}`}
                  alt="Scan to link WhatsApp"
                  className="qr-image"
                />
              </div>
            ) : gatewayStatus.online && !gatewayStatus.connected ? (
              <p className="gateway-help-text">Initializing WhatsApp client. QR code will appear here in a moment...</p>
            ) : gatewayStatus.connected ? (
              <p className="gateway-help-text" style={{ color: 'var(--green-dark)', fontWeight: 'bold' }}>Connected & Ready! Background messages will be sent automatically.</p>
            ) : (
              <div className="gateway-offline-info">
                <p className="gateway-help-text">Background server is offline. Ready alerts will open in a manual tab.</p>
                <p className="gateway-help-text" style={{ marginTop: '6px', fontSize: '0.68rem', color: 'var(--ink-light)' }}>To start: <code style={{ fontFamily: 'var(--mono)', background: '#eae6df', padding: '2px 4px', display: 'inline-block' }}>node index.js</code> in <code style={{ fontFamily: 'var(--mono)' }}>laundry-gateway/</code></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`dash-toast-container ${toast.type}`}>
          <span className="dash-toast-icon">
            {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span className="dash-toast-text">{toast.message}</span>
        </div>
      )}

      <footer className="footer">Built for Laundry Lounge &nbsp;·&nbsp; Bangalore</footer>
    </div>
  );
}
