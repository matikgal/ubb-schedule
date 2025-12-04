import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase is optional - app works offline-first with localStorage
let supabaseInstance: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url_here') {
	try {
		supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
		// console.log('✅ Supabase client initialized')
	} catch (error) {
		console.warn('⚠️ Failed to initialize Supabase, using offline mode:', error)
	}
} else {
	// console.log('📴 Running in offline-only mode (no Supabase configured)')
}

export const supabase = supabaseInstance
export const isSupabaseAvailable = !!supabaseInstance
