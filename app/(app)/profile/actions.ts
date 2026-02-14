'use server';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import bcrypt from 'bcrypt';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

type ActionResult = string | undefined; // string = error message, undefined = success

export async function updateProfile(
    _prevState: ActionResult,
    formData: FormData
): Promise<ActionResult> {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const userId = Number(session.user.id);
    if (!Number.isInteger(userId)) {
        return 'Invalid session. Please log in again.';
    }
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();

    if (!name) {
        return 'Name is required.';
    }
    if (!email || !email.includes('@')) {
        return 'Please enter a valid email.';
    }

    // Email already exists check
    const existing = await sql`
        SELECT user_id FROM "user"
        WHERE email = ${email} AND user_id != ${userId}
    `;
    if (existing.length > 0) {
        return 'Email already exists.';
    }

    await sql`
        UPDATE "user"
        SET user_name = ${name},
            email = ${email}
        WHERE user_id = ${userId}
    `;

    redirect('/profile');
}

export async function updatePassword(
    _prevState: ActionResult,
    formData: FormData
): Promise<ActionResult> {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }

    const userId = Number(session.user.id);
    if (!Number.isInteger(userId)) {
        return 'Invalid session. Please log in again.';
    }
    const currentPassword = String(formData.get('currentPassword') ?? '');
    const newPassword = String(formData.get('newPassword') ?? '');

    if (newPassword.length < 6) {
        return 'New password must be at least 6 characters.';
    }

    const users = await sql`
        SELECT password
        FROM "user"
        WHERE user_id = ${userId}
    `;
    const user = users[0];
    if (!user) {
        return 'User not found. Please log in again.';
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
        return 'Current password is incorrect.';
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await sql`
        UPDATE "user"
        SET password = ${hashed}
        WHERE user_id = ${userId}
    `;

    redirect('/profile');
}
