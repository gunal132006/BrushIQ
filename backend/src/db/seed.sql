-- Seed initial tips into the tips table
INSERT INTO tips (category, title, content, illustration_url) VALUES 
('Dental Hygiene', 'The Golden Rule of Flossing', 'Floss at least once a day to remove food particles and plaque between teeth where your toothbrush bristles cannot reach. Gentle, vertical sliding motion prevents gum trauma.', '/illustrations/flossing.png'),
('Dental Hygiene', 'Stay Hydrated for Saliva Production', 'Saliva is your mouth''s natural defense against tooth decay. It washes away food debris and neutralizes acids produced by bacteria. Drink plenty of water throughout the day.', '/illustrations/hydration.png'),
('Dental Hygiene', 'Limit Sugary and Acidic Foods', 'Sugary snacks and acidic drinks feed harmful bacteria in your mouth, which create acids that eat away at your enamel. Opt for calcium-rich cheeses, nuts, and leafy greens instead.', '/illustrations/diet.png'),

('Brushing Techniques', 'The 45-Degree Angle Rule', 'Hold your toothbrush at a 45-degree angle to your gums. Use gentle, circular strokes rather than sawing back and forth. This cleans both the tooth surface and the critical gum line.', '/illustrations/angle.png'),
('Brushing Techniques', 'The Two-Minute Duration', 'Always brush for at least 2 full minutes. Divide your mouth into four quadrants (top-left, top-right, bottom-left, bottom-right) and spend 30 seconds on each quadrant. Use a timer!', '/illustrations/timer.png'),
('Brushing Techniques', 'Don''t Forget Your Tongue!', 'Bacteria accumulates on the surface of your tongue, causing bad breath and transferring back onto your teeth. Gently brush your tongue or use a tongue scraper from back to front.', '/illustrations/tongue.png'),

('Brush Maintenance', 'Rinse and Dry Thoroughly', 'After brushing, rinse your toothbrush head thoroughly with tap water to remove remaining toothpaste and debris. Store it upright in an open area to air-dry. Damp bristles promote bacterial growth.', '/illustrations/drying.png'),
('Brush Maintenance', 'Keep it Separate', 'Avoid storing multiple toothbrushes in the same holder where their heads touch. This prevents cross-contamination of bacteria and viral particles between family members.', '/illustrations/separate.png'),
('Brush Maintenance', 'Avoid Closed Containers', 'Storing your toothbrush in a travel cap or closed cabinet keeps the bristles moist for too long, creating a breeding ground for mold and bacteria. Use travel caps only for dry travel.', '/illustrations/closed_caps.png'),

('Kids Oral Care', 'Make Brushing Fun and Engaging', 'Brush together as a family, play their favorite song for 2 minutes, or use a sticker chart to reward consistency. Establishing positive associations with brushing early prevents childhood tooth decay.', '/illustrations/kids.png'),
('Kids Oral Care', 'Correct Toothpaste Amount', 'Use a tiny smear (size of a rice grain) of fluoride toothpaste for children under 3. For kids aged 3 to 6, use a pea-sized amount. Supervise children while brushing to ensure they spit out the foam.', '/illustrations/toothpaste_kids.png'),

('Senior Oral Care', 'Combat Dry Mouth & Enamel Decay', 'Aging and medications can reduce protective saliva flow. Sip water frequently, chew sugar-free gum to stimulate saliva, and use alcohol-free fluoride mouthwashes to protect vulnerable root surfaces.', '/illustrations/senior.png'),
('Senior Oral Care', 'Daily Denture Care Practices', 'Clean dentures daily using a soft-bristled brush and non-abrasive denture cleanser. Store them in water or a mild denture soaking solution overnight to maintain their shape and prevent bacterial buildup.', '/illustrations/denture_care.png');
