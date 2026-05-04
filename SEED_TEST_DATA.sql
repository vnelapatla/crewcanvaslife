-- 1. Clear existing audition and contest applications to avoid foreign key issues
DELETE FROM event_applications 
WHERE event_id IN (SELECT id FROM events WHERE event_type IN ('Audition', 'Contest'));

-- 2. Clear existing auditions and contests
DELETE FROM events WHERE event_type IN ('Audition', 'Contest');

-- 3. Seed 5 Mock Auditions
INSERT INTO events (title, event_type, description, location, date, time, role_type, age_range, gender_preference, price, org_name, org_email, skills, status, user_id, created_at)
VALUES 
('Lead Role: Historical Drama', 'Audition', 'Searching for a lead actor for a major historical feature film project.', 'Mumbai', '2026-06-15', '10:00 AM', 'Lead', '22-30', 'Any', 15000, 'Epic Frames', 'auditions@epicframes.com', 'Classical Acting, Horse Riding', 'OPEN', 1, NOW()),
('Supporting Cast: Web Series', 'Audition', 'Supporting roles for a crime thriller web series for a major OTT platform.', 'Hyderabad', '2026-06-18', '02:00 PM', 'Supporting', '18-45', 'Any', 8000, 'Shadow Films', 'casting@shadow.in', 'Dialogue Delivery, Expression', 'OPEN', 1, NOW()),
('Lead Actress: Romantic Comedy', 'Audition', 'Looking for a fresh face for a rom-com feature film.', 'Bangalore', '2026-06-20', '11:00 AM', 'Lead', '19-25', 'Female', 25000, 'Bright Star Studios', 'freshface@brightstar.com', 'Acting, Dancing', 'OPEN', 1, NOW()),
('Character Artist: Period Film', 'Audition', 'Experienced character artists needed for a 1940s period drama.', 'Chennai', '2026-06-22', '10:00 AM', 'Cameo', '40-60', 'Any', 12000, 'Legacy Pictures', 'talent@legacy.com', 'Method Acting, Regional Accents', 'OPEN', 1, NOW()),
('Background Extras: Music Video', 'Audition', 'Dancers and background artists for a high-energy pop music video.', 'Delhi', '2026-06-25', '09:00 AM', 'Extra', '18-30', 'Any', 3000, 'Vibe Records', 'vibe@records.com', 'Dancing, Energy', 'OPEN', 1, NOW());

-- 4. Seed 5 Mock Contests
INSERT INTO events (title, event_type, description, location, date, end_date, prize_pool, org_name, org_email, skills, status, user_id, created_at)
VALUES 
('Indie Short Film Contest 2026', 'Contest', 'The biggest platform for indie filmmakers. Submit your short films under 15 mins.', 'Online', '2026-07-01', '2026-07-30', '₹50,000 + Distribution Deal', 'Filmmakers Guild', 'submit@filmguild.org', 'Directing, Cinematography', 'OPEN', 1, NOW()),
('Scriptwriting Marathon', 'Contest', '36-hour challenge to write a compelling screenplay from a secret prompt.', 'Online', '2026-07-05', '2026-07-07', '₹20,000 + Production Support', 'Writers Room', 'write@writersroom.com', 'Screenwriting, Creativity', 'OPEN', 1, NOW()),
('Best Mobile Cinematography', 'Contest', 'Capture the essence of your city using only your mobile phone.', 'Online', '2026-07-10', '2026-07-25', 'Latest iPhone + Pro Lens Kit', 'Mobile Creators', 'lens@mobile.com', 'Cinematography, Mobile Editing', 'OPEN', 1, NOW()),
('Editing Excellence Challenge', 'Contest', 'Edit a provided raw footage into a 2-min trailer. Show us your pacing skills.', 'Online', '2026-07-15', '2026-07-20', 'Adobe CC Subscription + ₹10,000', 'Edit Masters', 'challenge@editmasters.in', 'Video Editing, Sound Design', 'OPEN', 1, NOW()),
('Acting Monologue Contest', 'Contest', 'Perform a 1-min monologue from any classic film. Top 3 get direct audition invites.', 'Online', '2026-07-20', '2026-08-05', 'Direct Audition Invites + Certificate', 'Actors Academy', 'contest@actors.org', 'Acting, Monologue', 'OPEN', 1, NOW());

-- 5. Seed 5 Mock Film Events
INSERT INTO events (title, event_type, description, location, date, time, price, org_name, org_email, status, user_id, created_at)
VALUES 
('Premiere Night: "Shadows"', 'Film Event', 'Exclusive premiere of the psychological thriller "Shadows". Followed by a networking cocktail.', 'PVR Director''s Cut', '2026-08-10', '07:00 PM', 500, 'Noir Studios', 'events@noir.com', 'OPEN', 1, NOW()),
('Indie Film Marathon', 'Film Event', '12 hours of the best independent cinema from across the country.', 'Film Division Aud.', '2026-08-15', '10:00 AM', 200, 'Cinephile Club', 'marathon@cineclub.org', 'OPEN', 1, NOW()),
('Documentary Showcase', 'Film Event', 'Screening of top-rated environmental documentaries and expert panel discussion.', 'Stein Auditorium', '2026-08-20', '04:00 PM', 150, 'Green Earth Films', 'info@greenfilms.in', 'OPEN', 1, NOW()),
('Retro Cinema Night', 'Film Event', 'Relive the magic of the 70s with a 4K restoration of classic masterpieces.', 'Liberty Cinema', '2026-08-25', '06:00 PM', 300, 'Heritage Films', 'retro@heritage.com', 'OPEN', 1, NOW()),
('Animation Film Festival', 'Film Event', 'Showcasing the latest in 2D, 3D, and stop-motion animation from global artists.', 'NID Auditorium', '2026-08-28', '11:00 AM', 250, 'Animators Guild', 'fest@animators.org', 'OPEN', 1, NOW());
