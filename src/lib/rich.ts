const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Copy may hold [facts still to confirm]; mark them so they cannot be mistaken for final text.
export function rich(text: string) {
  return escapeHtml(text).replace(/\[[^\]]+\]/g, '<span class="tbc">$&</span>');
}

export const isConfirmed = (value: string) => Boolean(value) && !value.includes('[');
