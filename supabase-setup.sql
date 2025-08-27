-- Supabase Setup Instructions
-- 
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Run this SQL script to create the trading_performance table

-- Create the trading_performance table
CREATE TABLE IF NOT EXISTS trading_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rating DECIMAL(3,1) NOT NULL CHECK (rating >= 1 AND rating <= 10),
    hours_awake DECIMAL(4,1) NOT NULL CHECK (hours_awake >= 0 AND hours_awake <= 24),
    date DATE NOT NULL,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on date for faster queries
CREATE INDEX idx_trading_performance_date ON trading_performance(date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE trading_performance ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- Note: Adjust this based on your authentication needs
CREATE POLICY "Allow all operations for authenticated users" ON trading_performance
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- If you're using anonymous access (with just the API key), use this policy instead:
-- DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON trading_performance;
-- CREATE POLICY "Allow all operations with API key" ON trading_performance
--     FOR ALL 
--     TO anon
--     USING (true)
--     WITH CHECK (true);
