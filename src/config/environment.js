const dotenv = require('dotenv');
const { z } = require('zod');

// Load environment variables
dotenv.config();

// Define validation schema for environment variables
const envSchema = z.object({
    PORT: z.string().transform(Number).default('5000'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z.string().min(8, "JWT_SECRET must be at least 8 characters"),
    JWT_REFRESH_SECRET: z.string().min(8, "JWT_REFRESH_SECRET must be at least 8 characters"),
    DISCORD_CLIENT_ID: z.string().default('mock_id'),
    DISCORD_CLIENT_SECRET: z.string().default('mock_secret'),
    DISCORD_CALLBACK_URL: z.string().default('http://localhost:5000/api/v1/auth/discord/callback'),
    SMTP_HOST: z.string().default('smtp.mailtrap.io'),
    SMTP_PORT: z.string().transform(Number).default('2525'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().default('no-reply@3mstudio.design'),
    SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters").default('session_secret_cookie_holder_3m_studio')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Environment configuration error:', parsed.error.format());
    process.exit(1);
}

module.exports = parsed.data;
