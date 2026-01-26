import LoginForm from '@/app/ui/login-form';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { poppins } from '@/app/ui/fonts';

export const metadata: Metadata = {
    title: 'Login',
};

export default function LoginPage() {
    return (
        <main className="flex items-center justify-center md:h-screen">
            <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">

                <Suspense>
                    <LoginForm />
                </Suspense>
            </div>
        </main>
    );
}