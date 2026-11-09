import { supabase, isSupabaseConfigured } from './supabase.js'

// Permanently deletes the signed-in user's account. The DB function deletes
// their auth.users row, which cascade-deletes every hugeaf_* table for them.
export async function deleteAccount() {
  if (!isSupabaseConfigured) return { error: new Error('Not connected') }
  const { error } = await supabase.rpc('delete_own_account')
  return { error }
}
