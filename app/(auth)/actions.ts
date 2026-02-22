'use server'

import { z } from 'zod';
import { sql } from '@/app/lib/db';
import { signIn } from '@/auth';
import bcrypt from "bcryptjs";
import { AuthError } from 'next-auth';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        const redirectTo =
            (formData.get('redirectTo') as string)?.startsWith('/')
                ? (formData.get('redirectTo') as string)
                : '/dashboard';

        await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirectTo,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid email or password.';
                default:
                    return 'Something went wrong. Please try again.';
            }
        }
        throw error;
    }
}

export async function register(
    prevState: string | undefined,
    formData: FormData,
) {
    const schema = z.object({
        user_name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        redirectTo: z.string().optional(),
    });

    const parsed = schema.safeParse({
        user_name: formData.get('user_name'),
        email: formData.get('email'),
        password: formData.get('password'),
        redirectTo: formData.get('redirectTo'),
    });

    if (!parsed.success) {
        return 'Invalid form data.';
    }

    const { user_name, email, password, redirectTo } = parsed.data;

    // sanitize redirect
    const safeRedirect =
        redirectTo?.startsWith('/') ? redirectTo : '/dashboard';

    const existing =
        await sql`SELECT user_id FROM "user" WHERE email=${email}`;

    if (existing.length > 0) {
        return 'User already exists.';
    }

    const hashed = await bcrypt.hash(password, 10);

    try {
        await sql`
            INSERT INTO "user" (user_name, email, password)
            VALUES (${user_name}, ${email}, ${hashed})
        `;
    } catch {
        return 'Failed to create user.';
    }

    try {
        await signIn('credentials', {
            email,
            password,
            redirectTo: safeRedirect,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return 'Account created, but auto-login failed. Please log in.';
        }
        throw error;
    }
}
