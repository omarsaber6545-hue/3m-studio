# 3M Studio — Enterprise SaaS Platform

A production-grade, commercial-ready SaaS platform built using **Node.js, Express, EJS, and Prisma (PostgreSQL)**, adhering to Clean Architecture and MVC (Model-View-Controller) design principles.

---

## 📂 Complete Folder Structure

```
3m-studio/
├── public/                     # Static Client Resources
│   └── assets/
│       ├── css/                # Styling guides
│       │   ├── base.css, variables.css, layout.css, components.css, animations.css, utilities.css
│       │   └── themes/ (dark.css, light.css, rtl.css)
│       └── js/                 # Modular client scripts
│           ├── core/           # (router.js, auth.js, theme.js, language.js, storage.js)
│           ├── ui/             # (navbar.js, sidebar.js, modal.js, toast.js, loader.js, search.js)
│           ├── ai/             # (chat.js, image.js, video.js, music.js, voice.js...)
│           └── utils/          # (helpers.js, validator.js, formatter.js)
├── views/                      # EJS Server Views & Layouts
│   ├── layouts/                # Layout containers
│   │   ├── main.ejs
│   │   ├── admin.ejs
│   │   └── auth.ejs
│   ├── partials/               # Shared page partials
│   │   ├── navbar.ejs, footer.ejs, sidebar.ejs, search-modal.ejs, loader.ejs, toast.ejs, breadcrumbs.ejs...
│   └── pages/                  # EJS page templates
│       ├── home/, about/, pricing/, contact/, dashboard/, settings/...
│       ├── ai/                 # Standalone AI Tools EJS templates
│       │   ├── chat/index.ejs
│       │   ├── image-generator/index.ejs
│       │   └── ... (other AI tools)
│       └── admin/              # Standalone Admin console templates
│           ├── login/index.ejs
│           ├── dashboard/index.ejs
│           └── ... (other admin pages)
├── src/                        # Backend MVC Layer
│   ├── server.js               # Express server entry bootstrap
│   ├── config/                 # DB, Logger, Passport & Mail configurations
│   ├── controllers/            # Controller layer
│   │   ├── ai/ (chat.controller.js, image.controller.js...)
│   │   ├── admin/ (users.controller.js, analytics.controller.js...)
│   │   └── (auth.controller.js, home.controller.js...)
│   ├── middleware/             # Security middlewares & file uploads logic
│   ├── routes/                 # Express API routes
│   └── services/               # Integrations & utility modules
│       ├── ai/ (provider.js, gemini.js, openai.js, claude.js...)
│       └── (discord.service.js, mail.service.js, payment.service.js...)
├── prisma/
│   └── schema.prisma           # Database Schema mappings
├── logs/                       # Rotating access, error, and system logs
├── uploads/                    # Local storage upload directories
└── Dockerfile, docker-compose.yml, .github/workflows/ci.yml
```

---

## ⚙️ Environment Variables Guide

Copy `.env.example` to `.env` and configure the following parameters:

```bash
# Server Port
PORT=5000
NODE_ENV=development

# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/three_m_studio_db?schema=public"

# Authentication Secrets
JWT_SECRET="generate_a_random_32_character_string_for_access_signing"
JWT_REFRESH_SECRET="generate_a_random_32_character_string_for_refresh_signing"
SESSION_SECRET="session_secret_cookie_holder_3m_studio"

# Discord OAuth2 credentials
DISCORD_CLIENT_ID="your_discord_application_client_id"
DISCORD_CLIENT_SECRET="your_discord_application_client_secret"
DISCORD_CALLBACK_URL="http://localhost:5000/api/v1/auth/discord/callback"

# Mail Config
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="smtp_user"
SMTP_PASS="smtp_pass"
EMAIL_FROM="no-reply@3mstudio.design"
```

---

## 🛠️ Installation & Setup Guide

1. **Clone & Install Dependencies:**
   ```bash
   npm install
   ```

2. **Setup Database Models & Seed:**
   Ensure a PostgreSQL database instance is running. Run migrations and database schema generation commands:
   ```bash
   # Run Prisma Schema compiler
   npx prisma generate
   # Push schema changes to database
   npx prisma db push
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## 🗺️ Developer Architecture & API Guide

- **API versioning:** All REST API endpoints must be prefixed under `/api/v1/`.
- **Health Checks:** Use `/api/health`, `/api/status`, and `/api/version` to monitor system runtime status.
- **Structured Logs:** Morgan logs all incoming server requests into `/logs/access-%DATE%.log`. winston logs all server application warnings and compile errors into `/logs/system-%DATE%.log` and `/logs/error-%DATE%.log`.
