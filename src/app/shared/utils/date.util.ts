import { LOCALE } from '../constants/locale';

type DateInput = Date | string | null | undefined;

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  return input instanceof Date ? input : new Date(input);
}

/** "15 jun" */
export function formatShort(input: DateInput): string {
  const d = toDate(input);
  return d ? d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }) : '';
}

/** "15 jun 2026" */
export function formatMedium(input: DateInput): string {
  const d = toDate(input);
  return d ? d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

/** "lunes, 15 de junio" */
export function formatLongDate(input: DateInput): string {
  const d = toDate(input);
  return d ? d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }) : '';
}

/** "lunes, 15 de junio de 2026" */
export function formatFullDate(input: DateInput): string {
  const d = toDate(input);
  return d
    ? d.toLocaleDateString(LOCALE, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';
}

/** "lun, 15 jun, 02:30 p. m." */
export function formatDayMonthTime(input: DateInput): string {
  const d = toDate(input);
  return d
    ? d.toLocaleDateString(LOCALE, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
}
