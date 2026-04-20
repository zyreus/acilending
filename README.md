# Amalgated Lending - cPanel Deployment Guide

This guide deploys:
- Frontend (React/Vite) to `https://amalgatedlending.com`
- Laravel API (`amalgated-lending-api`) to `https://api.amalgatedlending.com`
- Node chat server (`chat-server`) to `https://chat.amalgatedlending.com`

It matches the current project structure and environment templates in this repository.

## 1) Server Prerequisites (cPanel)

- PHP `8.3+` with required extensions for Laravel (mbstring, openssl, pdo_mysql, tokenizer, xml, ctype, json, fileinfo, bcmath)
- MySQL database + user
- SSH access enabled in cPanel (recommended)
- Composer available on server (or run via full path in SSH)
- Node.js available locally (for frontend build)

## 2) Recommended Hosting Layout

- Main domain (`amalgatedlending.com`) serves the built frontend files from `dist/`
- API subdomain (`api.amalgatedlending.com`) document root points to Laravel `public/`
  - Example API code path: `/home/<cpanel-user>/amalgated-lending/amalgated-lending-api`
  - API subdomain document root: `/home/<cpanel-user>/amalgated-lending/amalgated-lending-api/public`

If your host does not allow subdomain docroot changes, use `.htaccess` rewrite rules to route traffic into the Laravel `public/` folder.

## 3) Frontend Deployment (React/Vite)

From local machine in project root:

```bash
cp .env.production.example .env.production
npm install
npm run build
```

Then:
- Upload contents of `dist/` to your domain web root (usually `public_html/`)
- Do not upload the entire repo into `public_html`; only the built frontend assets

### Frontend Production Env

Set values in `.env.production` before running `npm run build`:

```env
VITE_LENDING_API_URL=https://api.amalgatedlending.com/api/v1
VITE_LENDING_PUBLIC_URL=https://api.amalgatedlending.com
VITE_AMALGATED_HOLDINGS_URL=https://amalgatedholdings.com
```

Optional chat variables:

```env
# VITE_CHAT_SERVER_URL=https://chat.amalgatedlending.com
# VITE_LENDING_ADMIN_API_SECRET=match-chat-server-secret
```

## 4) API Deployment (Laravel)

Upload `amalgated-lending-api` to server outside public web root where possible.

From server SSH inside `amalgated-lending-api`:

```bash
cp .env.example .env
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan storage:link
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 5) API Production `.env` (Important)

In `amalgated-lending-api/.env`, set at minimum:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.amalgatedlending.com
FRONTEND_URL=https://amalgatedlending.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=acilending_cpuser_lending
DB_USERNAME=<cpanel_db_user>
DB_PASSWORD=<cpanel_db_password>

SANCTUM_STATEFUL_DOMAINS=amalgatedlending.com,www.amalgatedlending.com,api.amalgatedlending.com
```

Also configure mail and AWS keys if your flows require them:
- Brevo SMTP/API settings
- AWS Rekognition credentials and region

## 6) Chat Server Deployment (Node)

Upload `chat-server` to the server and run it under cPanel Node.js App (Passenger) or PM2.

Recommended chat `.env` production values:

```env
PORT=8010
CHAT_CORS_ORIGINS=https://amalgatedlending.com,https://www.amalgatedlending.com
TRUST_PROXY=1
JWT_SECRET=<strong-random-secret>
LENDING_ADMIN_API_SECRET=<same-as-frontend-VITE_LENDING_ADMIN_API_SECRET>
```

Optional MySQL backend for chat:

```env
DB_PROVIDER=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=<cpanel_chat_db_name>
MYSQL_USER=<cpanel_chat_db_user>
MYSQL_PASSWORD=<cpanel_chat_db_password>
```

If not using MySQL for chat, default SQLite (`chat.db`) works but make sure the app can write to its folder.

## 7) File Permissions

Ensure these are writable by the web server user:
- `amalgated-lending-api/storage`
- `amalgated-lending-api/bootstrap/cache`

Typical fix from SSH:

```bash
chmod -R 775 storage bootstrap/cache
```

## 8) Database Notes

Your local scripts mention two logical DBs:
- `amalgated_lending_db` (Laravel API)
- `amalgated_lending_chat` (chat server if MySQL-backed)

In production, create required DBs/users from cPanel MySQL tools and update each service `.env`.

## 9) Deployment Checklist

- Frontend build generated with production env
- `dist/` uploaded to `public_html/`
- API code uploaded and `api.amalgatedlending.com` docroot points to Laravel `public/`
- Chat server running and reachable at `chat.amalgatedlending.com`
- API `.env` configured for production
- `php artisan migrate --force` completed successfully
- Laravel caches built (`config`, `route`, `view`)
- HTTPS enabled on all three hosts (main, api, chat)

## 10) Quick Smoke Tests

- Open `https://amalgatedlending.com` and verify frontend loads
- Call one public/expected API endpoint under:
  - `https://api.amalgatedlending.com/api/v1/...`
- Open admin chat area and verify it connects to `https://chat.amalgatedlending.com`
- Test authentication flow (if enabled)
- Test email flow (forgot password / lead email action)
- Verify file uploads and liveness endpoints if AWS is enabled

## 11) Common cPanel Issues

- **500 on API**: check `storage/logs/laravel.log`, verify `.env` values and file permissions
- **404 on API routes**: confirm subdomain docroot points to Laravel `public/`
- **CORS/Sanctum issues**: verify `SANCTUM_STATEFUL_DOMAINS`, `APP_URL`, and `FRONTEND_URL`
- **Chat connection failure**: verify `VITE_CHAT_SERVER_URL`, `CHAT_CORS_ORIGINS`, SSL certificate, and reverse proxy/websocket support
- **Stale config**: rerun `php artisan config:clear` then `php artisan config:cache`
- **Frontend still calling localhost**: rebuild frontend after updating `.env.production`

---

If needed, this can be extended with a zero-downtime release process (versioned folders + symlink switch) for safer updates.
