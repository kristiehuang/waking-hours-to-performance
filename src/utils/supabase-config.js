import { createClient } from '@supabase/supabase-js';

// Supabase configuration
export const SUPABASE_URL = 'https://hempirkrllmcwydslbqn.supabase.co';

// This is the public anon key - safe to expose
// Security is handled by Row Level Security (RLS) policies in Supabase
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlbXBpcmtybGxtY3d5ZHNsYnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDM0MzMsImV4cCI6MjA3MTg3OTQzM30.w0X8DmwdI1o0EckxA6KRXoWXhe3Bmfah-ZNqWhn7j1M"

// Table name
export const TRADING_TABLE = 'trading_performance';

// Initialize Supabase client
export const supabaseClient = SUPABASE_KEY !== "your-supabase-key-here" ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Check if Supabase was initialized successfully
if (!supabaseClient && SUPABASE_KEY !== "your-supabase-key-here") {
    console.error('Failed to initialize Supabase client');
}
