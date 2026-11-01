import type { ImageMetadata } from 'astro';
import images from '../content/images.json';

const files = import.meta.glob<ImageMetadata>('../assets/photos/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
});

export function shotFor(id: string) {
  const item = images.items.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown image slot: ${id}`);
  const name = item.src.split('/').pop();
  const match = name ? Object.entries(files).find(([path]) => path.endsWith(`/${name}`)) : undefined;
  return { ...item, photo: match?.[1] };
}
