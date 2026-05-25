# 🧺 Laundry Lounge – Billing System

A React web app for Laundry Lounge, Bangalore. The owner fills in customer details and services, then sends a formatted bill directly via WhatsApp.

---

## Features

- Auto-generated Bill No, Token No, Date & Time
- 6 laundry services: Wash & Fold, Steam Iron, Dry Clean, Bed Sheets, Shoes, Quilt
- Auto-calculates amount from quantity × rate
- Manual amount override per service
- Live WhatsApp message preview
- One-click "Send via WhatsApp" — opens wa.me with the pre-filled bill message
- "New Bill" button to reset the form
- Fully responsive (mobile-friendly)

---

## Setup & Run

### Prerequisites
- Node.js v14+ installed ([nodejs.org](https://nodejs.org))

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm start
```

The app will open at **http://localhost:3000**

---

## How to Use

1. Open the app in your browser
2. Fill in **Customer Name** and **Mobile Number**
3. Enter **Qty/Weight** for each service used — Amount auto-calculates
4. (Optional) Click **Preview WhatsApp Message** to review the bill
5. Click **Send via WhatsApp** — WhatsApp opens with the bill pre-filled
6. Click **New Bill** to start fresh

---

## WhatsApp Message Format

```
🧺 Laundry Lounge – Cash Bill
━━━━━━━━━━━━━━━━━━
📋 Bill No: 746  |  Token: 56
📅 Date: 25 May 26  |  ⏰ Time: 11:35 AM
👤 Customer: Bhaskar

Services:
• Wash And Fold: 2.29 kg × ₹60 = ₹138
...

━━━━━━━━━━━━━━━━━━
💰 TOTAL: ₹138

📍 Ramu Plaza No. 28, ...
📞 9360530384 / 9187351029
🕐 Timings: 8:00 am To 8:00 pm

"Experience The Magic of Clean"
```

---

## Shop Info (pre-filled)
- **Name**: Laundry Lounge
- **Address**: Ramu Plaza No. 28, Mount Joy Road, Kempegowda Nagar, Bangalore - 560019
- **Mobile**: 9360530384 / 9187351029
- **Hours**: 8:00 am To 8:00 pm
