import Link from 'next/link';
import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { poppins } from '@/app/ui/fonts';

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const name = session.user.name ?? 'Account name';
    const email = session.user.email ?? 'account email';

    return (
        <div className="w-full px-6 pt-6 pb-10">
            {/* Top title */}
            <h1
                className={`${poppins.className}
                    text-[40px]
                    font-semibold
                    text-center
                    text-white/90
                    mt-2
                `}
            >
                Profile
            </h1>

            {/* Center identity */}
            <div className="mt-24 text-center">
                <div
                    className={`${poppins.className}
                        text-[52px]
                        leading-[1.05]
                        font-semibold
                        text-white
                        tracking-tight
                    `}
                >
                    {name}
                </div>

                <div className="mt-6 text-white/45 text-lg">
                    {email}
                </div>
            </div>

            {/* Action list */}
            <div className="mt-24 space-y-4 max-w-md mx-auto">
                <Link
                    href="/profile/edit"
                    className="
                        flex items-center justify-between
                        h-14
                        rounded-2xl
                        border border-white/35
                        bg-white/5
                        px-5
                        text-white/55
                        backdrop-blur-md
                        transition
                        hover:bg-white/10
                    "
                >
                    <span className={`${poppins.className} text-base`}>Edit Profile</span>
                    <ChevronRightIcon className="h-5 w-5 text-white/35" />
                </Link>

                <Link
                    href="/profile/settings"
                    className="
                        flex items-center justify-between
                        h-14
                        rounded-2xl
                        border border-white/35
                        bg-white/5
                        px-5
                        text-white/55
                        backdrop-blur-md
                        transition
                        hover:bg-white/10
                    "
                >
                    <span className={`${poppins.className} text-base`}>Settings</span>
                    <ChevronRightIcon className="h-5 w-5 text-white/35" />
                </Link>

                <form
                    action={async () => {
                        'use server';
                        await signOut({ redirectTo: '/login' });
                    }}
                >
                    <button
                        type="submit"
                        className="
                            w-full
                            flex items-center justify-between
                            h-14
                            rounded-2xl
                            border border-white/35
                            bg-white/5
                            px-5
                            backdrop-blur-md
                            transition
                            hover:bg-white/10
                        "
                    >
                        <span className={`${poppins.className} text-base text-red-300`}>
                            Sign Out
                        </span>
                        {/* no chevron in the screenshot, but if you want it remove the next line */}
                        <span className="w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
