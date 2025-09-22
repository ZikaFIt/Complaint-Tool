// api/zoho-create-ticket.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const {
      subject,
      description,
      requesterEmail,
      statusName = 'Open',
      categoryName = '',
      subcategoryName = '',
      itemName = '',
      extras = {}
    } = req.body || {};

    // 1) حضّري access_token (لو عندك REFRESH_TOKEN هيتم التجديد تلقائي)
    let accessToken = process.env.ZOHODESK_ACCESS_TOKEN || '';
    if (!accessToken && process.env.ZOHO_REFRESH_TOKEN && process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET) {
      const tokenResp = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type':'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token'
        })
      });
      const tokenData = await tokenResp.json();
      if (!tokenResp.ok) {
        return res.status(500).json({ error: 'Failed to refresh Zoho token', details: tokenData });
      }
      accessToken = tokenData.access_token;
    }

    if (!accessToken) {
      return res.status(500).json({ error: 'No Zoho access token available. Set ZOHODESK_ACCESS_TOKEN or refresh credentials.' });
    }

    // 2) جهّزي الـ Payload لزوهو
    const body = {
      subject: subject || 'Complaint',
      email: requesterEmail || 'customer@example.com',
      description: description || '',
      status: statusName || 'Open',
      category: categoryName || '',
      subCategory: subcategoryName || '',
      customFields: {
        cf_item: itemName || '',
        ...extras
      }
    };

    // 3) Call Zoho Desk Tickets API
    const r = await fetch('https://desk.zoho.com/api/v1/tickets', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'orgId': process.env.ZOHODESK_ORGID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await r.json().catch(()=> ({}));
    if (!r.ok) {
      return res.status(r.status).json({ error: 'Zoho error', details: data });
    }

    return res.status(200).json({ ok: true, zohoTicketId: data?.id || null, data });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error', details: String(e) });
  }
}
