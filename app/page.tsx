import Link from 'next/link';
import { poppins } from '@/app/ui/fonts';

export default function Page() {
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
                    bg-fein-login
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
                        mb-10 
                        text-white 
                        antialiased
                    `}
        >
          Welcome to<br />
          FEiN
        </h1>

        <Link
          href="/login"
          className="flex items-center gap-5 rounded-lg bg-blue-500 px-6 py-3 mb-10 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
        >
          <span>Log in</span>
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-5 rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-400 md:text-base"
        >
          <span>Register</span>
        </Link>

      </main>
    </>
  );
}
