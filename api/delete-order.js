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

  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });

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

    // Get the internal sheetId (needed for batchUpdate)
    const meta = await sheets.spreadsheets.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID });
    const sheetId = meta.data.sheets[0].properties.sheetId;

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: rowIndex, endIndex: rowIndex + 1 }
          }
        }]
      }
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete error:', err.message);
    return res.status(500).json({ error: 'Failed to delete order' });
  }
};
