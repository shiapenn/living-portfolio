# Start-Here Onboarding Runbook and Deployment Checklist

| Field | Value |
| --- | --- |
| Document ID | L016 |
| Date | 2026-11-08 |
| Author | A (Implementer) |
| Status | active |
| Scope | First-run onboarding runbook, prerequisites, path selection, and deployment truth (§13, §15, UX-32, 20261106-UX-48) |

---

## 1. Pre-Flight Check & Choosing Your Path

Before starting, check whether Docker is installed and running on your machine:

- **Estimated Time:** Untimed estimate of < 15 min (not verified on a timed run; setup duration depends on network and host environment).
- **Outcome:** A running web app on port 4000 serving your personal timeline and knowledge base, with a secured owner admin workspace protected by password and TOTP two-factor authentication.

```bash
docker --version
```

- **If `docker --version` succeeds**: Follow **Path A (Docker Compose Stack)**. This provides persistent storage with PostgreSQL and pgvector and is the recommended path for ongoing use.
- **If `docker` is not found or fails**: Follow **Path B (Local Node.js Ephemeral Trial Mode)**. This requires only Node.js and pnpm and runs an in-memory database.

> [!WARNING]
> **Data Persistence Notice for Path B:** Path B runs an in-memory database (`InMemoryPortfolioRepository`). **All accounts, credentials, and entries are lost on restart.** Path B is designed purely for quick ephemeral trial and evaluation without container tools. To keep your data across restarts, install Docker and use Path A, or configure an external PostgreSQL database via `DATABASE_URL`.

---

## 2. Prerequisites Checklist & Remediation

Ensure your machine has the required tools installed before proceeding:

1. **Node.js:** v22.x or higher (`node -v`).
   - *Remediation if missing or too old:* Install Node.js v22+ via [nodejs.org](https://nodejs.org/) or your version manager (e.g., `nvm install 22 && nvm use 22` or `fnm install 22`).
2. **pnpm:** v10.x or higher (`pnpm -v`).
   - *Remediation if missing:* Enable Corepack via `corepack enable` or install pnpm globally via `npm install -g pnpm`.
3. **Docker & Docker Compose (for Path A):** Required if running the persistent PostgreSQL container stack (`docker --version` and `docker compose version`).
   - *Remediation if missing:* Install Docker Desktop or Docker Engine, or choose **Path B** to run without Docker.
4. **Authenticator App:** An RFC 6238 TOTP-compatible app on your phone or workstation (e.g., Google Authenticator, 1Password, Bitwarden, Apple Keychain, Aegis).
   - *Remediation if missing:* Install any TOTP authenticator app on your phone or desktop.

---

## 3. What You Will Need to Hand

Have the following ready before starting the setup wizard:

1. **Owner Credentials:** A planned master administrator username and a strong passphrase (at least 12 characters).
2. **Authenticator App:** Ready to scan an SVG QR code or import an `otpauth://` seed URI.
3. **Emergency Recovery Storage:** A password manager or secure notes app to paste and save 8 single-use emergency recovery codes (each code is 16 hex characters formatted as `xxxx-xxxx-xxxx-xxxx`, matching the downloaded `.txt` file).
4. **(Optional) AI Provider API Key:** If configuring external models later in **Settings > Providers** (WP-17.2). During initial setup, model configuration is read-only.

---

## 4. Step-by-Step Walkthrough

### Step 1: Clone the Repository & Install Dependencies

```bash
git clone https://github.com/shiapenn/living-portfolio.git
cd living-portfolio
pnpm install
pnpm build

# First-time installation only: prepare local data and backup directories.
# Note: On a fresh clone, ./data does not exist yet; creating it ensures proper write permissions.
# If ./data is already missing, nothing is wrong. Do not run rm -rf on an existing deployment!
mkdir -p ./data/backups
```

---

### Step 2: Configure Environment

Copy the default environment configuration:

```bash
cp .env.example .env
```

The file `.env.example` defines `PORT=4000` and `ENABLE_BUNDLED_WEB=true`. In bundled web mode, the server serves both the HTTP API and the browser web application on a single port.

---

### Step 3: Launch the Runtime

Choose either Path A or Path B based on your pre-flight check:

#### Path A: Docker Compose Stack (Persistent PostgreSQL Stack)

```bash
docker compose -f docker/docker-compose.hobbyist.yml up -d
```

Verify that the runtime is healthy via the `/healthz` probe:

```bash
curl http://localhost:4000/healthz
# Returns HTTP 200 with JSON payload containing:
# {"status":"healthy","version":"0.1.0","database":"connected",...}
```

#### Path B: Local Node.js Ephemeral Trial Mode (In-Memory, Port 4000)

> [!CAUTION]
> **Warning: All owner credentials and data are lost on restart.** Path B uses `InMemoryPortfolioRepository` and memory-only session storage. It is strictly an ephemeral trial mode. To keep data permanently, move to Path A Docker Stack or configure an external PostgreSQL `DATABASE_URL`.

Because the Node.js development server does not automatically load `.env` into `process.env`, specify the environment variables inline:

```bash
PORT=4000 ENABLE_BUNDLED_WEB=true pnpm --filter @living-portfolio/api dev
```

During startup in Path B, the server outputs:
```
[DEPRECATION] InMemoryPortfolioRepository is deprecated for production deployments (§13.10, Fix 7, P1). Configure DATABASE_URL to use PostgresPortfolioRepository or DualWritePortfolioRepository.
Starting The Living Portfolio Server (Web + Admin + API [bundled]) on port 4000...
✓ Living Portfolio listening on http://localhost:4000
```

Verify that the runtime is healthy:

```bash
curl http://localhost:4000/healthz
# Returns HTTP 200 with JSON payload containing:
# {"status":"healthy","version":"0.1.0","database":"connected","databaseKind":"in-memory",...}
```

---

### Step 4: Open the Setup Wizard

Open your browser to:
**`http://localhost:4000/admin/setup`**

*(Note: Visiting `http://localhost:4000/admin` before setup is complete automatically redirects to `/admin/setup`.)*

---

### Step 5: Complete the 6-Step Setup Wizard

Follow each wizard step sequentially:

1. **Step 1: Owner Account Setup**
   - Enter your chosen administrator username and strong password (min 12 characters).
   - Click **Create account**.
   - Scan the SVG QR code in your authenticator app (or copy the base32 key).
   - Enter the current 6-digit verification code into the code input.
   - Click **Verify Code & Complete Setup**.
   - Your 8 emergency recovery codes will be displayed (16 hex characters each, formatted as `xxxx-xxxx-xxxx-xxxx`).
   - Click **Copy All** or **Download (.txt)** and save them securely.
   - Check the acknowledgement checkbox: *"I have safely downloaded or copied these recovery codes"*.
   - Click **Continue to Step 2: Hosting Option & Presets →**.

2. **Step 2: Hosting Option & Presets**
   - Choose your hosting topology preset:
     - Home server or small VPS (Recommended)
     - Fully private
     - Small server plus paid AI
   - Enter your public web address (e.g. `https://portfolio.example.org`) or leave blank for local evaluation.
   - Click **Next: Model Providers →**.

3. **Step 3: Model Providers & Privacy Boundary**
   - Review configured model providers and data privacy classification rules.
   - *Note: This step is read-only during initial setup.* The screen displays: *"Keys are added later in Settings > Providers; until then Ask shows direct quotes from entries."* External API keys are added post-setup in **Settings > Providers** (WP-17.2). Until external keys are configured, Ask queries show direct extractive quotes from your indexed entries.
   - Click **Next: Alerts & Notifications →**.

4. **Step 4: Notifications & Alerts**
   - Review notification delivery channels (ntfy, Email, Webhook, Telegram).
   - *Note on notification test:* The test button is disabled during setup with the notice: *"Test alerts aren't available in this version yet."* Alerts can be tested and tuned after setup in Settings.
   - Click **Next: Encrypted Backups →**.

5. **Step 5: Encrypted Backup Destination**
   - Configure local backup folder (default `./data/backups`) and optional `age` recipient public key (`age1...`).
   - Click **Run Restore Verification Drill** to verify backup integrity if desired.
   - Click **Next: Theme & Walkthrough →**.

6. **Step 6: Theme & First-Run Walkthrough**
   - Select your preferred typographic theme (Editorial Classic, Modern Monospace, or Minimalist Sans).
   - *Note on theme application:* The notice on this screen explains: *"Your choice is saved. It isn't applied to your public site yet. You'll be able to apply it in Theme."* (Live public site theming is activated in Theme settings in WP-17.8/WP-20.1).
   - Review the worked example case study structure.
   - Click **Go to your dashboard →** to finalize setup and enter your admin workspace.

---

### Step 6: Verify Sign-Out and Login

To verify your credentials and session management:

1. In the admin workspace, click **Sign out** in the navigation bar.
2. You are redirected to **`http://localhost:4000/admin/login`**.
3. Sign in with your username, master password, and current 6-digit TOTP code.
4. *(Emergency recovery verification)*: If you do not have your authenticator device, click the link:
   **`Lost your authenticator device? Sign in with a recovery code`**
   and enter one of your 16-character recovery codes (`xxxx-xxxx-xxxx-xxxx`). Each recovery code burns after a single use.

---

## 5. Troubleshooting & Deployment Truth

- **Docker not found (`command not found: docker`):**
  If `docker` or `docker compose` is not installed on your system, do not run Path A. Run **Path B (Local Node.js Ephemeral Trial Mode)** instead, or install Docker Desktop from [docker.com](https://www.docker.com/).
- **Port 4000 already in use (`EADDRINUSE: address already in use :::4000`):**
  Another process is listening on port 4000. Identify and stop the conflicting process with:
  ```bash
  lsof -i :4000
  ```
  Or change the port by setting `PORT=4001` (or another port) in your command:
  ```bash
  PORT=4001 ENABLE_BUNDLED_WEB=true pnpm --filter @living-portfolio/api dev
  ```
- **Node.js or pnpm not found or too old:**
  Ensure Node.js is version 22 or higher (`node -v`). If Node.js is missing or v20 or older, install Node.js v22 via [nodejs.org](https://nodejs.org/) or `nvm install 22`. If `pnpm` is missing, run `corepack enable` or `npm install -g pnpm`.
- **Backup folder permission errors / cannot write to backup directory:**
  Ensure the backup directory `./data/backups` exists and is writable:
  ```bash
  mkdir -p ./data/backups && chmod 755 ./data/backups
  ```
- **Port Truth:** The application default port is **`4000`** (not `3000`). If configuring reverse proxies (Caddy, Nginx, Cloudflare Tunnels), forward traffic to port `4000`.
- **Admin Guarding:** Any direct browser navigation to `/admin`, `/admin/settings`, or `/admin/import` without an active authenticated session automatically redirects to `/admin/login` (or `/admin/setup` if the owner account is not yet initialized).
- **Bundled Web Mode:** If deploying API and frontend as a single service, ensure `ENABLE_BUNDLED_WEB=true` is present in your environment.
