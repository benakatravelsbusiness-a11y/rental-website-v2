DROP TABLE IF EXISTS cars;
CREATE TABLE cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  image_url TEXT,
  features TEXT,
  available BOOLEAN DEFAULT true
);

INSERT INTO cars (name, category, price, image_url, features, available) 
VALUES ('Tesla Model S Plaid', 'Electric', 150, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800', 'Autopilot, 1020hp', true);

INSERT INTO cars (name, category, price, image_url, features, available) 
VALUES ('Porsche 911 GT3', 'Sports', 280, 'https://images.unsplash.com/photo-1503376713356-2db8cba76317?q=80&w=800', 'Track Ready, 502hp', true);

INSERT INTO cars (name, category, price, image_url, features, available) 
VALUES ('Range Rover Sport', 'SUV', 120, 'https://images.unsplash.com/photo-1606016159991-d85c4bf41849?q=80&w=800', 'AWD, Luxury Interior', true);
