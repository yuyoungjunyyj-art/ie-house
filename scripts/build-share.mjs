// Turns dist/ into share/: a preview with relative links and inlined CSS, for publishing as a Claude artifact.
// Run after `npm run build`.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const share = join(root, 'share');
const pages = ['', 'tea', 'tea/house', 'tea/tea', 'tea/food', 'tea/gatherings', 'tea/seasons', 'tea/visit', 'stay'];

rmSync(share, { recursive: true, force: true });

for (const page of pages) {
  const file = page ? `${page}/index.html` : 'index.html';
  let html = readFileSync(join(dist, file), 'utf8');
  const up = '../'.repeat(page ? page.split('/').length : 0);

  const asset = (path) => {
    // Artifact hosts reserve names that start with an underscore.
    const published = path.replace(/^\/_astro\//, 'assets/').replace(/^\//, '');
    const target = join(share, published);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(dist, path), target);
    return `${up}${published}`;
  };

  // Inline the stylesheet, and drop tags that only matter on the real domain.
  html = html.replace(/<link[^>]*href="(\/_astro\/[^"]+\.css)"[^>]*>/g, (_, href) => `<style>${readFileSync(join(dist, href), 'utf8')}</style>`);
  html = html.replace(/<link rel="(canonical|alternate|icon)"[^>]*>/g, '');
  html = html.replace(/<meta (property="og:|name="twitter:)[^>]*>/g, '');
  html = html.replace(/<script type="application\/ld\+json">.*?<\/script>/s, '');

  // /tea/visit/?interest=stay#enquire -> ../tea/visit/index.html?interest=stay#enquire
  html = html.replace(/href="\/([^"?#]*)([^"]*)"/g, (_, path, suffix) => `href="${up}${path}index.html${suffix}"`);

  // Photographs, posters and videos travel with the preview.
  html = html.replace(/\b(src|poster)="(\/[^"]+)"/g, (_, attr, path) => `${attr}="${asset(path)}"`);
  html = html.replace(/\bsrcset="([^"]+)"/g, (_, set) => {
    const entries = set.split(',').map((entry) => {
      const [path, width] = entry.trim().split(/\s+/);
      return width ? `${asset(path)} ${width}` : asset(path);
    });
    return `srcset="${entries.join(', ')}"`;
  });

  if (!page) {
    // The artifact host wraps its main page in its own document skeleton.
    html = html
      .replace(/<!doctype html>/i, '')
      .replace(/<\/?(html|head)\b[^>]*>/g, '')
      .replace(/<\/body>/, '')
      .replace(/<body\b([^>]*)>/, '<div hidden data-video-labels$1></div>')
      .replace(/<title>.*?<\/title>/, '<title>ie.house</title>');
  }

  const target = join(share, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html);
}

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const files = walk(share).map((path) => relative(share, path).replace(/\\/g, '/'));
const bytes = walk(share).reduce((sum, path) => sum + statSync(path).size, 0);
console.log(`share/ written: ${pages.length} pages, ${files.length} files, ${(bytes / 1048576).toFixed(1)} MB.`);
