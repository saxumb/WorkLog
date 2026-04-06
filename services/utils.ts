
/**
 * Formats a Date object to YYYY-MM-DD string in local time.
 */
export const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD string into a Date object at midnight local time.
 */
export const fromLocalDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Calculates Easter Sunday for a given year.
 */
const getEaster = (year: number): Date => {
  const f = Math.floor,
    G = year % 19,
    C = f(year / 100),
    H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
    I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
    J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
    L = I - J,
    month = 3 + f((L + 40) / 44),
    day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
};

/**
 * Checks if a date is an Italian national holiday.
 */
export const isHoliday = (date: Date): boolean => {
  const day = date.getDate();
  const month = date.getMonth() + 1; // 1-indexed
  const year = date.getFullYear();

  // Fixed holidays
  if (month === 1 && day === 1) return true; // Capodanno
  if (month === 1 && day === 6) return true; // Epifania
  if (month === 4 && day === 25) return true; // Liberazione
  if (month === 5 && day === 1) return true; // Lavoro
  if (month === 6 && day === 2) return true; // Repubblica
  if (month === 8 && day === 15) return true; // Ferragosto
  if (month === 11 && day === 1) return true; // Ognissanti
  if (month === 12 && day === 8) return true; // Immacolata
  if (month === 12 && day === 25) return true; // Natale
  if (month === 12 && day === 26) return true; // S. Stefano

  // Dynamic holidays (Easter Monday)
  const easter = getEaster(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);

  if (date.getMonth() === easterMonday.getMonth() && date.getDate() === easterMonday.getDate()) {
    return true;
  }

  return false;
};
