'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DashboardAccount } from '@/app/lib/queries';
import { formatMKD } from '@/app/lib/utils';
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline';

type Props = {
    userId: number;
    accounts: DashboardAccount[];
};

function storageKey(userId: number) {
    return `fein:accountsOrder:v1:${userId}`;
}

function collapsedKey(userId: number) {
    return `fein:accountsCollapsed:v1:${userId}`;
}

export default function AccountsSection({ userId, accounts }: Props) {
    const [collapsed, setCollapsed] = useState(true);
    const [editMode, setEditMode] = useState(false);

    // order is stored as list of account ids
    const [order, setOrder] = useState<number[] | null>(null);

    // load order and collapsed state from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey(userId));
            if (!raw) {
                setOrder(accounts.map((a) => a.transaction_account_id));
            } else {
                const parsed = JSON.parse(raw) as number[];
                setOrder(parsed);
            }
        } catch {
            setOrder(accounts.map((a) => a.transaction_account_id));
        }

        try {
            const savedCollapsed = localStorage.getItem(collapsedKey(userId));
            if (savedCollapsed !== null) {
                setCollapsed(savedCollapsed === 'true');
            }
            // else stays at the default (true)
        } catch {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // keep order in sync if accounts change (new account added)
    useEffect(() => {
        if (!order) {
            return;
        }
        const ids = accounts.map((a) => a.transaction_account_id);
        const missing = ids.filter((id) => !order.includes(id));
        if (missing.length === 0) {
            return;
        }

        const next = [...order, ...missing];
        setOrder(next);
        localStorage.setItem(storageKey(userId), JSON.stringify(next));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accounts, order]);

    const accountsById = useMemo(() => {
        const m = new Map<number, DashboardAccount>();
        for (const a of accounts) {
            m.set(a.transaction_account_id, a);
        }
        return m;
    }, [accounts]);

    const orderedAccounts = useMemo(() => {
        if (!order) {
            return accounts;
        }
        const list: DashboardAccount[] = [];
        for (const id of order) {
            const acc = accountsById.get(id);
            if (acc) {
                list.push(acc);
            }
        }
        // in case localStorage has old ids, append any not included
        const appended = accounts.filter(
            (a) => !list.some((x) => x.transaction_account_id === a.transaction_account_id),
        );

        return [...list, ...appended];
    }, [accounts, accountsById, order]);

    const count = orderedAccounts.length;
    const hasAccounts = count > 0;
    const canCollapse = count > 1;
    const canReorder = count > 1;
    const moreCount = Math.max(0, count - 1);

    useEffect(() => {
        // If 0 or 1 accounts, collapse/edit should not be possible
        if (!canCollapse && collapsed) {
            setCollapsed(false);
            localStorage.setItem(collapsedKey(userId), 'false');
        }
        if (!canReorder && editMode) {
            setEditMode(false);
        }
    }, [canCollapse, canReorder, collapsed, editMode, userId]);

    function persist(nextOrder: number[]) {
        setOrder(nextOrder);
        localStorage.setItem(storageKey(userId), JSON.stringify(nextOrder));
    }

    // drag & drop
    const [dragId, setDragId] = useState<number | null>(null);

    function move(from: number, to: number) {
        if (!order) {
            return;
        }
        if (from === to) {
            return;
        }
        const next = [...order];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        persist(next);
    }

    function moveUp(idx: number) {
        if (!order) {
            return;
        }
        if (idx <= 0) {
            return;
        }
        move(idx, idx - 1);
    }

    function moveDown(idx: number) {
        if (!order) {
            return;
        }
        if (idx >= order.length - 1) {
            return;
        }
        move(idx, idx + 1);
    }

    return (
        <div className="mt-8">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="text-white/90 text-xl font-semibold">Accounts</div>

                <div className="flex items-center gap-3">
                    {canCollapse && !collapsed && !editMode && (
                        <button
                            type="button"
                            onClick={() => {
                                setCollapsed(true);
                                localStorage.setItem(collapsedKey(userId), 'true');
                            }}
                            className="text-white/60 hover:text-white/90 text-sm transition"
                        >
                            Collapse
                        </button>
                    )}

                    {canReorder && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditMode((v) => !v);
                                setCollapsed(false); // editing implies expanded
                                localStorage.setItem(collapsedKey(userId), 'false');
                            }}
                            className="text-white/60 hover:text-white/90 text-sm transition flex items-center"
                            aria-label={editMode ? 'Done reordering' : 'Reorder accounts'}
                            title={editMode ? 'Done' : 'Reorder'}
                        >
                            {editMode ? 'Done' : <ArrowsUpDownIcon className="h-5 w-5" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsed stack */}
            {canCollapse && collapsed ? (
                <div className="mt-5 relative">
                    {/* Ghost cards behind (blank, same style) */}
                    <div
                        aria-hidden
                        className="
                            absolute
                            left-1/2
                            top-10
                            -translate-x-1/2
                            w-[92%]
                            h-[112px]
                            rounded-2xl
                            bg-blue-600/20
                            border border-white/10
                            backdrop-blur-md
                            shadow-lg
                        "
                        style={{
                            transform: 'translateY(10px) scale(0.96)',
                            zIndex: 1,
                            filter: 'saturate(0.95)',
                        }}
                    />

                    {moreCount > 1 && (
                        <div
                            aria-hidden
                            className="
                                absolute
                                left-1/2
                                top-10
                                -translate-x-1/2
                                w-[92%]
                                h-[112px]
                                rounded-2xl
                                bg-blue-700/20
                                border border-white/10
                                backdrop-blur-md
                                shadow-md
                            "
                            style={{
                                transform: 'translateY(45px) scale(0.82)',
                                zIndex: 0,
                                filter: 'saturate(0.95)',
                            }}
                        />
                    )}

                    {/* the actual top card */}
                    <div className="relative z-10">
                        <AccountCard acc={orderedAccounts[0]} />
                    </div>

                    {/* Spacer so section takes height */}
                    <div style={{ height: 70 }} />

                    <div className="flex justify-center items-center">
                        {moreCount > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setCollapsed(false);
                                    localStorage.setItem(collapsedKey(userId), 'false');
                                }}
                                className="text-white/60 hover:text-white/90 text-sm transition"
                            >
                                Expand {moreCount} more
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                // Expanded list (reorderable in edit mode)
                <div className="mt-5">
                    {hasAccounts ? (
                        <div className="space-y-5">
                            {orderedAccounts.map((acc, idx) => (
                                <div
                                    key={acc.transaction_account_id}
                                    draggable={editMode}
                                    onDragStart={() => {
                                        setDragId(acc.transaction_account_id);
                                    }}
                                    onDragOver={(e) => {
                                        if (!editMode) {
                                            return;
                                        }
                                        e.preventDefault();
                                    }}
                                    onDrop={() => {
                                        if (!editMode) {
                                            return;
                                        }
                                        if (!dragId || !order) {
                                            return;
                                        }
                                        const from = order.indexOf(dragId);
                                        const to = order.indexOf(acc.transaction_account_id);
                                        if (from >= 0 && to >= 0) {
                                            move(from, to);
                                        }
                                        setDragId(null);
                                    }}
                                    className={editMode ? 'cursor-grab active:cursor-grabbing' : ''}
                                >
                                    <AccountCard acc={acc} />

                                    {editMode && order && (
                                        <div className="mt-2 flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    moveUp(idx);
                                                }}
                                                className="text-xs text-white/60 hover:text-white/90 border border-white/10 rounded-lg px-3 py-1 bg-black/20"
                                            >
                                                Up
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    moveDown(idx);
                                                }}
                                                className="text-xs text-white/60 hover:text-white/90 border border-white/10 rounded-lg px-3 py-1 bg-black/20"
                                            >
                                                Down
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-white/60 text-sm">No accounts yet.</div>
                    )}
                </div>
            )}
        </div>
    );
}

function AccountCard({
    acc,
    compact = false,
}: {
    acc: DashboardAccount;
    compact?: boolean;
}) {
    return (
        <div
            className={`
                relative
                overflow-hidden
                rounded-2xl
                px-6
                ${compact ? 'py-5' : 'py-6'}
                bg-blue-600/25
                border
                border-white/10
                backdrop-blur-md
                shadow-lg
            `}
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />

            <div className="relative">
                <div className="text-white text-2xl font-semibold">
                    {acc.account_name ?? 'Account'}
                </div>
                <div className="mt-3 text-white text-2xl font-semibold">
                    {formatMKD(acc.balance)}
                </div>
            </div>
        </div>
    );
}
