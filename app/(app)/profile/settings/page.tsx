import Link from 'next/link';
import { poppins } from '@/app/ui/fonts';

export default function ProfileSettingsPage() {
    return (
        <div className="w-full px-6 pt-6 pb-10">
            {/* Back */}
            <div className="max-w-md mx-auto">
                <Link
                    href="/profile"
                    className="inline-flex items-center text-white/60 hover:text-white/80 transition"
                >
                    <span className={`${poppins.className} text-sm`}>← Back</span>
                </Link>
            </div>

            {/* Title */}
            <h1
                className={`${poppins.className}
                    text-[40px]
                    leading-tight
                    tracking-tight
                    font-semibold
                    text-center
                    text-white
                    mt-6
                `}
            >
                Settings
            </h1>

            <div className="mt-10 max-w-md mx-auto space-y-4">
                <div className="rounded-2xl border border-white/35 bg-white/5 backdrop-blur-md px-5 py-4 text-white/70">
                    (coming soon)
                </div>

                <div className="rounded-2xl border border-white/35 bg-white/5 backdrop-blur-md px-5 py-4 text-white/70">
                    (coming soon)
                </div>

                <div className="rounded-2xl border border-white/35 bg-white/5 backdrop-blur-md px-5 py-4 text-white/70">
                    (coming soon)
                </div>

                <div className="rounded-2xl border border-white/35 bg-white/5 backdrop-blur-md px-5 py-4 text-white/70">
                    (coming soon)
                </div>

                <div className="rounded-2xl border border-white/35 bg-white/5 backdrop-blur-md px-5 py-4 text-white/70">
                    (coming soon)
                </div>

                <div className="rounded-2xl border border-white/35 bg-white/5 backdrop-blur-md px-5 py-4 text-white/70">
                    (coming soon)
                </div>

                <div className="rounded-2xl border border-white/35 bg-white/5 backdrop-blur-md px-5 py-4 text-white/70">
                    (coming soon)
                </div>

                <div className="rounded-2xl border border-white/35 bg-white/5 backdrop-blur-md px-5 py-4 text-white/70">
                    (coming soon)
                </div>

                <div className="rounded-2xl border border-white/35 bg-white/5 backdrop-blur-md px-5 py-4 text-white/70">
                    (coming soon)
                </div>

                <div className="rounded-2xl border border-white/35 bg-white/5 backdrop-blur-md px-5 py-4 text-white/70">
                    (coming soon)
                </div>
            </div>
        </div>
    );
}
