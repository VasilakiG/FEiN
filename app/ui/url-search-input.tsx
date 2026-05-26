'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { poppins } from '@/app/ui/fonts';

const NAVIGATION_START_EVENT = 'fein:navigation-start';

export default function UrlSearchInput({
    placeholder,
    queryParam = 'query',
    debounceMs = 300,
    resetPageOnChange = false,
    onNavigateStart,
}: {
    placeholder: string;
    queryParam?: string;
    debounceMs?: number;
    resetPageOnChange?: boolean;
    onNavigateStart?: () => void;
}) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);

        if (resetPageOnChange) {
            params.set('page', '1');
        }

        if (term) {
            params.set(queryParam, term);
        } else {
            params.delete(queryParam);
        }

        const nextQuery = params.toString();
        window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
        onNavigateStart?.();
        replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }, debounceMs);

    return (
        <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />
            <input
                className={`${poppins.className} w-full h-12 rounded-xl bg-white/15 border border-white/15 pl-11 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition`}
                placeholder={placeholder}
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get(queryParam)?.toString()}
            />
        </div>
    );
}
