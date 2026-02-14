'use server';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import bcrypt from 'bcrypt';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    await sql`
        UPDATE "user"
        SET user_name = ${name},
            email = ${email}
        WHERE user_id = ${session.user.id}
    `;

    redirect('/profile');
}

export async function updatePassword(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    const users = await sql`
        SELECT password
        FROM "user"
        WHERE user_id = ${session.user.id}
    `;

    const user = users[0];
    if (!user) redirect('/login');

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
        throw new Error('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await sql`
        UPDATE "user"
        SET password = ${hashed}
        WHERE user_id = ${session.user.id}
    `;

    redirect('/profile');
}
