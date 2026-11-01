// Copies the chosen files from Photo/ into the site: photos to src/assets/photos, videos to public/videos.
// Videos lose their audio track and are re-encoded for the web; each gets a poster from its first frame.
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = join(root, 'Photo');
const photos = join(root, 'src/assets/photos');
const videos = join(root, 'public/videos');
mkdirSync(photos, { recursive: true });
mkdirSync(videos, { recursive: true });

const photoFiles = {
  'main-gate': 'IE FUSHIMI - IE.HOUSE Main Gate.jpeg',
  beams: 'IE BEAMS.jpeg',
  'hallway-decoration': 'IE First-floor hallway decoration.jpeg',
  'sand-hearth': 'IE SAND HEARTH HOJICHA CHAI.jpeg',
  'shoji-light': 'IE SUNLIGHT ON SHOJI.JPG.jpeg',
  'loft-room': 'IE LOFT RM.jpeg',
  'window-grille': 'IE WINDOW GRILLE.JPG.jpeg',
  'look-out-to-street': 'IE ANNEX A L1 LOOK OUT TO STREET.jpeg',
  'old-wall-chair': 'IE An old wall and an antique chair.jpeg',
  'garden-to-annex': 'IE GARDEN LOOKING TO ANNEX B.jpeg',
  'moss-fern': 'IE MOSS 1.jpeg',
  'moss-stone': 'IE MOSS 2.jpeg',
  'tatami-tray': 'IE ANNEXE A L1 TATAMI RM ATELIER.jpeg',
  'tatami-garden': 'IE ANNEXE A L1 TATAMI RM.jpeg',
  financier: 'IE FUSHIMI - IE.HOUSE Financier.jpeg',
  wagashi: 'generated/atelier-wagashi.png',
  'upper-tatami': 'IE ANNEX A L2 TATAMI RM.jpeg',
  'cafe-area': 'IE FUSHIMI - IE.HOUSE 1st Floor Cafe Area.jpeg',
  'room-first-light': 'IE ANNEXE B L1 TATAMI RM.jpeg',
};

const videoFiles = {
  'main-hero': 'Hero Video.mp4',
  'hero-opening': 'IE hero_opening.mp4',
  'sand-hearth': 'IE SAND HEARTH HOJICHA CHAI.mp4',
  water: 'IE Water.mp4',
  'tea-making': 'IE TEA MEAKING.mp4',
  'tea-bottle': 'IE Bubbles rising in tea bottle..mp4',
  oven: 'IE Bread-baking oven.mp4',
};

for (const [name, file] of Object.entries(photoFiles)) {
  await sharp(join(source, file))
    .rotate()
    .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toFile(join(photos, `${name}.jpg`));
}

for (const [name, file] of Object.entries(videoFiles)) {
  const input = join(source, file);
  // The main hero runs the full width of the screen, so it keeps more detail than the others.
  // It loops only the opening five seconds, and its timber is nearly black in the source, so the shadows are lifted too.
  const [crf, width, tone, trim] = name === 'main-hero' ? ['19', 1920, "curves=all='0/0 0.1/0.2 0.3/0.52 0.7/0.88 1/1'", ['-t', '5']] : ['27', 1280, 'null', []];
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', input, ...trim, '-an', '-c:v', 'libx264', '-crf', crf, '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-vf', `${tone},scale='min(${width},iw)':-2`, join(videos, `${name}.mp4`)]);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', input, '-frames:v', '1', '-q:v', '3', '-vf', tone, join(photos, `${name}-poster.jpg`)]);
}

console.log(`${Object.keys(photoFiles).length} photos and ${Object.keys(videoFiles).length} videos imported.`);
