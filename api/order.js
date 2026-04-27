const { google } = require('googleapis');

const SHEET_RANGE = 'Sheet1!A:D';
const HEADER_ROW = ['OrderId', 'DateTime', 'Items', 'Total'];

function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

async function ensureHeader(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A1:D1',
  });
  const rows = res.data.values || [];
  if (rows.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A1:D1',
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER_ROW] },
    });
  }
}

async function getNextOrderId(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:A',
  });
  const rows = res.data.values || [];
  // rows[0] is the header row
  if (rows.length <= 1) return 101;
  const last = parseInt(rows[rows.length - 1][0], 10);
  return isNaN(last) ? 101 : last + 1;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid order data' });
  }

  const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.qty), 0);
  const itemsStr = items.map(i => `${i.category}: ${i.name} x${i.qty}`).join(', ');
  const dateTime = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });
    await ensureHeader(sheets);
    const orderId = await getNextOrderId(sheets);

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: SHEET_RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[orderId, dateTime, itemsStr, total]] },
    });

    return res.status(200).json({ orderId, total });
  } catch (err) {
    console.error('Sheets error:', err.message);
    return res.status(500).json({ error: 'Failed to save order' });
  }
};
