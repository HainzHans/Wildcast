import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Öffentliche Zugangsdaten des Wildcast-Projekts. Der Publishable Key darf im Client stehen:
 * Was gelesen oder geschrieben werden darf, regeln die RLS-Policies in der Datenbank.
 */
const SUPABASE_URL = 'https://qijgadoeqjikuwprtxot.supabase.co';
const SUPABASE_KEY = 'sb_publishable_11ISgncJM4Kc5O5N8XIogw_VZBajSR8';

let client: Promise<SupabaseClient> | null = null;

/** Lädt den Supabase-Client erst bei Bedarf, damit er den Start der App nicht bremst. */
export function supabase(): Promise<SupabaseClient> {
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } }),
  );
  return client;
}
