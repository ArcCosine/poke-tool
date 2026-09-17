-- 0001_initial_schema.sql: Cloudflare D1 Initial Schema for Poke-Tool

-- 1. Users Table (Google & X OAuth 2.0)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    auth_provider TEXT NOT NULL,
    auth_provider_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(auth_provider, auth_provider_id)
);

-- 2. Parties Table (Shared party builds & articles)
CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    regulation TEXT DEFAULT 'all',
    party_data TEXT NOT NULL,
    rental_code TEXT,
    article_url TEXT,
    description TEXT,
    is_public INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    ranking_score REAL DEFAULT 0.0,
    views_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parties_user_id ON parties(user_id);
CREATE INDEX IF NOT EXISTS idx_parties_ranking ON parties(is_public, ranking_score DESC, created_at DESC);

-- 3. Party Likes Table (Support both authenticated and anonymous users)
CREATE TABLE IF NOT EXISTS party_likes (
    user_identifier TEXT NOT NULL,
    party_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_identifier, party_id),
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_party_likes_party ON party_likes(party_id);
