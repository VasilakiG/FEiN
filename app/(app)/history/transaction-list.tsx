'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatMKD, formatDateToLocal } from '@/app/lib/utils';
import { deleteHistoryTransaction } from './actions';
import type { HistoryTransaction } from '@/app/lib/queries';

function TransactionCard({ tx }: { tx: HistoryTransaction }) {
    const [open, setOpen] = useState(false);

    const net = Number(tx.net_amount);
    const isNegative = net < 0;

    // postgres.js may return tags as a parsed array or as a PG
    // array literal string like "{food,transport}". Normalise to
    // a plain JS string[] so the pills always render.
    const rawTags: string[] = Array.isArray(tx.tags)
        ? tx.tags.filter(Boolean)
        : typeof tx.tags === 'string' && (tx.tags as string).length > 2
            ? (tx.tags as string)
                .replace(/^\{|\}$/g, '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

    // Separate note tags (__note:…) from regular tags
    const tags = rawTags.filter((t) => !t.startsWith('__note:'));
    const notes = rawTags
        .filter((t) => t.startsWith('__note:'))
        .map((t) => t.slice('__note:'.length));

    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5"
            >
                <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold text-white">
                        {tx.transaction_name ?? 'Transaction'}
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                        {formatDateToLocal(tx.date)}
                    </div>
                </div>
                <div
                    className={`text-xl font-semibold whitespace-nowrap ${isNegative ? 'text-amber-400' : 'text-emerald-300'
                        }`}
                >
                    {formatMKD(net)}
                </div>
            </button>

            {open && (
                <div className="border-t border-white/10 px-5 py-4">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                        <div className="space-y-4 min-w-0">
                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-white/35">
                                    Full name
                                </div>
                                <div className="mt-1 break-words text-base font-medium text-white">
                                    {tx.transaction_name ?? 'Transaction'}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-white/35">
                                    Price
                                </div>
                                <div
                                    className={`mt-1 text-lg font-semibold ${isNegative ? 'text-amber-400' : 'text-emerald-300'
                                        }`}
                                >
                                    {formatMKD(net)}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-white/35">
                                    Date
                                </div>
                                <div className="mt-1 text-sm text-white/80">
                                    {formatDateToLocal(tx.date)}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-white/35">
                                    Tags
                                </div>
                                {tags.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-1 text-sm text-white/40">
                                        No tags.
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-white/35">
                                    Notes
                                </div>
                                {notes.length > 0 ? (
                                    <div className="mt-2 space-y-2">
                                        {notes.map((note) => (
                                            <div
                                                key={note}
                                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                                            >
                                                {note}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-1 text-sm text-white/40">
                                        No notes.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-row gap-2 md:flex-col md:items-stretch">
                            <Link
                                href={`/history/${tx.transaction_id}/edit`}
                                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/15"
                            >
                                Edit
                            </Link>

                            <form action={deleteHistoryTransaction}>
                                <input
                                    type="hidden"
                                    name="transactionId"
                                    value={tx.transaction_id}
                                />
                                <button
                                    type="submit"
                                    onClick={(event) => {
                                        if (!window.confirm('Delete this transaction?')) {
                                            event.preventDefault();
                                        }
                                    }}
                                    className="inline-flex h-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20"
                                >
                                    Delete
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TransactionList({
    transactions,
}: {
    transactions: HistoryTransaction[];
}) {
    if (transactions.length === 0) {
        return (
            <div className="mt-6 py-10 text-center text-sm text-white/50">
                No transactions found.
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-3">
            {transactions.map((tx) => (
                <TransactionCard key={tx.transaction_id} tx={tx} />
            ))}
        </div>
    );
}
