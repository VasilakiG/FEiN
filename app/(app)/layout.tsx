import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect('/login?callbackUrl=/home');
    }

    return (
        <div className="flex-1 flex flex-col">
            {children}
        </div>
        /* bottom nav goes here later */
    );
}
