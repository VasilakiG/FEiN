'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { generatePagination } from '@/app/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Pagination({ totalPages }: { totalPages: number }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentPage = Number(searchParams.get('page')) || 1;

    const allPages = generatePagination(currentPage, totalPages);

    function createPageURL(pageNumber: number | string) {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    }

    if (totalPages <= 1) return null;

    return (
        <div className="mt-6 flex items-center justify-center gap-1">
            <PaginationArrow
                direction="left"
                href={createPageURL(currentPage - 1)}
                isDisabled={currentPage <= 1}
            />

            {allPages.map((page, index) => {
                let position: 'first' | 'last' | 'single' | 'middle' | undefined;

                if (index === 0) position = 'first';
                if (index === allPages.length - 1) position = 'last';
                if (allPages.length === 1) position = 'single';
                if (page === '...') position = 'middle';

                return (
                    <PaginationNumber
                        key={`${page}-${index}`}
                        href={createPageURL(page)}
                        page={page}
                        position={position}
                        isActive={currentPage === page}
                    />
                );
            })}

            <PaginationArrow
                direction="right"
                href={createPageURL(currentPage + 1)}
                isDisabled={currentPage >= totalPages}
            />
        </div>
    );
}

function PaginationNumber({
    page,
    href,
    isActive,
    position,
}: {
    page: number | string;
    href: string;
    position?: 'first' | 'last' | 'middle' | 'single';
    isActive: boolean;
}) {
    const className = clsx(
        'flex h-9 w-9 items-center justify-center text-sm rounded-lg transition',
        {
            'rounded-l-xl': position === 'first' || position === 'single',
            'rounded-r-xl': position === 'last' || position === 'single',
            'bg-blue-600 text-white': isActive,
            'text-white/60 hover:text-white hover:bg-white/10': !isActive && position !== 'middle',
            'text-white/40 pointer-events-none': position === 'middle',
        },
    );

    return isActive || position === 'middle' ? (
        <div className={className}>{page}</div>
    ) : (
        <Link href={href} className={className}>
            {page}
        </Link>
    );
}

function PaginationArrow({
    href,
    direction,
    isDisabled,
}: {
    href: string;
    direction: 'left' | 'right';
    isDisabled?: boolean;
}) {
    const className = clsx(
        'flex h-9 w-9 items-center justify-center rounded-lg transition',
        {
            'pointer-events-none text-white/20': isDisabled,
            'text-white/60 hover:text-white hover:bg-white/10': !isDisabled,
        },
    );

    const icon =
        direction === 'left' ? (
            <ChevronLeftIcon className="h-4 w-4" />
        ) : (
            <ChevronRightIcon className="h-4 w-4" />
        );

    return isDisabled ? (
        <div className={className}>{icon}</div>
    ) : (
        <Link href={href} className={className}>
            {icon}
        </Link>
    );
}
