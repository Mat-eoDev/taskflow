import { createClient } from '@supabase/supabase-js'

// Client avec service_role — uniquement côté serveur
// Permet à l'admin de créer des utilisateurs
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}