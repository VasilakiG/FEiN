'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useRef, useCallback } from 'react';

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

    // ── Drag-to-scroll (mouse + touch) ──
    const scrollRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);
    const dragDistance = useRef(0);

    // 8px threshold: anything less is a tap, more is a drag
    const DRAG_THRESHOLD = 8;

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        const el = scrollRef.current;
        if (!el) return;
        isDragging.current = true;
        dragDistance.current = 0;
        startX.current = e.clientX;
        scrollLeft.current = el.scrollLeft;
    }, []);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current || !scrollRef.current) return;
        const dx = e.clientX - startX.current;
        dragDistance.current = Math.abs(dx);
        scrollRef.current.scrollLeft = scrollLeft.current - dx;
    }, []);

    const onPointerUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    // Suppress click only when the pointer moved beyond the threshold
    const onClickCapture = useCallback((e: React.MouseEvent) => {
        if (dragDistance.current >= DRAG_THRESHOLD) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, []);

    if (tags.length === 0) return null;

    return (
        <div
            ref={scrollRef}
            className="overflow-x-auto no-scrollbar -mx-6 px-6 cursor-grab active:cursor-grabbing select-none touch-pan-x"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClickCapture={onClickCapture}
        >
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
