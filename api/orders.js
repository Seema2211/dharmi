const { google } = require('googleapis');

function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets.readonly']
  );
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:D',
    });

    const rows = result.data.values || [];
    if (rows.length <= 1) return res.status(200).json([]);

    // Skip header row
    const orders = rows.slice(1).map(row => ({
      orderId:  row[0] || '',
      dateTime: row[1] || '',
      items:    row[2] || '',
      total:    row[3] || '',
    })).reverse(); // newest first

    return res.status(200).json(orders);
  } catch (err) {
    console.error('Orders fetch error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
};
