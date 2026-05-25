export const SERVICE_ITEMS = [
  { id: 'wash_fold', label: 'Wash And Fold', unit: 'kg', pricePerUnit: 60 },
  { id: 'steam_iron', label: 'Steam Iron', unit: 'piece', pricePerUnit: 15 },
  { id: 'dry_clean', label: 'Dry Clean', unit: 'piece', pricePerUnit: 150 },
  { id: 'bed_sheets', label: 'Bed Sheets / Blankets', unit: 'piece', pricePerUnit: 100 },
  { id: 'shoes', label: 'Shoes', unit: 'pair', pricePerUnit: 200 },
  { id: 'quilt', label: 'Quilt / Comforter', unit: 'piece', pricePerUnit: 250 },
];

export const SHOP_INFO = {
  name: 'Laundry Lounge',
  address: 'Ramu Plaza No. 28, Mount Joy Road, Kempegowda Nagar (Hanumantha Nagar) Bangalore - 560019',
  mobile1: '9360530384',
  mobile2: '9187351029',
  hours: '8:00 am To 8:00 pm',
  tagline: '"Experience The Magic of Clean"',
};

export const DELIVERY_SLOTS = [
  { id: 'morning', label: 'Morning', time: '9 AM – 12 PM', icon: 'morning' },
  { id: 'afternoon', label: 'Afternoon', time: '12 – 4 PM', icon: 'afternoon' },
  { id: 'evening', label: 'Evening', time: '4 – 8 PM', icon: 'evening' },
];

export function getNextBillNo() {
  const stored = localStorage.getItem('ll_bill_counter');
  const next = stored ? parseInt(stored, 10) + 1 : 1;
  localStorage.setItem('ll_bill_counter', next.toString());
  return next;
}

export function getTodayDate() {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function getCurrentTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function getTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function getTomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function formatISODate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function shiftDate(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function getDefaultSlot() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 16) return 'afternoon';
  return 'evening';
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem('ll_bill_history');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveHistory(history) {
  localStorage.setItem('ll_bill_history', JSON.stringify(history));
}

export function findRepeatCustomer(phone) {
  if (!phone || phone.length < 10) return null;
  const history = loadHistory();
  return history.find(b => b.mobileNumber === phone) || null;
}

export function exportCSV(history) {
  const headers = ['Bill No','Date','Time','Customer','Mobile','Token','Services','Total','Delivery Date','Delivery Slot','Delivered'];
  const rows = history.map(b => [
    b.billNo,
    b.date,
    b.time,
    b.customerName || '',
    b.mobileNumber || '',
    b.tokenNo || '',
    (b.services || []).map(s => `${s.label}:${s.qty}${s.unit}=₹${s.amount}`).join('; '),
    b.total,
    b.deliveryDate || '',
    b.deliverySlot || '',
    b.delivered ? 'Yes' : 'No',
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laundry_bills_${getTodayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateReceiptBlob(bill, logoImg) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const servicesCount = bill.services.length;
    const canvasWidth = 600;
    const canvasHeight = 720 + (servicesCount * 45);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Draw Background
    ctx.fillStyle = '#fbfbf9';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Outer border
    ctx.strokeStyle = '#121212';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);
    
    // Inner thin border
    ctx.strokeStyle = '#e2dfd9';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, canvasWidth - 32, canvasHeight - 32);
    
    // Draw the image illustration at the top (centered)
    if (logoImg) {
      const imgWidth = 160;
      const imgHeight = 160;
      const imgX = (canvasWidth - imgWidth) / 2;
      const imgY = 32;
      ctx.drawImage(logoImg, imgX, imgY, imgWidth, imgHeight);
    }
    
    // Title
    ctx.fillStyle = '#121212';
    ctx.textAlign = 'center';
    ctx.font = '800 28px Outfit, sans-serif';
    ctx.fillText('LAUNDRY LOUNGE', canvasWidth / 2, 230);
    
    // Tagline
    ctx.font = 'italic 14px "DM Sans", sans-serif';
    ctx.fillStyle = '#5c5a54';
    ctx.fillText('"Experience The Magic of Clean"', canvasWidth / 2, 252);
    
    // Address & Contact
    ctx.font = '500 11px "DM Sans", sans-serif';
    ctx.fillStyle = '#7a7770';
    ctx.fillText('Ramu Plaza No. 28, Mount Joy Road, Kempegowda Nagar, Bangalore', canvasWidth / 2, 272);
    ctx.fillText('Call: 9360530384 / 9187351029', canvasWidth / 2, 288);
    
    // Divider
    ctx.strokeStyle = '#121212';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(35, 310);
    ctx.lineTo(canvasWidth - 35, 310);
    ctx.stroke();
    
    // Bill Metadata Grid
    ctx.textAlign = 'left';
    ctx.fillStyle = '#121212';
    
    // Left Column
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.fillText('BILL NO:', 35, 345);
    ctx.font = '500 13px "DM Mono", monospace';
    ctx.fillText(`#${bill.billNo}`, 105, 345);
    
    if (bill.tokenNo) {
      ctx.font = '800 13px Outfit, sans-serif';
      ctx.fillText('TOKEN:', 35, 375);
      ctx.font = '500 13px "DM Mono", monospace';
      ctx.fillText(bill.tokenNo, 105, 375);
    }
    
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.fillText('DATE:', 35, bill.tokenNo ? 405 : 375);
    ctx.font = '500 13px "DM Mono", monospace';
    ctx.fillText(`${bill.date}  ${bill.time}`, 105, bill.tokenNo ? 405 : 375);
    
    // Right Column
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.fillText('CUSTOMER:', 300, 345);
    ctx.font = '700 13px "DM Sans", sans-serif';
    ctx.fillText(bill.customerName || 'Walk-in Customer', 390, 345);
    
    ctx.font = '800 13px Outfit, sans-serif';
    ctx.fillText('MOBILE:', 300, 375);
    ctx.font = '500 13px "DM Mono", monospace';
    ctx.fillText(bill.mobileNumber || '—', 390, 375);
    
    ctx.font = '800 13px Outfit, sans-serif';
    const deliveryY = bill.tokenNo ? 405 : 375;
    ctx.fillText('DELIVERY:', 300, deliveryY);
    ctx.font = '700 12px "DM Sans", sans-serif';
    ctx.fillText(`${formatISODate(bill.deliveryDate)} (${bill.deliverySlotLabel})`, 390, deliveryY);
    
    // Divider
    ctx.strokeStyle = '#e2dfd9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, 430);
    ctx.lineTo(canvasWidth - 35, 430);
    ctx.stroke();
    
    // Services Headers
    ctx.font = '800 12px Outfit, sans-serif';
    ctx.fillStyle = '#7a7770';
    ctx.fillText('SERVICE / ITEM', 35, 460);
    ctx.textAlign = 'right';
    ctx.fillText('RATE', 350, 460);
    ctx.fillText('QTY', 440, 460);
    ctx.fillText('AMOUNT', 565, 460);
    
    // Table Divider
    ctx.strokeStyle = '#121212';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(35, 475);
    ctx.lineTo(canvasWidth - 35, 475);
    ctx.stroke();
    
    // Render Service Rows
    let currentY = 510;
    bill.services.forEach((s) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#121212';
      ctx.font = '700 13px "DM Sans", sans-serif';
      ctx.fillText(s.label, 35, currentY);
      ctx.font = '500 11px "DM Sans", sans-serif';
      ctx.fillStyle = '#7a7770';
      ctx.fillText(`per ${s.unit}`, 35, currentY + 16);
      
      ctx.textAlign = 'right';
      ctx.fillStyle = '#121212';
      ctx.font = '500 13px "DM Mono", monospace';
      ctx.fillText(`₹${s.pricePerUnit}`, 350, currentY + 6);
      ctx.fillText(`${s.qty}`, 440, currentY + 6);
      ctx.font = '700 13px "DM Mono", monospace';
      ctx.fillText(`₹${s.amount}`, 565, currentY + 6);
      
      // Row separator
      ctx.strokeStyle = '#f1efeb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(35, currentY + 30);
      ctx.lineTo(canvasWidth - 35, currentY + 30);
      ctx.stroke();
      
      currentY += 45;
    });
    
    // Total section
    currentY += 15;
    ctx.fillStyle = '#121212';
    ctx.fillRect(35, currentY, canvasWidth - 70, 52);
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = '800 16px Outfit, sans-serif';
    ctx.fillText('TOTAL AMOUNT:', 55, currentY + 32);
    
    ctx.textAlign = 'right';
    ctx.font = '800 20px "DM Mono", monospace';
    ctx.fillText(`₹${bill.total}/-`, canvasWidth - 55, currentY + 35);
    
    // Payment Note
    ctx.fillStyle = '#7a7770';
    ctx.textAlign = 'center';
    ctx.font = 'italic 11px "DM Sans", sans-serif';
    ctx.fillText('Payment Mode: CASH / UPI  ·  Status: Pending delivery', canvasWidth / 2, currentY + 80);
    
    // Thank you text
    ctx.fillStyle = '#121212';
    ctx.font = '700 13px "DM Sans", sans-serif';
    ctx.fillText('Thank you for choosing Laundry Lounge!', canvasWidth / 2, currentY + 110);
    
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}
