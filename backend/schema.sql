

DROP TABLE IF EXISTS expenses;

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL CHECK (category IN ('Food','Transport','Bills','Entertainment','Other')),
    date DATE NOT NULL
);

INSERT INTO expenses (title, amount, category, date) VALUES
('Lunch', 4.50, 'Food', '2026-01-15'),
('Bus ticket', 1.25, 'Transport', '2026-01-15'),
('Electricity bill', 45.00, 'Bills', '2026-01-10'),
('Movie night', 12.00, 'Entertainment', '2026-01-12'),
('Phone case', 8.99, 'Other', '2026-01-08');
