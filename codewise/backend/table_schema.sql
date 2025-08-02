-- PostgreSQL Schema
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    subscription_tier VARCHAR(50) DEFAULT 'free',
    learning_preferences JSONB
);

CREATE TABLE coding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    prompt TEXT NOT NULL,
    generated_code TEXT NOT NULL,
    language VARCHAR(50),
    complexity_score INTEGER,
    concepts TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES coding_sessions(id),
    user_id UUID REFERENCES users(id),
    questions JSONB NOT NULL,
    answers JSONB NOT NULL,
    score DECIMAL(3,2),
    passed BOOLEAN,
    time_taken INTEGER, -- seconds
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    concept VARCHAR(100),
    proficiency_level INTEGER DEFAULT 0, -- 0-100
    total_attempts INTEGER DEFAULT 0,
    successful_attempts INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, concept)
);

CREATE TABLE code_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES coding_sessions(id),
    user_id UUID REFERENCES users(id),
    feedback_type VARCHAR(50), -- 'helpful', 'not_helpful', 'too_easy', 'too_hard'
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_created ON coding_sessions(user_id, created_at DESC);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id, created_at DESC);
CREATE INDEX idx_learning_progress_user ON learning_progress(user_id, concept);