import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import BottomNav from '@/app/ui/bottom-nav';

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
        <div className="flex-1 flex flex-col h-full">
            <main className="flex-1 flex flex-col pb-24">
                {children}
            </main>

            {/* Fixed bottom navigation */}
            <BottomNav />
        </div>
    );
}
