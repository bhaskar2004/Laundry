import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import History from './History';
import Dashboard from './Dashboard';
import {
  SERVICE_ITEMS, SHOP_INFO, DELIVERY_SLOTS,
  getNextBillNo, getTodayDate, getCurrentTime, getTomorrowISO,
  getDefaultSlot, formatISODate, loadHistory, saveHistory, findRepeatCustomer,
  generateReceiptBlob,
} from './helpers';

export default function App() {
  const [page, setPage] = useState('billing');
  const [billNo, setBillNo] = useState(() => getNextBillNo());
  const [tokenNo, setTokenNo] = useState('');
  const [date, setDate] = useState(getTodayDate);
  const [time, setTime] = useState(getCurrentTime);
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [services, setServices] = useState(SERVICE_ITEMS.map(s => ({ ...s, qty: '', amount: '' })));
  const [sent, setSent] = useState(false);
  const [preview, setPreview] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(getTomorrowISO);
  const [deliverySlot, setDeliverySlot] = useState(getDefaultSlot);
  const [repeatInfo, setRepeatInfo] = useState(null);
  const [logoImageEl, setLogoImageEl] = useState(null);

  // Preload logo for receipt generation
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = process.env.PUBLIC_URL + '/whatsappImg.png';
    img.onload = () => setLogoImageEl(img);
  }, []);

  // Repeat customer lookup
  useEffect(() => {
    if (mobileNumber.length === 10) {
      const found = findRepeatCustomer(mobileNumber);
      if (found) {
        setRepeatInfo(found);
        if (!customerName) setCustomerName(found.customerName || '');
      } else {
        setRepeatInfo(null);
      }
    } else {
      setRepeatInfo(null);
    }
  }, [mobileNumber]); // eslint-disable-line

  const handleQtyChange = useCallback((id, value) => {
    setServices(prev => prev.map(s => {
      if (s.id !== id) return s;
      const qty = parseFloat(value) || 0;
      return { ...s, qty: value, amount: qty > 0 ? (qty * s.pricePerUnit).toFixed(0) : '' };
    }));
  }, []);

  const handleAmountChange = useCallback((id, value) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, amount: value } : s));
  }, []);

  const total = services.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const activeServices = services.filter(s => s.qty || s.amount);
  const slotInfo = DELIVERY_SLOTS.find(s => s.id === deliverySlot);

  const getSlotIcon = (slotId) => {
    switch (slotId) {
      case 'morning':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, marginRight: 6, verticalAlign: 'middle' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M6.34 17.66l2.83-2.83M17.66 6.34l-2.83 2.83" />
          </svg>
        );
      case 'afternoon':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, marginRight: 6, verticalAlign: 'middle' }}>
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        );
      case 'evening':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, marginRight: 6, verticalAlign: 'middle' }}>
            <path d="M17 18a6 6 0 0 0-9-5.65A6.002 6.002 0 0 0 2 12c0 3.3 2.7 6 6 6h9Z" />
            <path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2" />
          </svg>
        );
      default:
        return null;
    }
  };

  const buildWhatsAppMessage = () => {
    const line = '─────────────────';
    const serviceLines = activeServices.map(s =>
      `• ${s.label}: ${s.qty} ${s.unit} × ₹${s.pricePerUnit} = *₹${s.amount}*`
    );
    const meta = [`Bill #${billNo}`];
    if (tokenNo) meta.push(`Token ${tokenNo}`);

    const lines = [
      `*LAUNDRY LOUNGE*`, line,
      meta.join(' | '),
      `${date}, ${time}`,
      `Customer: *${customerName || '—'}*`,
      `Delivery: *${formatISODate(deliveryDate)}, ${slotInfo ? slotInfo.label + ' (' + slotInfo.time + ')' : ''}*`,
      ``, `*Services:*`, ...serviceLines, ``,
      `*TOTAL: ₹${total}/-*`, `Cash / UPI`, line,
      `${SHOP_INFO.address}`,
      `Call: ${SHOP_INFO.mobile1} / ${SHOP_INFO.mobile2}`,
      `Hours: ${SHOP_INFO.hours}`, ``,
      `Thank you! – Laundry Lounge`,
    ];
    return encodeURIComponent(lines.join('\n'));
  };

  const buildPreviewText = () => {
    const line = '─────────────────';
    const serviceLines = activeServices.map(s =>
      `• ${s.label}: ${s.qty} ${s.unit} × ₹${s.pricePerUnit} = ₹${s.amount}`
    );
    const meta = [`Bill #${billNo}`];
    if (tokenNo) meta.push(`Token ${tokenNo}`);

    return [
      `LAUNDRY LOUNGE`, line,
      meta.join(' | '),
      `${date}, ${time}`,
      `Customer: ${customerName || '—'}`,
      `Delivery: ${formatISODate(deliveryDate)}, ${slotInfo ? slotInfo.label + ' (' + slotInfo.time + ')' : ''}`,
      ``, `Services:`, ...serviceLines, ``,
      `TOTAL: ₹${total}/-`, `Cash / UPI`, line,
      `${SHOP_INFO.address}`,
      `Call: ${SHOP_INFO.mobile1} / ${SHOP_INFO.mobile2}`,
      `Hours: ${SHOP_INFO.hours}`, ``,
      `Thank you! – Laundry Lounge`,
    ].join('\n');
  };

  const saveBillToHistory = () => {
    const bill = {
      billNo, tokenNo, date, time, customerName, mobileNumber,
      deliveryDate, deliverySlot,
      services: activeServices.map(s => ({ label: s.label, qty: s.qty, unit: s.unit, pricePerUnit: s.pricePerUnit, amount: s.amount })),
      total, timestamp: Date.now(), delivered: false, status: 'pending',
    };
    const history = loadHistory();
    history.unshift(bill);
    saveHistory(history);
  };

  const handleSendWhatsApp = () => {
    if (!mobileNumber || mobileNumber.length < 10) { alert('Please enter a valid 10-digit mobile number.'); return; }
    if (activeServices.length === 0) { alert('Please add at least one service.'); return; }

    const slotInfo = DELIVERY_SLOTS.find(s => s.id === deliverySlot);
    const bill = {
      billNo,
      tokenNo,
      date,
      time,
      customerName,
      mobileNumber,
      deliveryDate,
      deliverySlot,
      deliverySlotLabel: slotInfo ? slotInfo.label : '',
      services: activeServices.map(s => ({
        label: s.label,
        qty: s.qty,
        unit: s.unit,
        pricePerUnit: s.pricePerUnit,
        amount: s.amount
      })),
      total
    };

    // Synchronous ClipboardItem write with Promise to respect user gesture requirement
    try {
      const clipboardItem = new ClipboardItem({
        'image/png': new Promise((resolve, reject) => {
          generateReceiptBlob(bill, logoImageEl)
            .then(blob => resolve(blob))
            .catch(err => {
              console.error("Blob generation failed:", err);
              reject(err);
            });
        })
      });
      navigator.clipboard.write([clipboardItem]).then(() => {
        console.log("Receipt image copied to clipboard successfully!");
      }).catch(err => {
        console.error("Clipboard write promise failed:", err);
      });
    } catch (err) {
      console.error("Immediate clipboard write call failed:", err);
    }

    saveBillToHistory();
    const phone = mobileNumber.startsWith('91') ? mobileNumber : `91${mobileNumber}`;
    window.open(`https://wa.me/${phone}?text=${buildWhatsAppMessage()}`, '_blank');
    setSent(true);
  };

  const handleReset = useCallback(() => {
    setBillNo(getNextBillNo()); setTokenNo('');
    setDate(getTodayDate()); setTime(getCurrentTime());
    setCustomerName(''); setMobileNumber('');
    setServices(SERVICE_ITEMS.map(s => ({ ...s, qty: '', amount: '' })));
    setSent(false); setPreview(false); setRepeatInfo(null);
    setDeliveryDate(getTomorrowISO()); setDeliverySlot(getDefaultSlot());
  }, []);



  if (page === 'history') return <History onNav={setPage} />;
  if (page === 'dashboard') return <Dashboard onNav={setPage} />;

  return (
    <div className="app">
      <div className="container page-fade-in">
        <div className="nav-bar">
          <button className="nav-btn active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            New Bill
          </button>
          <button className="nav-btn" onClick={() => setPage('history')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            History
          </button>
          <button className="nav-btn" onClick={() => setPage('dashboard')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="17" y1="9" x2="9" y2="9" />
              <line x1="17" y1="15" x2="9" y2="15" />
            </svg>
            Dashboard
          </button>
        </div>

        <header className="header">
          <div className="header-top">
            <div className="header-brand">
              <h1 className="brand">Laundry Lounge</h1>
              <p className="tagline">{SHOP_INFO.tagline}</p>
            </div>
          </div>
          <div className="address-bar">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {SHOP_INFO.address}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {SHOP_INFO.mobile1} / {SHOP_INFO.mobile2}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {SHOP_INFO.hours}
            </span>
          </div>
        </header>

        <div className="bill-card">
          <div className="bill-header-row">
            <div className="badge">CASH BILL</div>
            <div className="bill-meta">
              <div className="meta-item"><span className="meta-label">Bill No</span><span className="meta-value">#{billNo}</span></div>
              <div className="meta-item"><span className="meta-label">Date</span><span className="meta-value">{date}</span></div>
              <div className="meta-item"><span className="meta-label">Time</span><span className="meta-value">{time}</span></div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="section">
            <h2 className="section-title">Customer Details</h2>
            <div className="customer-fields">
              <div className="field-group">
                <label>Customer Name</label>
                <input type="text" placeholder="e.g. xyz" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div className="field-group">
                <label>Mobile Number</label>
                <input type="tel" placeholder="10-digit number" maxLength={10} value={mobileNumber} onChange={e => setMobileNumber(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className="field-group">
                <label>Token No</label>
                <input type="text" placeholder="Tag number" value={tokenNo} onChange={e => setTokenNo(e.target.value)} />
              </div>
              {repeatInfo && (
                <div className="repeat-banner">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, stroke: '#2d6a2d' }}>
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span><strong>Returning customer!</strong> {repeatInfo.customerName} — last bill #{repeatInfo.billNo} on {repeatInfo.date}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div className="section delivery-section">
            <h2 className="section-title">Delivery Time</h2>
            <div className="delivery-pills">
              {DELIVERY_SLOTS.map(slot => (
                <button key={slot.id} className={`delivery-pill ${deliverySlot === slot.id ? 'selected' : ''}`} onClick={() => setDeliverySlot(slot.id)} style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {getSlotIcon(slot.id)}
                  {slot.label}
                  <span style={{ opacity: 0.6, fontSize: '0.7rem', marginLeft: 6 }}>{slot.time}</span>
                </button>
              ))}
            </div>
            <div className="delivery-info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, marginRight: 6 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Delivery: <strong>{formatISODate(deliveryDate)}</strong> — {slotInfo?.label} ({slotInfo?.time})
              <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} style={{ marginLeft: 12, border: '1px solid #ccc', padding: '4px 8px', fontFamily: 'var(--mono)', fontSize: '0.72rem' }} />
            </div>
          </div>

          {/* Services */}
          <div className="section">
            <h2 className="section-title">Services</h2>
            <div className="table-wrapper">
              <table className="services-table">
                <thead><tr><th>Sl.</th><th>Particular</th><th>Rate</th><th>Qty / Weight</th><th>Amount (₹)</th></tr></thead>
                <tbody>
                  {services.map((s, idx) => (
                    <tr key={s.id} className={s.qty || s.amount ? 'row-active' : ''}>
                      <td className="cell-num">{idx + 1}</td>
                      <td className="cell-label"><span className="service-name">{s.label}</span><span className="service-unit">per {s.unit}</span></td>
                      <td className="cell-rate">₹{s.pricePerUnit}</td>
                      <td className="cell-qty"><input type="number" min="0" step="0.5" placeholder="0" value={s.qty} onChange={e => handleQtyChange(s.id, e.target.value)} /></td>
                      <td className="cell-amount"><input type="number" min="0" placeholder="0" value={s.amount} onChange={e => handleAmountChange(s.id, e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-services">
              {services.map(s => (
                <div key={s.id} className={`service-card ${s.qty || s.amount ? 'card-active' : ''}`}>
                  <div className="service-card-header">
                    <div className="service-card-info"><div className="service-card-name">{s.label}</div><div className="service-card-unit">per {s.unit}</div></div>
                    <div className="service-card-rate">₹{s.pricePerUnit}</div>
                  </div>
                  <div className="service-card-inputs">
                    <div className="service-card-field"><label>Qty / Weight</label><input type="number" min="0" step="0.5" placeholder="0" value={s.qty} onChange={e => handleQtyChange(s.id, e.target.value)} /></div>
                    <div className="service-card-field"><label>Amount (₹)</label><input type="number" min="0" placeholder="0" value={s.amount} onChange={e => handleAmountChange(s.id, e.target.value)} /></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="total-row"><span className="total-label">TOTAL</span><span className="total-amount">₹{total > 0 ? total : '—'}</span></div>
            <div className="payment-note">Payment: CASH / UPI</div>
          </div>

          {/* Preview */}
          {activeServices.length > 0 && (
            <div className="section">
              <button className="btn-preview" onClick={() => setPreview(p => !p)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, transform: preview ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                {preview ? 'Hide Preview' : 'Preview Message'}
              </button>
              {preview && (<div className="preview-box"><div className="preview-label">WhatsApp Preview</div><pre className="preview-text">{buildPreviewText()}</pre></div>)}
            </div>
          )}

          {/* Actions */}
          <div className="actions">
            <button className="btn-whatsapp" onClick={handleSendWhatsApp}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Send via WhatsApp
            </button>
            <button className="btn-reset" onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              New Bill
            </button>
          </div>
        </div>

        <footer className="footer">Built for Laundry Lounge &nbsp;·&nbsp; Bangalore</footer>
      </div>

      {sent && (
        <div className="success-overlay">
          <div className="success-card">
            <svg className="success-checkmark-svg" viewBox="0 0 100 100">
              <circle className="success-circle" cx="50" cy="50" r="45" />
              <path className="success-check" d="M30 52 L43 65 L70 35" />
            </svg>
            <h2 className="success-title">Bill Sent!</h2>
            <p className="success-subtitle">WhatsApp invoice has been dispatched.</p>
            <div className="success-clipboard-hint" style={{
              marginTop: '12px',
              marginBottom: '16px',
              fontSize: '0.78rem',
              color: '#1b5e20',
              background: '#e8f5e9',
              border: '1px dashed #a5d6a7',
              padding: '8px 12px',
              borderRadius: '6px',
              fontFamily: 'var(--sans)',
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '1.1rem' }}>📋</span> Receipt image copied! Paste (Ctrl+V) in WhatsApp to send.
            </div>
            <div className="success-details">
              <div className="success-detail-row">
                <span className="success-detail-label">Bill Number</span>
                <span className="success-detail-value">#{billNo}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Customer</span>
                <span className="success-detail-value">{customerName || 'Walk-in'}</span>
              </div>
              <div className="success-detail-row">
                <span className="success-detail-label">Total Amount</span>
                <span className="success-detail-value">₹{total}/-</span>
              </div>
            </div>
            <button className="btn-success-done" onClick={handleReset}>
              New Bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
