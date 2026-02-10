import RegisterForm from '@/app/ui/register-form';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { poppins } from '@/app/ui/fonts';

export const metadata: Metadata = {
    title: 'Register',
};

export default function RegisterPage() {
    return (
        <main
            className="
        flex-1
        flex
        flex-col
        items-center
        justify-center
        px-4
        mt-[-80px]
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
                Create an<br />
                account
            </h1>

            <Suspense>
                <RegisterForm />
            </Suspense>
        </main>
    );
}
