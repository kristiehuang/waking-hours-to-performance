// Supabase configuration
export const SUPABASE_URL = 'https://hempirkrllmcwydslbqn.supabase.co';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "your-supabase-key-here";

// Table name
export const TRADING_TABLE = 'trading_performance';

// Initialize Supabase client
export const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Check if Supabase was initialized successfully
if (!supabaseClient && SUPABASE_KEY !== "your-supabase-key-here") {
    console.error('Failed to initialize Supabase client');
}
