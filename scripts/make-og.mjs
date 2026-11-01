// Renders public/og-default.png, used when a page has no photograph.
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#F4EFE4"/>
  <g transform="translate(600 315) scale(0.42) translate(-389 -542)" fill="#211A17">
    <path d="M112 106 L301 110 L307 129 L304 946 L316 978 L98 978 L108 944 L104 137 Z"/>
    <path d="M403 110 L648 106 Q674 110 680 134 L678 301 Q674 325 649 330 L423 326 Q398 322 394 298 L396 139 Q398 118 403 110 Z"/>
    <path d="M403 404 L648 399 Q675 404 680 429 L678 596 Q672 620 648 624 L423 621 Q398 617 394 593 L396 433 Q398 411 403 404 Z"/>
    <path d="M403 699 L648 695 Q675 700 680 724 L678 891 Q672 915 648 920 L423 917 Q398 913 394 889 L396 728 Q398 706 403 699 Z"/>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL('../public/og-default.png', import.meta.url)));
