'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { addTransaction, type ActionState } from './actions';
import { poppins } from '@/app/ui/fonts';
import {
    CalendarIcon,
    PlusIcon,
    XMarkIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';

type AccountOption = { transaction_account_id: number; account_name: string | null };
type TagOption = { tag_id: number; tag_name: string };

type Breakdown = {
    id: number; // client-side key
    type: 'from' | 'to';
    accountId: number;
    amount: string;
};

let nextId = 1;

export default function AddTransactionForm({
    accounts,
    allTags,
}: {
    accounts: AccountOption[];
    allTags: TagOption[];
}) {
    const [state, formAction, isPending] = useActionState<ActionState, FormData>(
        addTransaction,
        undefined,
    );
    const formRef = useRef<HTMLFormElement>(null);

    // ── Breakdowns ──
    const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
    const [showFieldMenu, setShowFieldMenu] = useState(false);
    const fieldMenuRef = useRef<HTMLDivElement>(null);

    function addBreakdown(type: 'from' | 'to') {
        const defaultAccount = accounts[0]?.transaction_account_id ?? 0;
        setBreakdowns((prev) => [
            ...prev,
            { id: nextId++, type, accountId: defaultAccount, amount: '' },
        ]);
        setShowFieldMenu(false);
    }

    function removeBreakdown(id: number) {
        setBreakdowns((prev) => prev.filter((b) => b.id !== id));
    }

    function updateBreakdown(id: number, field: Partial<Breakdown>) {
        setBreakdowns((prev) =>
            prev.map((b) => (b.id === id ? { ...b, ...field } : b)),
        );
    }

    // ── Tags ──
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    function toggleTag(name: string) {
        setSelectedTags((prev) =>
            prev.includes(name)
                ? prev.filter((t) => t !== name)
                : [...prev, name],
        );
    }

    function addCustomTag() {
        const trimmed = tagInput.trim().toLowerCase();
        if (trimmed && !selectedTags.includes(trimmed)) {
            setSelectedTags((prev) => [...prev, trimmed]);
        }
        setTagInput('');
    }

    // ── Reset on success ──
    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
            setBreakdowns([]);
            setSelectedTags([]);
            setTagInput('');
        }
    }, [state]);

    // ── Close field menu on outside click ──
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (
                fieldMenuRef.current &&
                !fieldMenuRef.current.contains(e.target as Node)
            ) {
                setShowFieldMenu(false);
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Build serialised data for hidden fields ──
    const breakdownsPayload = breakdowns.map((b) => ({
        type: b.type,
        accountId: b.accountId,
        amount: Number(b.amount) || 0,
    }));

    const inputClasses = `${poppins.className}
        w-full h-12 rounded-xl
        bg-white/10 border border-white/15
        px-4 text-white text-sm
        placeholder:text-white/40
        focus:outline-none focus:ring-2 focus:ring-blue-500/50
    `;

    return (
        <form ref={formRef} action={formAction} className="space-y-5">
            {/* Hidden serialised fields */}
            <input type="hidden" name="tags" value={JSON.stringify(selectedTags)} />
            <input type="hidden" name="pendingTag" value={tagInput.trim().toLowerCase()} />
            <input
                type="hidden"
                name="breakdowns"
                value={JSON.stringify(breakdownsPayload)}
            />

            {/* Transaction Name */}
            <div>
                <label className="block text-xs text-white/50 mb-1.5 pl-1">
                    Name
                </label>
                <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Grocery shopping"
                    className={inputClasses}
                />
            </div>

            {/* Date */}
            <div>
                <label className="block text-xs text-white/50 mb-1.5 pl-1">
                    Date
                </label>
                <div className="relative">
                    <input
                        name="date"
                        type="date"
                        required
                        defaultValue={new Date().toISOString().slice(0, 10)}
                        className={`${inputClasses} pl-10 [color-scheme:dark]`}
                    />
                    <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                </div>
            </div>

            {/* Amount */}
            <div>
                <label className="block text-xs text-white/50 mb-1.5 pl-1">
                    Amount
                </label>
                <input
                    name="amount"
                    type="number"
                    step="any"
                    required
                    placeholder="0"
                    className={inputClasses}
                />
            </div>

            {/* ── Breakdown fields ── */}
            {breakdowns.length > 0 && (
                <div className="space-y-3">
                    <span className="block text-xs text-white/50 pl-1">
                        Account Breakdowns
                    </span>
                    {breakdowns.map((bd) => (
                        <div
                            key={bd.id}
                            className="
                                flex items-center gap-2
                                rounded-xl bg-white/5 border border-white/10
                                p-3
                            "
                        >
                            {/* Type badge */}
                            <span
                                className={`
                                    shrink-0 flex items-center gap-1
                                    text-xs font-medium px-2 py-1 rounded-lg
                                    ${bd.type === 'from'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-green-500/20 text-green-400'
                                    }
                                `}
                            >
                                {bd.type === 'from' ? (
                                    <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                                ) : (
                                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                )}
                                {bd.type === 'from' ? 'From' : 'To'}
                            </span>

                            {/* Account Select */}
                            <select
                                value={bd.accountId}
                                onChange={(e) =>
                                    updateBreakdown(bd.id, {
                                        accountId: Number(e.target.value),
                                    })
                                }
                                className={`${poppins.className}
                                    flex-1 min-w-0 h-9 rounded-lg
                                    bg-white/10 border border-white/15
                                    px-2 text-white text-xs
                                    focus:outline-none focus:ring-1 focus:ring-blue-500/50
                                `}
                            >
                                {accounts.map((a) => (
                                    <option
                                        key={a.transaction_account_id}
                                        value={a.transaction_account_id}
                                        className="bg-[#1a1a2e] text-white"
                                    >
                                        {a.account_name ?? `Account #${a.transaction_account_id}`}
                                    </option>
                                ))}
                            </select>

                            {/* Amount */}
                            <input
                                type="number"
                                step="any"
                                placeholder="0"
                                value={bd.amount}
                                onChange={(e) =>
                                    updateBreakdown(bd.id, { amount: e.target.value })
                                }
                                className={`${poppins.className}
                                    w-20 h-9 rounded-lg
                                    bg-white/10 border border-white/15
                                    px-2 text-white text-xs text-right
                                    placeholder:text-white/40
                                    focus:outline-none focus:ring-1 focus:ring-blue-500/50
                                `}
                            />

                            {/* Remove */}
                            <button
                                type="button"
                                onClick={() => removeBreakdown(bd.id)}
                                className="shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <XMarkIcon className="h-4 w-4 text-white/40" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add a Field button */}
            <div ref={fieldMenuRef} className="relative">
                <button
                    type="button"
                    onClick={() => setShowFieldMenu(!showFieldMenu)}
                    className="
                        flex items-center gap-1.5
                        text-sm text-blue-400 hover:text-blue-300
                        transition-colors
                    "
                >
                    <PlusIcon className="h-4 w-4" />
                    Add a field
                </button>

                {showFieldMenu && (
                    <div
                        className="
                            absolute z-40 mt-1 left-0
                            w-48 rounded-xl
                            bg-[#1a1a2e] border border-white/15
                            shadow-xl overflow-hidden
                        "
                    >
                        <button
                            type="button"
                            onClick={() => addBreakdown('from')}
                            className="
                                w-full flex items-center gap-2 px-4 py-3
                                text-sm text-white/80 hover:bg-white/10
                                transition-colors
                            "
                        >
                            <ArrowUpTrayIcon className="h-4 w-4 text-red-400" />
                            From Account
                        </button>
                        <button
                            type="button"
                            onClick={() => addBreakdown('to')}
                            className="
                                w-full flex items-center gap-2 px-4 py-3
                                text-sm text-white/80 hover:bg-white/10
                                transition-colors
                            "
                        >
                            <ArrowDownTrayIcon className="h-4 w-4 text-green-400" />
                            To Account
                        </button>
                    </div>
                )}
            </div>

            {/* ── Tags ── */}
            <div>
                <label className="block text-xs text-white/50 mb-1.5 pl-1">
                    Tags
                </label>

                {/* Existing tags as toggleable pills */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {allTags.map((t) => {
                        const active = selectedTags.includes(t.tag_name);
                        return (
                            <button
                                key={t.tag_id}
                                type="button"
                                onClick={() => toggleTag(t.tag_name)}
                                className={`
                                    px-2.5 py-1 rounded-full text-xs font-medium
                                    transition-colors border
                                    ${active
                                        ? 'bg-blue-500/30 border-blue-400/50 text-blue-300'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                    }
                                `}
                            >
                                {t.tag_name}
                            </button>
                        );
                    })}
                </div>

                {/* Custom tag pills (not from DB yet) */}
                {selectedTags
                    .filter((s) => !allTags.some((t) => t.tag_name === s))
                    .map((custom) => (
                        <span
                            key={custom}
                            className="
                                inline-flex items-center gap-1
                                mr-1.5 mb-1.5
                                px-2.5 py-1 rounded-full text-xs font-medium
                                bg-blue-500/30 border border-blue-400/50 text-blue-300
                            "
                        >
                            {custom}
                            <button
                                type="button"
                                onClick={() => toggleTag(custom)}
                                className="hover:text-white"
                            >
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </span>
                    ))}

                {/* Input to add new tag */}
                <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomTag();
                        }
                    }}
                    placeholder="Type a new tag + Enter"
                    className={`${poppins.className}
                        w-full h-10 rounded-xl
                        bg-white/5 border border-white/10
                        px-3 text-white text-xs
                        placeholder:text-white/30
                        focus:outline-none focus:ring-1 focus:ring-blue-500/50
                    `}
                />
            </div>

            {/* ── Note ── */}
            <div>
                <label className="block text-xs text-white/50 mb-1.5 pl-1">
                    Note (optional)
                </label>
                <textarea
                    name="note"
                    rows={2}
                    placeholder="Any extra details…"
                    className={`${poppins.className}
                        w-full rounded-xl
                        bg-white/10 border border-white/15
                        px-4 py-3 text-white text-sm
                        placeholder:text-white/40
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50
                        resize-none
                    `}
                />
            </div>

            {/* ── Feedback ── */}
            {state?.error && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                    <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
                    {state.error}
                </div>
            )}
            {state?.success && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircleIcon className="h-4 w-4 shrink-0" />
                    {state.success}
                </div>
            )}

            <Button
                type="submit"
                aria-disabled={isPending}
                className="w-full justify-center h-12 rounded-xl text-sm font-semibold"
            >
                {isPending ? 'Creating…' : 'Create Transaction'}
            </Button>
        </form>
    );
}
