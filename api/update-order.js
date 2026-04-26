const { google } = require('googleapis');

function getAuth() {
  return new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, items, total } = req.body;
  if (!orderId || !items || total === undefined) {
    return res.status(400).json({ error: 'orderId, items and total are required' });
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });

    // Find which row has this orderId
    const colA = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:A',
    });

    const rows = colA.data.values || [];
    const rowIndex = rows.findIndex(r => String(r[0]) === String(orderId));
    if (rowIndex === -1) return res.status(404).json({ error: 'Order not found' });

    // Update columns C (Items) and D (Total) for that row
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Sheet1!C${rowIndex + 1}:D${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[items, Number(total)]] },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Update error:', err.message);
    return res.status(500).json({ error: 'Failed to update order' });
  }
};
