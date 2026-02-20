-- Add user_id column to link reports to specific users
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add reply column for admin responses
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS reply TEXT;

-- Update the status check constraint to allow 'Replied' status
-- First, drop the existing constraint if it exists (name might vary, so we try a common name or just add the new one)
-- If you created the table via Supabase UI, it might not have a named constraint, but let's assume standard SQL.
-- The safest way without knowing the constraint name is to just alter the column type or add a new constraint.

-- If you are using a check constraint for status:
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports ADD CONSTRAINT reports_status_check CHECK (status IN ('Open', 'Resolved', 'Replied'));

-- Optional: Create an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
