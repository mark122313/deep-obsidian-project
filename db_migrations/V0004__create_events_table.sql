CREATE TABLE t_p85200160_deep_obsidian_projec.events (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    city VARCHAR(100) NOT NULL,
    venue VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ДОСТУПНЫ БИЛЕТЫ',
    city_blur BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);

INSERT INTO t_p85200160_deep_obsidian_projec.events (date, city, venue, status, city_blur, sort_order) VALUES
('2026-04-12', 'МОСКВА', 'Клуб TMNL', 'ДОСТУПНЫ БИЛЕТЫ', true, 1),
('2026-04-19', 'САНКТ-ПЕТЕРБУРГ', 'AURORA', 'FEW LEFT', true, 2),
('2026-05-03', 'ЕКАТЕРИНБУРГ', 'Teleclub', 'ДОСТУПНЫ БИЛЕТЫ', true, 3),
('2026-05-17', 'КАЗАНЬ', 'URBAN', 'СКОРО', true, 4);