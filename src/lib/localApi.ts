import { supabase } from './supabase';

export function getLocalApiBase() {
  if (typeof window === 'undefined') return '';
  return window.location.hostname === 'localhost' ? 'http://localhost:4000' : '';
}

export async function localApiFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers || {});
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return fetch(`${getLocalApiBase()}${path}`, {
    ...init,
    headers,
  });
}
