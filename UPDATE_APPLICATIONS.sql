-- Update Event Applications schema
ALTER TABLE event_applications
ADD COLUMN IF NOT EXISTS portfolio_link VARCHAR(255),
ADD COLUMN IF NOT EXISTS additional_note TEXT;
