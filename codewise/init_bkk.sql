-- This file will be executed when the PostgreSQL container starts
-- It contains the complete mission-critical database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create enums
CREATE TYPE auth_method_enum AS ENUM ('email', 'sso', 'hybrid');
CREATE TYPE account_type_enum AS ENUM ('individual', 'organization_member');
CREATE TYPE subscription_plan_enum AS ENUM ('free', 'starter', 'pro', 'business', 'enterprise');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'suspended', 'cancelled', 'trial', 'past_due');
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE company_size_enum AS ENUM ('startup', 'small', 'medium', 'large', 'enterprise');
CREATE TYPE permission_category_enum AS ENUM ('user_management', 'organization', 'system', 'content', 'profile', 'billing', 'analytics');
CREATE TYPE oauth_provider_enum AS ENUM ('google', 'microsoft', 'github', 'linkedin', 'okta', 'auth0', 'custom');
CREATE TYPE activity_action_enum AS ENUM (
    'user_created', 'user_updated', 'user_deleted', 'user_login', 'user_logout',
    'org_created', 'org_updated', 'org_deleted', 'org_joined', 'org_left',
    'role_assigned', 'role_removed', 'permission_granted', 'permission_revoked',
    'sso_login', 'sso_linked', 'sso_unlinked', 'invitation_sent', 'invitation_accepted'
);

-- Users table with partitioning
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_hash VARCHAR(64) GENERATED ALWAYS AS (encode(sha256(lower(email)::bytea), 'hex')) STORED,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(201) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_email_verified BOOLEAN DEFAULT false NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0 NOT NULL,
    auth_method auth_method_enum DEFAULT 'email' NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT password_required_check CHECK (
        (auth_method = 'sso' AND password_hash IS NULL) OR
        (auth_method IN ('email', 'hybrid') AND password_hash IS NOT NULL)
    )
);

-- Create essential indexes immediately
CREATE UNIQUE INDEX idx_users_email_active ON users(email) WHERE is_active = true AND is_deleted = false;
CREATE INDEX idx_users_email_hash ON users USING HASH(email_hash);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    website VARCHAR(255),
    logo_url TEXT,
    industry VARCHAR(100),
    company_size company_size_enum DEFAULT 'startup',
    subscription_plan subscription_plan_enum DEFAULT 'free' NOT NULL,
    subscription_status subscription_status_enum DEFAULT 'active' NOT NULL,
    max_users INTEGER DEFAULT 10 NOT NULL,
    current_user_count INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_organizations_slug_active ON organizations(slug) WHERE is_active = true AND is_deleted = false;

-- Account types
CREATE TABLE account_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    account_type account_type_enum NOT NULL,
    is_primary BOOLEAN DEFAULT true NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT account_type_logic CHECK (
        (account_type = 'individual' AND organization_id IS NULL) OR
        (account_type = 'organization_member' AND organization_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_account_types_user_org ON account_types(user_id, organization_id);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    UNIQUE(name, organization_id),
    UNIQUE(slug, organization_id)
);

-- Permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    category permission_category_enum NOT NULL,
    resource_type VARCHAR(50),
    action VARCHAR(50),
    is_sensitive BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Role permissions
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    UNIQUE(role_id, permission_id)
);

-- User roles
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    UNIQUE(user_id, role_id, organization_id)
);

-- OAuth providers
CREATE TABLE oauth_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name oauth_provider_enum NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret_encrypted BYTEA NOT NULL,
    authorization_url TEXT NOT NULL,
    token_url TEXT NOT NULL,
    user_info_url TEXT NOT NULL,
    scope VARCHAR(500) DEFAULT 'openid email profile',
    is_active BOOLEAN DEFAULT true NOT NULL,
    logo_url TEXT,
    button_color VARCHAR(7) DEFAULT '#4285f4',
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    UNIQUE(name, organization_id)
);

-- User social accounts
CREATE TABLE user_social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES oauth_providers(id) ON DELETE CASCADE,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_name VARCHAR(255),
    provider_avatar_url TEXT,
    is_primary BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    UNIQUE(provider_id, provider_user_id),
    UNIQUE(user_id, provider_id)
);

-- User sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_type VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active) WHERE is_active = true;

-- Activity logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    action activity_action_enum NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_activity_logs_user_action ON activity_logs(user_id, action, created_at DESC);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO permissions (name, slug, description, category, resource_type, action) VALUES
('Create Users', 'create_users', 'Create new user accounts', 'user_management', 'user', 'create'),
('Read Users', 'read_users', 'View user information', 'user_management', 'user', 'read'),
('Update Users', 'update_users', 'Modify user information', 'user_management', 'user', 'update'),
('Delete Users', 'delete_users', 'Delete user accounts', 'user_management', 'user', 'delete'),
('Create Organizations', 'create_organizations', 'Create new organizations', 'organization', 'organization', 'create'),
('Read Organizations', 'read_organizations', 'View organization information', 'organization', 'organization', 'read'),
('Update Organizations', 'update_organizations', 'Modify organization information', 'organization', 'organization', 'update'),
('Update Own Profile', 'update_own_profile', 'Update own user profile', 'profile', 'user', 'update'),
('Read Own Profile', 'read_own_profile', 'View own user profile', 'profile', 'user', 'read');

INSERT INTO roles (name, slug, description, is_system_role) VALUES
('Super Administrator', 'super_admin', 'Full system access', true),
('Organization Administrator', 'org_admin', 'Full access within organization', true),
('Organization User', 'org_user', 'Standard user access within organization', true),
('Individual User', 'individual_user', 'Personal account with full control', true);

-- Assign permissions to roles
DO $$
DECLARE
    super_admin_id UUID;
    org_admin_id UUID;
    org_user_id UUID;
    individual_user_id UUID;
BEGIN
    SELECT id INTO super_admin_id FROM roles WHERE slug = 'super_admin';
    SELECT id INTO org_admin_id FROM roles WHERE slug = 'org_admin';
    SELECT id INTO org_user_id FROM roles WHERE slug = 'org_user';
    SELECT id INTO individual_user_id FROM roles WHERE slug = 'individual_user';

    -- Super Admin gets all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT super_admin_id, id FROM permissions;

    -- Organization Admin permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT org_admin_id, id FROM permissions 
    WHERE slug IN ('read_users', 'update_users', 'read_organizations', 'update_organizations', 'update_own_profile', 'read_own_profile');

    -- Organization User permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT org_user_id, id FROM permissions 
    WHERE slug IN ('update_own_profile', 'read_own_profile');

    -- Individual User permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT individual_user_id, id FROM permissions 
    WHERE slug IN ('update_own_profile', 'read_own_profile');
END $$;

-- Insert Google OAuth provider
INSERT INTO oauth_providers (name, display_name, client_id, client_secret_encrypted, authorization_url, token_url, user_info_url, logo_url, button_color) VALUES
('google', 'Google', 'placeholder-client-id', decode('placeholder-secret', 'base64'), 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', 'https://www.googleapis.com/oauth2/v2/userinfo', 'https://developers.google.com/identity/images/g-logo.png', '#4285f4');

-- Learning-related enums
CREATE TYPE difficulty_enum AS ENUM ('easy', 'medium', 'hard', 'mixed');
CREATE TYPE question_type_enum AS ENUM ('single_choice', 'multiple_choice', 'short_answer');

-- Quiz questions table
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    question_type question_type_enum DEFAULT 'single_choice',
    options JSONB,
    correct_answer INTEGER,
    correct_answers JSONB,
    keywords JSONB,
    max_length INTEGER,
    explanation TEXT,
    difficulty difficulty_enum NOT NULL,
    topic VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- User progress table
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    unlocked_responses INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    message_count INTEGER DEFAULT 0,
    last_quiz_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    UNIQUE(user_id, organization_id)
);

-- Quiz submissions table
CREATE TABLE quiz_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    selected_answer JSONB,
    is_correct BOOLEAN NOT NULL,
    points_earned INTEGER DEFAULT 0,
    time_taken INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Chat sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    learning_gates_enabled BOOLEAN DEFAULT false,
    gate_frequency INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Chat messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for learning tables
CREATE INDEX idx_quiz_questions_topic_difficulty ON quiz_questions(topic, difficulty);
CREATE INDEX idx_quiz_questions_organization ON quiz_questions(organization_id);
CREATE INDEX idx_quiz_questions_active ON quiz_questions(is_active) WHERE is_active = true;

CREATE INDEX idx_user_progress_user_org ON user_progress(user_id, organization_id);
CREATE INDEX idx_user_progress_level ON user_progress(level);

CREATE INDEX idx_quiz_submissions_user_time ON quiz_submissions(user_id, submitted_at DESC);
CREATE INDEX idx_quiz_submissions_question ON quiz_submissions(question_id);
CREATE INDEX idx_quiz_submissions_correct ON quiz_submissions(is_correct);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_token ON chat_sessions(session_token);

CREATE INDEX idx_chat_messages_session_time ON chat_messages(session_id, created_at DESC);
CREATE INDEX idx_chat_messages_type ON chat_messages(message_type);

-- Add triggers for learning tables
CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample quiz questions
INSERT INTO quiz_questions (question, question_type, options, correct_answer, explanation, difficulty, topic) VALUES
('What does the ''const'' keyword do in JavaScript?', 'single_choice', 
 '["Creates a variable that can be reassigned", "Creates a constant that cannot be reassigned", "Creates a global variable", "Creates a function"]',
 1, 'The ''const'' keyword creates a constant that cannot be reassigned after declaration.', 'easy', 'JavaScript'),

('How do you create a list in Python?', 'single_choice',
 '["list = {}", "list = []", "list = ()", "list = \"\""]',
 1, 'Square brackets [] are used to create lists in Python.', 'easy', 'Python'),

('What is TypeScript?', 'short_answer',
 NULL, NULL, 'TypeScript is a superset of JavaScript that adds static typing.', 'medium', 'TypeScript');

-- Update permissions for learning features
INSERT INTO permissions (name, slug, description, category, resource_type, action) VALUES
('Use Learning Gates', 'use_learning_gates', 'Access learning gates feature', 'content', 'learning', 'read'),
('Create Quiz Questions', 'create_quiz_questions', 'Create new quiz questions', 'content', 'quiz_question', 'create'),
('Manage Quiz Questions', 'manage_quiz_questions', 'Manage quiz questions', 'content', 'quiz_question', 'manage'),
('View Learning Analytics', 'view_learning_analytics', 'View learning progress and analytics', 'analytics', 'learning', 'read');

-- Add learning permissions to roles
DO $
DECLARE
    org_admin_id UUID;
    org_user_id UUID;
    individual_user_id UUID;
    perm_id UUID;
BEGIN
    SELECT id INTO org_admin_id FROM roles WHERE slug = 'org_admin';
    SELECT id INTO org_user_id FROM roles WHERE slug = 'org_user';
    SELECT id INTO individual_user_id FROM roles WHERE slug = 'individual_user';

    -- All user types can use learning gates
    FOR perm_id IN SELECT id FROM permissions WHERE slug = 'use_learning_gates' LOOP
        INSERT INTO role_permissions (role_id, permission_id) VALUES
        (org_admin_id, perm_id),
        (org_user_id, perm_id),
        (individual_user_id, perm_id);
    END LOOP;

    -- Only org admins can manage quiz questions
    FOR perm_id IN SELECT id FROM permissions WHERE slug IN ('create_quiz_questions', 'manage_quiz_questions', 'view_learning_analytics') LOOP
        INSERT INTO role_permissions (role_id, permission_id) VALUES (org_admin_id, perm_id);
    END LOOP;
END $;