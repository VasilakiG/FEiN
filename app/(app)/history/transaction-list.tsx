import { formatMKD, formatDateToLocal } from '@/app/lib/utils';
import type { HistoryTransaction } from '@/app/lib/queries';

export default function TransactionList({
    transactions,
}: {
    transactions: HistoryTransaction[];
}) {
    if (transactions.length === 0) {
        return (
            <div className="mt-6 text-center text-white/50 text-sm py-10">
                No transactions found.
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-3">
            {transactions.map((tx) => {
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
                    <div
                        key={tx.transaction_id}
                        className="rounded-2xl px-5 py-4 bg-black/30 border border-white/10 backdrop-blur-md flex items-center justify-between"
                    >
                        <div className="min-w-0 flex-1 mr-3">
                            <div className="text-white text-lg font-semibold truncate">
                                {tx.transaction_name ?? 'Transaction'}
                            </div>
                            {tags.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-block rounded-full bg-white/15 border border-white/10 px-2.5 py-0.5 text-xs text-white/70"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {notes.length > 0 && (
                                <div className="mt-1 text-xs text-white/40 italic truncate">
                                    {notes[0]}
                                </div>
                            )}
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
                    </div>
                );
            })}
        </div>
    );
}
