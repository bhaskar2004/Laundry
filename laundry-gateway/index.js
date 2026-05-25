const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

let isClientReady = false;

// Set up WhatsApp client with LocalAuth to persist login session
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './.wwebjs_auth'
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ]
  }
});

client.on('qr', (qr) => {
  console.log('\n======================================================');
  console.log('SCAN THE QR CODE BELOW WITH WHATSAPP TO CONNECT:');
  console.log('======================================================\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  isClientReady = true;
  console.log('\n======================================================');
  console.log('WhatsApp client is ready and connected!');
  console.log('======================================================\n');
});

client.on('auth_failure', (msg) => {
  console.error('Authentication failure:', msg);
});

client.on('disconnected', (reason) => {
  isClientReady = false;
  console.log('WhatsApp client was disconnected:', reason);
});

// Health check endpoint
app.get('/status', (req, res) => {
  res.json({
    online: true,
    connected: isClientReady
  });
});

// Endpoint to send WhatsApp message
app.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message are required.' });
  }

  if (!isClientReady) {
    return res.status(503).json({ error: 'WhatsApp gateway is online but not authenticated yet. Please scan the QR code.' });
  }

  try {
    let cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    const chatId = cleanPhone + '@c.us';
    
    await client.sendMessage(chatId, message);
    console.log(`[Sent] Message successfully dispatched to ${cleanPhone}`);
    res.json({ success: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`WhatsApp Gateway server is running on http://localhost:${PORT}`);
  console.log('Waiting for WhatsApp authentication...');
});

client.initialize().catch(err => {
  console.error('Error initializing WhatsApp client:', err);
});
