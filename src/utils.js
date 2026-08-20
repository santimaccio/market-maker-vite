// ====================== UTILITY FUNCTIONS ======================

/**
 * Extrae el ID de un video de YouTube desde varios formatos de URL.
 * @param {string} url - URL de YouTube
 * @returns {string|null} - ID del video o null
 */
export function parseYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
    || url.match(/^([a-zA-Z0-9_-]{11})$/);
  return m ? m[1] : null;
}

/**
 * Formatea un número como moneda argentina.
 * @param {number} n
 * @returns {string}
 */
export function fmtMoney(n) {
  if (n == null || isNaN(n)) return '$0';
  return '$' + Math.round(n).toLocaleString('es-AR');
}

/**
 * Formatea un porcentaje con signo.
 * @param {number} n
 * @returns {string}
 */
export function fmtPct(n) {
  if (n == null || isNaN(n)) return '0.0%';
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
}

/**
 * Debounce — envuelve un callback para que solo se ejecute
 * tras `delay` ms sin nuevas invocaciones.
 * @param {Function} callback
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(callback, delay = 250) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), delay);
  };
}
