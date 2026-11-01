import { currentAndNext, seasonIndex, seasonTitle, startDate, type Season } from '../lib/seasons';

function setUpReveal() {
  const targets = document.querySelectorAll('[data-reveal]');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  targets.forEach((target) => observer.observe(target));
}

// The header slides away while scrolling down, and returns on scrolling up or when scrolling stops.
function setUpHeaderScroll() {
  const headers = document.querySelectorAll<HTMLElement>('.header');
  const setHidden = (hidden: boolean) => {
    headers.forEach((header) => {
      const inUse = header.querySelector(':focus-visible');
      header.classList.toggle('is-hidden', hidden && !inUse);
    });
  };
  let last = window.scrollY;
  let idle: number;
  window.addEventListener(
    'scroll',
    () => {
      const y = Math.max(window.scrollY, 0);
      if (Math.abs(y - last) >= 4) {
        setHidden(y > last && y > 120);
        last = y;
      }
      clearTimeout(idle);
      idle = window.setTimeout(() => setHidden(false), 300);
    },
    { passive: true },
  );
}

function setUpSeasons() {
  document.querySelectorAll<HTMLElement>('[data-season-strip]').forEach((strip) => {
    const seasons: Season[] = JSON.parse(strip.dataset.seasons ?? '[]');
    const locale = strip.dataset.locale ?? 'en';
    const { current, next } = currentAndNext(seasons);
    const set = (selector: string, text: string) => {
      const target = strip.querySelector(selector);
      if (target) target.textContent = text;
    };
    set('[data-season-kanji]', current.kanji);
    set('[data-season-title]', seasonTitle(current));
    set('[data-season-note]', current.note);
    strip.querySelector<HTMLElement>('[data-season-note]')!.hidden = !current.note;
    set('[data-season-next]', `${next.kanji} ${seasonTitle(next)}, ${strip.dataset.from} ${startDate(next, locale)}`);
  });

  const grid = document.querySelector<HTMLElement>('[data-season-grid]');
  if (grid) {
    const cells = [...grid.querySelectorAll<HTMLElement>('[data-season-cell]')];
    const seasons: Season[] = JSON.parse(grid.dataset.seasons ?? '[]');
    const index = seasonIndex(seasons);
    cells.forEach((cell, i) => {
      cell.classList.toggle('is-now', i === index);
      if (i === index) cell.setAttribute('aria-current', 'date');
      else cell.removeAttribute('aria-current');
    });
  }
}

function setUpForms() {
  const interest = new URLSearchParams(location.search).get('interest');
  if (interest) {
    const chip = document.querySelector<HTMLInputElement>(`input[name="interest"][value="${CSS.escape(interest)}"]`);
    if (chip) chip.checked = true;
  }

  document.querySelectorAll<HTMLFormElement>('[data-async-form]').forEach((form) => {
    const status = form.querySelector<HTMLElement>('[data-form-status]');
    const say = (message = '') => {
      if (status) status.textContent = message;
    };
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const endpoint = form.getAttribute('action');
      const fields = new FormData(form);
      if (fields.get('company')) return;
      if (!endpoint) {
        say(form.dataset.unconnected);
        return;
      }
      const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (button) button.disabled = true;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          body: fields,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(String(response.status));
        form.reset();
        say(form.dataset.success);
      } catch {
        say(form.dataset.error);
      } finally {
        if (button) button.disabled = false;
      }
    });
  });
}

// Muted loops play only while on screen. With reduced motion or data saver they stay on their poster.
function setUpVideos() {
  const stayStill =
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  if (stayStill) return;

  document.querySelectorAll<HTMLVideoElement>('[data-video] video').forEach((video) => {
    new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.2 },
    ).observe(video);
  });
}

setUpReveal();
setUpHeaderScroll();
setUpVideos();
setUpSeasons();
setUpForms();
