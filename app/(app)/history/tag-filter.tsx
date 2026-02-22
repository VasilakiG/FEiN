'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function TagFilter({ tags }: { tags: string[] }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    // Read selected tags from URL (?tags=food,transport)
    const selectedRaw = searchParams.get('tags') ?? '';
    const selected = selectedRaw ? selectedRaw.split(',').filter(Boolean) : [];

    function toggle(tag: string) {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');

        let next: string[];
        if (selected.includes(tag)) {
            next = selected.filter((t) => t !== tag);
        } else {
            next = [...selected, tag];
        }

        if (next.length > 0) {
            params.set('tags', next.join(','));
        } else {
            params.delete('tags');
        }

        replace(`${pathname}?${params.toString()}`);
    }

    if (tags.length === 0) return null;

    return (
        <div className="overflow-x-auto no-scrollbar -mx-6 px-6">
            <div className="flex gap-2 w-max">
                {tags.map((tag) => {
                    const isActive = selected.includes(tag);
                    return (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => toggle(tag)}
                            className={`
                                whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium
                                border transition-all shrink-0
                                ${isActive
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'bg-white/10 border-white/10 text-white/60 hover:bg-white/15 hover:text-white/80'
                                }
                            `}
                        >
                            {tag}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
