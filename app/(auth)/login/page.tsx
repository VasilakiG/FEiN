import LoginForm from '@/app/ui/login-form';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { poppins } from '@/app/ui/fonts';

export const metadata: Metadata = {
    title: 'Login',
};

export default function LoginPage() {
    return (
        <>
            <main
                className="
                    flex-1
                    flex
                    flex-col
                    items-center
                    justify-center 
                    md:justify-center
                    px-4
                    mt-[-80]
                "
            >
                <h1
                    className={`${poppins.className} 
                        text-[40px] 
                        leading-tight
                        tracking-tight
                        font-semibold 
                        text-center 
                        text-white 
                        antialiased
                    `}
                >
                    Welcome to<br />
                    FEiN
                </h1>

                <Suspense>
                    <LoginForm />
                </Suspense>
            </main>
        </>
    );
}