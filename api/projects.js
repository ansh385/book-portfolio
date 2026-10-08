// Vercel serverless function: GET (public), POST and DELETE (admin password required).
// Talks to Supabase through its REST API, so no npm packages are needed.
const crypto = require('crypto');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ADMIN_PASSWORD } = process.env;

function db(path, opts = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/projects${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
}

function isAdmin(req) {
  if (!ADMIN_PASSWORD) return false;
  const hash = (v) => crypto.createHash('sha256').update(String(v)).digest();
  return crypto.timingSafeEqual(hash(req.headers['x-admin-password'] || ''), hash(ADMIN_PASSWORD));
}

const cleanUrl = (v) => {
  v = String(v || '').trim().slice(0, 300);
  if (!v) return '';
  try { const u = new URL(v); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (e) { return ''; }
};

const toClient = (r) => ({ id: r.id, name: r.name, desc: r.description, tech: r.tech || [], live: r.live_url || '', github: r.github_url || '' });

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Database is not configured' });

  try {
    if (req.method === 'GET') {
      const r = await db('?select=*&order=created_at.desc');
      if (!r.ok) return res.status(502).json({ error: 'Database error' });
      return res.status(200).json((await r.json()).map(toClient));
    }

    if (!isAdmin(req)) return res.status(401).json({ error: 'Wrong admin password' });

    if (req.method === 'POST') {
      const b = req.body || {};
      const name = String(b.name || '').trim().slice(0, 60);
      const desc = String(b.desc || '').trim().slice(0, 220);
      if (!name || !desc) return res.status(400).json({ error: 'Name and description are required' });
      const tech = (Array.isArray(b.tech) ? b.tech : []).map((t) => String(t).trim().slice(0, 30)).filter(Boolean).slice(0, 10);
      const r = await db('', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ name, description: desc, tech, live_url: cleanUrl(b.live), github_url: cleanUrl(b.github) })
      });
      if (!r.ok) return res.status(502).json({ error: 'Could not save project' });
      return res.status(201).json(toClient((await r.json())[0]));
    }

    if (req.method === 'DELETE') {
      const id = String(req.query.id || '');
      if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Invalid id' });
      const r = await db(`?id=eq.${id}`, { method: 'DELETE' });
      if (!r.ok) return res.status(502).json({ error: 'Could not delete project' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
};
