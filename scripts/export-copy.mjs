// Writes COPY.md, a readable review of all site copy, and lists every [fact still to confirm].
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../src/content/', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));

const pages = [
  ['ie.house · Brand home (/)', 'en/brand.json'],
  ['IE House of Tea · Home (/tea)', 'en/tea-home.json'],
  ['The House (/tea/house)', 'en/house.json'],
  ['Tea (/tea/tea)', 'en/tea.json'],
  ['Tea list', 'en/data/menu.json'],
  ['Food (/tea/food)', 'en/food.json'],
  ['Dishes', 'en/data/dishes.json'],
  ['Gatherings (/tea/gatherings)', 'en/gatherings.json'],
  ['Seasons (/tea/seasons)', 'en/seasons.json'],
  ['Twenty-four seasons', 'en/data/seasons.json'],
  ['Journal', 'en/data/journal.json'],
  ['Plan Your Visit (/tea/visit)', 'en/visit.json'],
  ['IE Stays holding page (/stay)', 'en/stay.json'],
  ['Header, footer, forms, 404', 'en/site.json'],
  ['House details', 'settings.json'],
];

// Fields that drive the build rather than say anything to a reader.
const skip = new Set(['id', 'shots', 'shot', 'href', 'icon', 'value', 'ratio', 'src', 'alt', 'month', 'day']);
const out = ['# Ie copy', '', 'Generated from `src/content` by `npm run copy`. Edit those files, not this one.', ''];
const pending = [];

function walk(value, depth, label) {
  const pad = '  '.repeat(depth);
  if (typeof value === 'string') {
    if (!value) return;
    for (const match of value.match(/\[[^\]]+\]/g) ?? []) pending.push(match);
    out.push(label ? `${pad}- **${label}:** ${value}` : `${pad}- ${value}`);
  } else if (Array.isArray(value)) {
    if (value.length === 0) return;
    if (label && label !== 'items') out.push(`${pad}- **${label}**`);
    const inner = label && label !== 'items' ? depth + 1 : depth;
    value.forEach((item) => walk(item, inner));
  } else if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([key]) => !skip.has(key));
    if (label) out.push(`${pad}- **${label}**`);
    entries.forEach(([key, item], i) => {
      const nested = label ? depth + 1 : depth;
      walk(item, nested, key);
      if (!label && i === entries.length - 1 && depth > 0) return;
    });
  }
}

for (const [title, file] of pages) {
  out.push(`## ${title}`, '');
  walk(read(file), 0);
  out.push('');
}

const unique = [...new Set(pending)];
out.push(`## To confirm (${unique.length})`, '', ...unique.map((item) => `- [ ] ${item.slice(1, -1)}`), '');
writeFileSync(new URL('../COPY.md', import.meta.url), out.join('\n'));
console.log(`COPY.md written. ${unique.length} facts still to confirm.`);
