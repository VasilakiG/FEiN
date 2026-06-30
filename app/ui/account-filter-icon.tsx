'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { WalletIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { TransactionAccountLite } from '@/app/lib/queries';

const NAVIGATION_START_EVENT = 'fein:navigation-start';

export default function AccountFilterIcon({
    accounts,
    accountParam = 'accountId',
    resetPageOnChange = false,
    onNavigateStart,
}: {
    accounts: TransactionAccountLite[];
    accountParam?: string;
    resetPageOnChange?: boolean;
    onNavigateStart?: () => void;
}) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const ref = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const currentId = searchParams.get(accountParam) ?? '';
    const hasFilter = currentId !== '';

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', onClickOutside);
            return () => document.removeEventListener('mousedown', onClickOutside);
        }
    }, [open]);

    useLayoutEffect(() => {
        if (!open || !buttonRef.current) {
            return;
        }

        const rect = buttonRef.current.getBoundingClientRect();
        const dropdownWidth = 224;
        const gap = 8;
        const left = Math.max(12, Math.min(rect.right - dropdownWidth, window.innerWidth - dropdownWidth - 12));
        const top = rect.bottom + gap;

        setMenuStyle({
            position: 'fixed',
            left,
            top,
            width: dropdownWidth,
            zIndex: 9999,
        });
    }, [open]);

    function select(value: string) {
        const params = new URLSearchParams(searchParams);

        if (resetPageOnChange) {
            params.set('page', '1');
        }

        if (value) {
            params.set(accountParam, value);
        } else {
            params.delete(accountParam);
        }

        const nextQuery = params.toString();
        window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
        onNavigateStart?.();
        replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
        setOpen(false);
    }

    return (
        <div ref={ref} className="relative z-50">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`
                    flex items-center justify-center h-12 w-12 rounded-xl border transition
                    ${hasFilter
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-white/15 border-white/15 text-white/60 hover:text-white hover:bg-white/20'
                    }
                `}
                title="Filter by account"
            >
                <WalletIcon className="h-5 w-5" />
            </button>

            {open && (
                createPortal(
                    <div style={menuStyle} className="rounded-xl bg-gray-900/95 border border-white/15 backdrop-blur-lg shadow-2xl py-1 overflow-hidden">
                        <DropdownItem
                            label="All Accounts"
                            isSelected={currentId === ''}
                            onClick={() => select('')}
                        />
                        {accounts.map((acc) => {
                            const id = String(acc.transaction_account_id);
                            return (
                                <DropdownItem
                                    key={id}
                                    label={acc.account_name ?? `Account #${acc.transaction_account_id}`}
                                    isSelected={currentId === id}
                                    onClick={() => select(id)}
                                />
                            );
                        })}
                    </div>,
                    document.body,
                )
            )}
        </div>
    );
}

function DropdownItem({
    label,
    isSelected,
    onClick,
}: {
    label: string;
    isSelected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition
                ${isSelected ? 'text-white bg-white/10' : 'text-white/70 hover:bg-white/5 hover:text-white'}
            `}
        >
            {isSelected && <CheckIcon className="h-4 w-4 shrink-0 text-blue-400" />}
            <span className={isSelected ? '' : 'pl-6'}>{label}</span>
        </button>
    );
}
