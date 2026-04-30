import { createClient } from '@supabase/supabase-js'

// Provide default dummy values so the app doesn't crash during build/dev without env vars.
// In production, these MUST be set.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)