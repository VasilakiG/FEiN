import { poppins } from '@/app/ui/fonts';

export default function Page() {
    return (
        <div className="w-full px-6 pt-10 pb-10">
            <h1
                className={`${poppins.className}
                    text-[40px]
                    leading-tight
                    tracking-tight
                    font-semibold
                    text-center
                    text-white
                `}
            >
                Welcome to<br />
                FEiN
            </h1>

            {/* Add real home content below later */}
            <div className="mt-10 space-y-4">
                <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-white/80">
                    Home content placeholder
                </div>
            </div>
        </div>
    );
}
