export interface Season {
  id: string;
  kanji: string;
  romaji: string;
  name: string;
  month: number;
  day: number;
  note: string;
}

// The house's own clock: visitors abroad still see the season in Kyoto today.
function kyotoToday(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { month: get('month'), day: get('day') };
}

// `seasons` runs in calendar order; before the first start date the year is still in the last season.
export function seasonIndex(seasons: Season[], now = new Date()) {
  const { month, day } = kyotoToday(now);
  let index = seasons.length - 1;
  for (let i = 0; i < seasons.length; i++) {
    const { month: m, day: d } = seasons[i];
    if (m < month || (m === month && d <= day)) index = i;
  }
  return index;
}

export function currentAndNext(seasons: Season[], now = new Date()) {
  const index = seasonIndex(seasons, now);
  return { current: seasons[index], next: seasons[(index + 1) % seasons.length] };
}

export function startDate(season: Season, locale: string) {
  const tag = locale === 'en' ? 'en-GB' : locale;
  return new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    Date.UTC(2000, season.month - 1, season.day),
  );
}

export const seasonTitle = (season: Season) => `${season.romaji} · ${season.name}`;
