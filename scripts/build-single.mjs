// Turns dist/ into share-single/index.html: the whole site in one file, for publishing as a Claude artifact.
// Pages become hidden sections reached by #tokens; photographs and videos are embedded and loaded per page.
// Run after `npm run build`.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const out = join(root, 'share-single');
const pages = ['', 'tea', 'tea/house', 'tea/tea', 'tea/food', 'tea/gatherings', 'tea/seasons', 'tea/visit', 'stay'];
const token = (page) => page.replace(/\//g, '-') || 'home';
const types = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4' };

const assets = new Map();
const asset = (path) => {
  if (!assets.has(path)) {
    const data = readFileSync(join(dist, path)).toString('base64');
    assets.set(path, { key: `a${assets.size}`, uri: `data:${types[extname(path)]};base64,${data}` });
  }
  return assets.get(path).key;
};

// Prefer the 1200px WebP: sharp enough on a laptop, and light enough for one file.
const pickWebp = (set) => {
  const entries = set.split(',').map((entry) => {
    const [path, width] = entry.trim().split(/\s+/);
    return { path, width: parseInt(width, 10) };
  });
  const fit = entries.filter((entry) => entry.width <= 1200);
  return (fit.length ? fit : entries).at(-1).path;
};

let css = '';
let fonts = '';
let module = '';
const sections = [];

for (const page of pages) {
  const html = readFileSync(join(dist, page ? `${page}/index.html` : 'index.html'), 'utf8');
  const name = token(page);
  const title = html.match(/<title>(.*?)<\/title>/)[1];

  if (!css) {
    css = readFileSync(join(dist, html.match(/href="(\/_astro\/[^"]+\.css)"/)[1]), 'utf8');
    fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis[^>]*>/)[0];
    module = html.match(/<script type="module">(.*?)<\/script>/s)[1];
  }

  let body = html.match(/<body\b[^>]*>(.*)<\/body>/s)[1].replace(/<script\b.*?<\/script>/gs, '');

  // Ids repeat across pages, so each page gets its own.
  body = body
    .replace(/\b(id|for|aria-controls|aria-labelledby|aria-describedby)="([^"]+)"/g, (_, attr, value) =>
      `${attr}="${value.split(' ').map((id) => `${name}--${id}`).join(' ')}"`)
    .replace(/href="#([^"]+)"/g, (_, id) => `href="#${name}--${id}"`);

  // /tea/visit/?interest=stay#enquire -> #tea-visit, with the rest kept for the page switcher.
  body = body.replace(/href="\/([^"?#]*)(?:\?interest=([^"#]*))?(?:#([^"]*))?"/g, (_, path, interest, anchor) => {
    const target = token(path.replace(/\/$/, ''));
    return `href="#${target}" data-page="${target}"${interest ? ` data-interest="${interest}"` : ''}${anchor ? ` data-anchor="${target}--${anchor}"` : ''}`;
  });

  body = body.replace(/<picture>(.*?)<\/picture>/gs, (block) => {
    const webp = block.match(/<source srcset="([^"]+)" type="image\/webp"/);
    const img = block.match(/<img\b[^>]*>/)[0];
    const source = webp ? pickWebp(webp[1]) : img.match(/\bsrc="([^"]+)"/)[1];
    return img
      .replace(/\s(src|srcset|sizes)="[^"]*"/g, '')
      .replace('<img', `<img data-asset="${asset(source)}"`);
  });
  body = body.replace(/<img\b[^>]*\bsrc="(\/[^"]+)"[^>]*>/g, (img, source) =>
    img.replace(/\s(src|srcset|sizes)="[^"]*"/g, '').replace('<img', `<img data-asset="${asset(source)}"`));
  body = body.replace(/<video\b[^>]*>/g, (video) =>
    video.replace(/\bsrc="([^"]+)"/, (_, source) => `data-asset="${asset(source)}"`)
      .replace(/\bposter="([^"]+)"/, (_, source) => `data-poster="${asset(source)}"`));

  const left = body.match(/(?:src|srcset|poster)="\/[^"]*"/);
  if (left) throw new Error(`${name}: unconverted asset ${left[0]}`);

  sections.push(`<div class="page" data-view="${name}" data-title="${title}" hidden>${body}</div>`);
}

const switcher = `
(() => {
  const assets = JSON.parse(document.getElementById('site-assets').textContent);
  const views = [...document.querySelectorAll('[data-view]')];
  const find = (name) => views.find((view) => view.dataset.view === name);
  const load = (view) => {
    view.querySelectorAll('img[data-asset], video[data-asset]').forEach((media) => {
      if (media.tagName === 'VIDEO' && media.dataset.poster) media.poster = assets[media.dataset.poster];
      media.src = assets[media.dataset.asset];
      media.removeAttribute('data-asset');
    });
  };
  const show = (name, { anchor, interest } = {}) => {
    const next = find(name) || views[0];
    views.forEach((view) => { view.hidden = view !== next; });
    load(next);
    document.title = next.dataset.title;
    if (interest) {
      const chip = next.querySelector('input[name="interest"][value="' + CSS.escape(interest) + '"]');
      if (chip) chip.checked = true;
    }
    const target = anchor && document.getElementById(anchor);
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  };
  const current = () => location.hash.slice(1);
  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href^="#"]');
    if (!link) return;
    event.preventDefault();
    const name = link.dataset.page;
    if (name) {
      show(name, { anchor: link.dataset.anchor, interest: link.dataset.interest });
      try { history.pushState(null, '', '#' + name); } catch {}
    } else {
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (target) { target.setAttribute('tabindex', '-1'); target.focus(); }
    }
  });
  addEventListener('hashchange', () => show(current()));
  addEventListener('popstate', () => show(current()));
  show(current());
})();
`;

const page = `<title>ie.house</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
${fonts}
<style>${css}</style>
<script>document.documentElement.classList.add('js');</script>
${sections.join('\n')}
<script type="application/json" id="site-assets">${JSON.stringify(Object.fromEntries([...assets.values()].map(({ key, uri }) => [key, uri])))}</script>
<script>${switcher}</script>
<script type="module">${module}</script>
`;

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), page);
console.log(`share-single/index.html written: ${pages.length} pages, ${assets.size} media files, ${(Buffer.byteLength(page) / 1048576).toFixed(1)} MB.`);
