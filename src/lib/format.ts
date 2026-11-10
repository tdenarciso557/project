const LOCALE = 'pt-BR';

export function formatDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export function formatShortDate(date: Date) {
  return date.toLocaleDateString(LOCALE, { day: '2-digit', month: 'short' });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
