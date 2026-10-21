// Every table, as SQL that is safe to run again and again. The API runs it once per process,
// just before its first query (db/pool.js), so a deploy that adds tables needs no manual step.
// `npm run db:setup` runs it by hand and also creates the database itself.
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id              CHAR(36)     NOT NULL PRIMARY KEY,
  email           VARCHAR(254) NOT NULL UNIQUE,
  name            VARCHAR(120) NOT NULL,
  picture         VARCHAR(500) NULL,
  password_hash   VARCHAR(200) NULL,          -- NULL for Google-only accounts
  google_sub      VARCHAR(64)  NULL UNIQUE,   -- Google's stable account id
  username        VARCHAR(30)  NULL UNIQUE,   -- bookshelf.cv/<username>, claimed after sign-up
  session_version INT          NOT NULL DEFAULT 0, -- bumped on password reset to sign out other devices
  failed_logins   INT          NOT NULL DEFAULT 0,
  locked_until    DATETIME     NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shelves (
  user_id             CHAR(36)    NOT NULL PRIMARY KEY,
  theme_id            VARCHAR(40) NOT NULL DEFAULT 'light-grid',
  purchased_theme_ids JSON        NOT NULL,
  books               JSON        NOT NULL,
  updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT shelves_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,   -- sha256 of the emailed token; the token itself is never stored
  user_id    CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME NULL,
  CONSTRAINT password_resets_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id           VARCHAR(64)  NOT NULL PRIMARY KEY,
  user_id      CHAR(36)     NOT NULL,
  theme_id     VARCHAR(40)  NOT NULL,
  amount       INT          NOT NULL,
  currency     VARCHAR(10)  NOT NULL DEFAULT 'INR',
  status       VARCHAR(20)  NOT NULL DEFAULT 'created',
  payment_id   VARCHAR(64)  NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- The Goodreads profile a reader imported, so new books on it can sync in later.
CREATE TABLE IF NOT EXISTS goodreads_links (
  user_id       CHAR(36)    NOT NULL PRIMARY KEY,
  goodreads_id  VARCHAR(12) NOT NULL,   -- Goodreads' numeric user id
  seen_book_ids JSON        NOT NULL,   -- Goodreads books already offered once, so a book the reader removes stays removed
  synced_at     DATETIME    NOT NULL,   -- last time Goodreads was read
  CONSTRAINT goodreads_links_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- One review per reader, asked for once their shelf is made. Sending again replaces it.
CREATE TABLE IF NOT EXISTS reviews (
  user_id    CHAR(36)      NOT NULL PRIMARY KEY,
  rating     TINYINT       NOT NULL,           -- 1 to 5 stars
  body       VARCHAR(1000) NOT NULL DEFAULT '',
  updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Prices of the premium looks, set in the admin panel. Free looks have no row.
CREATE TABLE IF NOT EXISTS theme_prices (
  theme_id   VARCHAR(40) NOT NULL PRIMARY KEY,
  inr        INT         NOT NULL,   -- charged at checkout, before 18% GST
  usd        INT         NOT NULL,   -- shown on the theme card's badge
  updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT IGNORE INTO theme_prices (theme_id, inr, usd) VALUES ('digital-shelf', 749, 9), ('spine-shelf', 1249, 15), ('macos', 1749, 21);

-- The landing page's two forms: an email or handle for news of new themes, or a question.
CREATE TABLE IF NOT EXISTS messages (
  id         BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
  kind       VARCHAR(20)   NOT NULL,   -- 'updates' or 'question'
  body       VARCHAR(1000) NOT NULL,
  email      VARCHAR(254)  NULL,
  user_id    CHAR(36)      NULL,       -- the signed-in reader who sent it, if any
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT messages_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
`;
