export function getLocalApiBase() {
  if (typeof window === 'undefined') return '';
  return window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';
}
