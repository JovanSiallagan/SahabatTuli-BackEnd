import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from '../config/prisma';

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [
        "https://api.sahabattuli.com",
        "http://localhost:*",
    ],
    advanced: {
        defaultCookieAttributes: {
            sameSite: "none",
            secure: true,
        },
    },
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    emailAndPassword: {
        enabled: true,
        async sendResetPassword({ user, url }) {
            // TODO: Sambungkan ke Nodemailer / Resend untuk kirim email sungguhan
            console.log(`[BetterAuth] Reset password link untuk ${user.email}: ${url}`);
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        },
    },
});