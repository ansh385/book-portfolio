// Page-flip engine. Each .pg in #holder is one page. On wide screens two pages share a spread,
// on narrow screens one page fills the book.
const book = document.getElementById('book');
const holder = document.getElementById('holder');
const pages = Array.from(holder.querySelectorAll('.pg'));
const ids = pages.map((p) => p.dataset.id);
const titles = pages.map((p) => p.dataset.title);
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const barLabel = document.getElementById('barLabel');
const wide = window.matchMedia('(min-width: 900px)');
const FLIP_MS = 1000;

let sheets = [];
let single = !wide.matches;
let cur = 0;      // how many sheets are turned
let max = 0;
let timer = null;

const el = (cls) => { const d = document.createElement('div'); d.className = cls; return d; };
const curFor = (f) => (single ? f : Math.ceil(f / 2));
const visibleFaces = () => {
  if (single) return [cur];
  if (cur === 0) return [0];
  return [2 * cur - 1, 2 * cur].filter((i) => i < pages.length);
};

function build(startCur) {
  pages.forEach((p) => { p.querySelector('.folio')?.remove(); holder.append(p); });
  book.replaceChildren();
  sheets = [];
  single = !wide.matches;
  book.classList.toggle('single', single);
  const n = single ? pages.length : Math.ceil(pages.length / 2);
  max = n - 1;
  for (let i = 0; i < n; i++) {
    const sheet = el('sheet');
    const front = el('face front');
    const back = el('face back');
    const fi = single ? i : 2 * i;
    const bi = single ? -1 : 2 * i + 1;
    front.append(pages[fi]);
    if (bi >= 0 && pages[bi]) back.append(pages[bi]); else back.classList.add('blank');
    [[front, fi], [back, bi]].forEach(([face, idx]) => {
      if (idx > 0 && idx < pages.length - 1 && pages[idx]) {
        const f = document.createElement('span');
        f.className = 'folio';
        f.textContent = idx + 1;
        face.append(f);
      }
    });
    sheet.append(front, back);
    book.append(sheet);
    sheets.push(sheet);
  }
  cur = Math.min(startCur, max);
  book.classList.add('no-anim');
  sheets.forEach((s, i) => s.classList.toggle('flipped', i < cur));
  restack();
  update();
  void book.offsetWidth;
  book.classList.remove('no-anim');
}

function restack() {
  sheets.forEach((s, i) => { s.style.zIndex = i < cur ? i : sheets.length - i; });
}

function step(dir) {
  const target = cur + dir;
  if (target < 0 || target > max) return;
  const s = dir > 0 ? sheets[cur] : sheets[cur - 1];
  s.style.zIndex = 200;
  cur = target;
  s.classList.toggle('flipped', dir > 0);
  clearTimeout(timer);
  timer = setTimeout(restack, FLIP_MS);
  update();
}

let jumpTimer = null;
function goTo(target) {
  clearInterval(jumpTimer);
  target = Math.max(0, Math.min(max, target));
  if (target === cur) return;
  const dir = target > cur ? 1 : -1;
  step(dir);
  if (target === cur) return;
  jumpTimer = setInterval(() => {
    step(dir);
    if (cur === target) clearInterval(jumpTimer);
  }, 260);
}

function update() {
  book.classList.toggle('is-closed', !single && cur === 0);
  const vis = visibleFaces();
  pages.forEach((p, i) => {
    const on = vis.includes(i);
    p.inert = !on;
    p.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
  barLabel.textContent = vis.map((i) => titles[i]).join(' & ');
  prevBtn.disabled = cur === 0;
  nextBtn.disabled = cur === max;
}


// Table of contents numbers
document.querySelectorAll('[data-goto]').forEach((b) => {
  const idx = ids.indexOf(b.dataset.goto);
  const num = b.querySelector('b');
  if (num && idx >= 0) num.textContent = idx + 1;
});
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-goto]');
  if (g) { const i = ids.indexOf(g.dataset.goto); if (i >= 0) goTo(curFor(i)); return; }
  const n = e.target.closest('[data-go]');
  if (n) step(n.dataset.go === 'next' ? 1 : -1);
});
prevBtn.addEventListener('click', () => step(-1));
nextBtn.addEventListener('click', () => step(1));

document.addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.body.classList.contains('modal-open')) return;
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft') step(-1);
});

// Swipe to turn
let sx = 0, sy = 0;
book.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
book.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - sx;
  const dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > 70 && Math.abs(dy) < 50) step(dx < 0 ? 1 : -1);
}, { passive: true });

// Rebuild when the screen switches between one-page and two-page layouts
wide.addEventListener('change', () => {
  const facing = single ? cur : (cur === 0 ? 0 : 2 * cur);
  const nowSingle = !wide.matches;
  build(nowSingle ? facing : Math.ceil(facing / 2));
});

build(0);
