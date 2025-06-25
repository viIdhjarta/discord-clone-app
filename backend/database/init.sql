-- Discord Clone Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servers (Guilds) table
CREATE TABLE IF NOT EXISTS servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon_url VARCHAR(255),
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'dm'
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Server members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS server_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    server_id INTEGER REFERENCES servers(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, server_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON server_members(server_id);

-- Insert sample data for development
INSERT INTO users (username, email, password_hash) VALUES 
('testuser', 'test@example.com', '$2b$10$dummy.hash.for.development'),
('admin', 'admin@example.com', '$2b$10$dummy.hash.for.development')
ON CONFLICT DO NOTHING;

INSERT INTO servers (name, owner_id) VALUES 
('General Server', 1),
('Development', 2)
ON CONFLICT DO NOTHING;

INSERT INTO channels (name, server_id) VALUES 
('general', 1),
('random', 1),
('development', 2),
('bugs', 2)
ON CONFLICT DO NOTHING;

INSERT INTO server_members (user_id, server_id, role) VALUES 
(1, 1, 'owner'),
(2, 1, 'member'),
(2, 2, 'owner'),
(1, 2, 'member')
ON CONFLICT DO NOTHING;