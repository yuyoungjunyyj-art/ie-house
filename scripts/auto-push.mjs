// Commits and pushes any changes. Run by the Stop hook in .claude/settings.json.
import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const maxBytes = 50 * 1024 * 1024;
const secret = /(^|\/)(\.env(\.(?!example$)[^/]*)?|[^/]*\.(pem|key|p12|pfx)|id_(rsa|ed25519)[^/]*)$/i;

function git(...args) {
  const run = spawnSync('git', ['-c', 'core.quotepath=false', ...args], { cwd: root, encoding: 'utf8' });
  return { ok: run.status === 0, out: (run.stdout || '').trim(), err: (run.stderr || run.error?.message || '').trim() };
}

// A Stop hook shows the user a message by printing it as JSON.
function finish(message) {
  if (message) console.log(JSON.stringify({ systemMessage: `GitHub auto-upload: ${message}` }));
  process.exit(0);
}

if (!git('rev-parse', '--is-inside-work-tree').ok) finish();

git('add', '-A');
const staged = git('diff', '--cached', '--name-only', '--diff-filter=d').out.split('\n').filter(Boolean);
const held = staged.filter((file) => secret.test(file) || statSync(resolve(root, file)).size > maxBytes);
if (held.length) {
  git('reset', '--quiet');
  finish(`held back, nothing uploaded. Check these files: ${held.join(', ')}`);
}

const changed = git('diff', '--cached', '--name-only').out.split('\n').filter(Boolean);
if (changed.length) {
  const list = changed.slice(0, 20).map((file) => `- ${file}`).join('\n');
  const more = changed.length > 20 ? `\n- and ${changed.length - 20} more` : '';
  const noun = changed.length === 1 ? 'file' : 'files';
  const message = `Update site: ${changed.length} ${noun}\n\n${list}${more}\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`;
  const commit = git('commit', '--quiet', '-m', message);
  if (!commit.ok) finish(`commit failed. ${commit.err}`);
}

// Also retries commits left behind by an earlier failed push.
if (git('rev-list', '--count', '@{u}..HEAD').out === '0') finish();
const push = git('push', '--quiet');
if (!push.ok) finish(`saved locally but the push failed. ${push.err}`);
