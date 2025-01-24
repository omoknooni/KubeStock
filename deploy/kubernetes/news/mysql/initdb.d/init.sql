USE stock;
CREATE TABLE IF NOT EXISTS rss_news (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guid VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    link TEXT NOT NULL,
    pub_date DATETIME,
    source VARCHAR(100),
    media_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
