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
        <div className="relative h-full overflow-hidden">
            {/* Scrollable content inside phone shell */}
            <main className="h-full overflow-y-auto no-scrollbar pb-[120px]">
                {children}
            </main>

            {/* Bottom nav FLOATS INSIDE the phone shell */}
            <div className="absolute inset-x-0 bottom-0 z-50 flex justify-center pb-4 pointer-events-none">
                <div className="w-full pointer-events-auto">
                    <BottomNav />
                </div>
            </div>
        </div>
    );
}
