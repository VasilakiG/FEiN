import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

type AuthenticatedSession = Session & {
    user: {
        id: string;
        name: string;
        email: string;
    };
};

export async function requireAuth(): Promise<AuthenticatedSession> {
    const session = await auth();

    if (!session || !session.user) {
        redirect('/login');
    }

    return session as AuthenticatedSession;
}
