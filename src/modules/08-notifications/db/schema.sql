-- =============================================================
-- C3L Module 8: Notifications & Messaging - Database Schema
-- Target: SQLite
-- =============================================================

-- SQLite ignores foreign keys unless this is on (run per connection)
PRAGMA foreign_keys = ON;


-- -------------------------------------------------------------
-- NOTIFICATIONS SIDE
-- -------------------------------------------------------------

-- The categories users can mute
CREATE TABLE IF NOT EXISTS notification_categories (
  category  VARCHAR(50) PRIMARY KEY
);

INSERT OR IGNORE INTO notification_categories (category) VALUES
  ('grade'), ('quiz'), ('discussion'), ('assignment'), ('announcement'), ('content');


-- The notification itself, stored once
CREATE TABLE IF NOT EXISTS notifications (
  notification_id  VARCHAR(36)  PRIMARY KEY,                -- UUID
  event_type       VARCHAR(50)  NOT NULL
                   REFERENCES notification_categories(category),
  course_id        VARCHAR(50),                             -- NULL = not tied to a course (always delivered)
  subject          VARCHAR(50)  NOT NULL CHECK (length(subject) <= 50),
  message          VARCHAR(280) NOT NULL CHECK (length(message) <= 280),
  created_at       DATETIME     NOT NULL
);


-- One row per user who received a notification
CREATE TABLE IF NOT EXISTS notification_recipients (
  notification_id  VARCHAR(36) NOT NULL
                   REFERENCES notifications(notification_id) ON DELETE CASCADE,
  user_id          VARCHAR(50) NOT NULL,                    -- Group 1's user ID (no FK: different database)
  read_at          DATETIME,                                -- NULL = unread
  PRIMARY KEY (notification_id, user_id)
);

-- Fast lookup for a user's bell / unread count
CREATE INDEX IF NOT EXISTS idx_recipients_user_read ON notification_recipients (user_id, read_at);


-- Opt-out list: a row means this user muted this category in this course
-- No row = user receives it (default)
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id    VARCHAR(50) NOT NULL,                          -- Group 1's user ID (no FK)
  course_id  VARCHAR(50) NOT NULL,                          -- Courses module's ID (no FK)
  category   VARCHAR(50) NOT NULL
             REFERENCES notification_categories(category),
  muted_at   DATETIME    NOT NULL,
  PRIMARY KEY (user_id, course_id, category)
);


-- -------------------------------------------------------------
-- MESSAGING SIDE
-- -------------------------------------------------------------

-- One row per chat, whether 1:1 or group
CREATE TABLE IF NOT EXISTS conversations (
  id          VARCHAR(36) PRIMARY KEY,                      -- UUID
  name        VARCHAR(50),                                  -- group name; NULL for 1:1
  direct_key  VARCHAR(101) UNIQUE,                          -- 1:1 only, e.g. 'user_12|user_3'; prevents duplicate chats
  created_by  VARCHAR(50) NOT NULL,                         -- Group 1's user ID (no FK)
  created_at  DATETIME    NOT NULL
  -- direct chats must have a direct_key; group chats must not
);


-- Who is in each chat
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id  VARCHAR(36) NOT NULL
                   REFERENCES conversations(id) ON DELETE CASCADE,
  user_id          VARCHAR(50) NOT NULL,                    -- Group 1's user ID (no FK)
  joined_at        DATETIME    NOT NULL,
  last_read_at     DATETIME,                                -- NULL = never opened the chat
  left_at          DATETIME,                                -- NULL = still in the chat
  PRIMARY KEY (conversation_id, user_id)
);

-- Fast lookup for "which chats is this user in"
CREATE INDEX IF NOT EXISTS idx_members_user ON conversation_members (user_id);


-- The messages themselves
CREATE TABLE IF NOT EXISTS messages (
  id               VARCHAR(36)  PRIMARY KEY,                -- UUID
  conversation_id  VARCHAR(36)  NOT NULL
                   REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        VARCHAR(50)  NOT NULL,                   -- Group 1's user ID (no FK)
  body             VARCHAR(280) NOT NULL CHECK (length(body) <= 280),
  created_at       DATETIME     NOT NULL
);

-- Fast loading of chat history in order
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time ON messages (conversation_id, created_at);