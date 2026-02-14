'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    ClockIcon,
    ChartBarIcon,
    UserIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';

const TABS = [
    { href: '/home', icon: HomeIcon },
    { href: '/history', icon: ClockIcon },
    { href: '/analytics', icon: ChartBarIcon },
    { href: '/profile', icon: UserIcon },
];

export default function BottomNav() {
    const pathname = usePathname();

    const isAddPage = pathname.startsWith('/add');

    return (
        <div className="relative">
            {/* Floating bar */}
            <nav
                className="
                    pointer-events-auto
                    pb-safe
                    mx-4
                    mb-0
                    h-14
                    rounded-2xl
                    bg-black/40
                    backdrop-blur-md
                    shadow-lg
                    border
                    border-white/10
                    flex
                    items-center
                    justify-center
                    px-6
                    gap-11
                "
            >
                {/* Left tabs */}
                <div className="flex gap-11">
                    {TABS.slice(0, 2).map(({ href, icon: Icon }) => {
                        const active = pathname.startsWith(href);
                        return (
                            <Link key={href} href={href}>
                                <Icon
                                    className={`h-6 w-6 ${active ? 'text-blue-500' : 'text-white/60'
                                        }`}
                                />
                            </Link>
                        );
                    })}
                </div>

                {/* Spacer for center button */}
                <div className="w-12" />

                {/* Right tabs */}
                <div className="flex gap-11">
                    {TABS.slice(2).map(({ href, icon: Icon }) => {
                        const active = pathname.startsWith(href);
                        return (
                            <Link key={href} href={href}>
                                <Icon
                                    className={`h-6 w-6 ${active ? 'text-blue-500' : 'text-white/60'
                                        }`}
                                />
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* Center plus button */}
            <Link
                href="/add"
                className="
                    absolute
                    left-1/2
                    -top-6
                    -translate-x-1/2
                    h-14
                    w-14
                    rounded-full
                    flex
                    items-center
                    justify-center
                    shadow-xl
                    border
                    border-white/20
                    backdrop-blur-md
                "
                style={{
                    backgroundColor: isAddPage ? '#9CA3AF' : '#3B82F6',
                }}
            >
                <PlusIcon className="h-7 w-7 text-white" />
            </Link>
        </div>
    );
}
