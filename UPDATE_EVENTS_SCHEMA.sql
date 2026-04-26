USE crewcanvas_db;

-- Update events table to include time_duration column
ALTER TABLE events ADD COLUMN IF NOT EXISTS time_duration VARCHAR(255);

-- Also add end_date if it's missing (though it seems to be in the model)
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date DATE;

-- Success Message
SELECT 'Events table update complete!' AS result;
