-- phpMyAdmin (XAMPP MySQL): open SQL tab, paste, Go.
-- Or: mysql -u root -p < scripts/xampp-databases.sql
--
-- Amalgated Lending uses two logical databases (both separate from Amalgated Holdings):
--   amalgated_lending_db   — PHP Laravel API (amalgated-lending-api/.env DB_DATABASE)
--   amalgated_lending_chat — Node chat/CRM when DB_PROVIDER=mysql (chat-server/.env MYSQL_DATABASE)
--
-- Amalgated Holdings corporate site uses: amalgated_holdings (see Amalgated_Holdings project).

CREATE DATABASE IF NOT EXISTS `amalgated_lending_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `amalgated_lending_chat`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
