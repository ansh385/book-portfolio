(function () {
  const KEY = 'ansh_portfolio_projects_v1';
  const GH = 'https://github.com/ansh385';
  const API = '/api/projects';

  // Used only when the database API is not available (demo mode)
  const DEFAULTS = [
    ['Saptapadi', 'Online Hindu wedding app that walks through the ceremony step by step.', ['JavaScript', 'HTML', 'CSS']],
    ['Bean & Byte Café', 'Full-stack café ordering platform with a menu, cart and orders.', ['React', 'Node.js', 'MongoDB']],
    ['AI Study Planner', 'Full-stack planner with an adaptive scoring engine that adjusts your study schedule.', ['React', 'Node.js', 'AI']],
    ['Chaos World', 'Gamified amusement park app built with React.', ['React', 'CSS']],
    ['Monthly Ledger', 'A React to-do app organised by month.', ['React']],
    ['Retro CRT Terminal Portfolio', 'Portfolio styled as a retro CRT terminal.', ['Next.js', 'Supabase']],
    ['HOLomat', 'Local-first, self-hosted parametric CAD platform with AI assistance.', ['AI', 'Open source']]
  ].map(function (d, i) { return { id: 'd' + i, name: d[0], desc: d[1], tech: d[2], live: '', github: GH }; });

  const grid = document.getElementById('projectGrid');
  const adminBar = document.getElementById('adminBar');
  const resetBtn = document.getElementById('resetBtn');
  const modeNote = document.getElementById('modeNote');
  const form = document.getElementById('projectForm');
  const modalEl = document.getElementById('projectModal');

  let mode = 'local';   // 'api' = saved in the database, 'local' = demo mode
  let projects = [];

  const store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };

  function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(projects)); } catch (e) {} }

  async function load() {
    try {
      const r = await fetch(API, { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('api');
      const data = await r.json();
      if (!Array.isArray(data)) throw new Error('api');
      mode = 'api';
      return data;
    } catch (e) {
      mode = 'local';
      try {
        const s = JSON.parse(localStorage.getItem(KEY));
        if (Array.isArray(s)) return s;
      } catch (_) {}
      return DEFAULTS.slice();
    }
  }

  // Edit controls show in demo mode, or on the live site when the address ends with #admin
  function isAdminView() { return mode === 'local' || location.hash === '#admin'; }

  function updateChrome() {
    adminBar.classList.toggle('d-none', !isAdminView());
    resetBtn.classList.toggle('d-none', mode !== 'local');
    modeNote.textContent = mode === 'local'
      ? 'Demo mode: projects are saved in this browser only. Deploy with the database to save them for every visitor.'
      : '';
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function safeUrl(v) {
    try { const u = new URL(v); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch (e) { return ''; }
  }

  function linkBtn(href, cls, icon, label) {
    const a = el('a', 'btn btn-sm ' + cls);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.append(el('i', 'bi ' + icon + ' me-1'), label);
    return a;
  }

  function render() {
    updateChrome();
    grid.replaceChildren();
    if (!projects.length) {
      grid.append(el('p', 'muted', 'No projects yet.'));
      return;
    }
    projects.forEach(function (p) {
      const col = el('div', 'col-12');
      const card = el('article', 'project');
      card.append(el('h3', '', p.name), el('p', '', p.desc));

      const tags = el('div', 'tags');
      (p.tech || []).forEach(function (t) { tags.append(el('span', '', t)); });
      card.append(tags);

      const actions = el('div', 'actions');
      const live = safeUrl(p.live), gh = safeUrl(p.github);
      if (live) actions.append(linkBtn(live, 'btn-warm', 'bi-box-arrow-up-right', 'Try it'));
      if (gh) actions.append(linkBtn(gh, 'btn-ink', 'bi-github', 'See on GitHub'));

      if (isAdminView()) {
        const del = el('button', 'del');
        del.type = 'button';
        del.setAttribute('aria-label', 'Remove ' + p.name);
        del.append(el('i', 'bi bi-trash3'));
        del.addEventListener('click', function () { removeProject(p); });
        actions.append(del);
      }
      card.append(actions);
      col.append(card);
      grid.append(col);
    });
  }

  function askPassword() {
    let pw = store.get('pw');
    if (!pw) pw = prompt('Admin password') || '';
    return pw;
  }

  async function callApi(method, path, body) {
    const pw = askPassword();
    if (!pw) return null;
    const r = await fetch(API + (path || ''), {
      method: method,
      headers: { 'Content-Type': 'application/json', 'x-admin-password': pw },
      body: body ? JSON.stringify(body) : undefined
    });
    if (r.status === 401) { store.del('pw'); alert('Wrong admin password.'); return null; }
    if (!r.ok) { alert('Something went wrong. Please try again.'); return null; }
    store.set('pw', pw);
    return r.json();
  }

  async function addProject(data) {
    if (mode === 'api') {
      const created = await callApi('POST', '', data);
      if (!created) return false;
      projects.unshift(created);
    } else {
      data.id = 'u' + Date.now();
      projects.unshift(data);
      saveLocal();
    }
    render();
    return true;
  }

  async function removeProject(p) {
    if (!confirm('Remove "' + p.name + '" from your portfolio?')) return;
    if (mode === 'api') {
      const res = await callApi('DELETE', '?id=' + encodeURIComponent(p.id));
      if (!res) return;
    }
    projects = projects.filter(function (x) { return x.id !== p.id; });
    if (mode === 'local') saveLocal();
    render();
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const f = {
      name: document.getElementById('pName'),
      desc: document.getElementById('pDesc'),
      tech: document.getElementById('pTech'),
      live: document.getElementById('pLive'),
      git: document.getElementById('pGit')
    };
    let ok = true;
    [f.name, f.desc].forEach(function (i) {
      const bad = !i.value.trim();
      i.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    [f.live, f.git].forEach(function (i) {
      const v = i.value.trim();
      const bad = v !== '' && !safeUrl(v);
      i.classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) return;

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    const saved = await addProject({
      name: f.name.value.trim(),
      desc: f.desc.value.trim(),
      tech: f.tech.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
      live: f.live.value.trim(),
      github: f.git.value.trim()
    });
    btn.disabled = false;
    if (saved) {
      form.reset();
      bootstrap.Modal.getInstance(modalEl).hide();
    }
  });

  modalEl.addEventListener('hidden.bs.modal', function () {
    form.reset();
    form.querySelectorAll('.is-invalid').forEach(function (i) { i.classList.remove('is-invalid'); });
  });

  resetBtn.addEventListener('click', function () {
    if (confirm('Reset to the default projects? Projects you added will be removed.')) {
      projects = DEFAULTS.slice();
      saveLocal();
      render();
    }
  });

  window.addEventListener('hashchange', render);

  // Contact form opens the visitor's email app with the message filled in
  document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    const email = document.getElementById('cEmail').value.trim();
    const msg = document.getElementById('cMsg').value.trim();
    const subject = encodeURIComponent('Portfolio message from ' + name);
    const body = encodeURIComponent(msg + '\n\nFrom: ' + name + ' (' + email + ')');
    window.location.href = 'mailto:anshgajjar2627@gmail.com?subject=' + subject + '&body=' + body;
  });

  document.getElementById('year').textContent = new Date().getFullYear();
  load().then(function (list) { projects = list; render(); });
})();
