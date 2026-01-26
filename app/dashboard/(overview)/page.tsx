import { poppins } from '@/app/ui/fonts';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard',
};

export default async function Page() {
    return (
        <main>
            <h1 className={`${poppins.className} mb-4 text-xl md:text-2xl`}>
                Dashboard
            </h1>
        </main>
    );
}