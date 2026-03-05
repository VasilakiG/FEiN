'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addTransactionAccount, type ActionState } from './actions';
import { poppins } from '@/app/ui/fonts';
import {
    CurrencyDollarIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';

export default function AddAccountForm() {
    const [state, formAction, isPending] = useActionState<ActionState, FormData>(
        addTransactionAccount,
        undefined,
    );
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
        }
    }, [state]);

    return (
        <form ref={formRef} action={formAction} className="space-y-4">
            {/* Account Name */}
            <div>
                <label className="block text-xs text-white/50 mb-1.5 pl-1">
                    Account Name
                </label>
                <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Cash, Bank Card…"
                    className={`${poppins.className}
                        w-full h-12 rounded-xl
                        bg-white/10 border border-white/15
                        px-4 text-white text-sm
                        placeholder:text-white/40
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50
                    `}
                />
            </div>

            {/* Initial Balance */}
            <div>
                <label className="block text-xs text-white/50 mb-1.5 pl-1">
                    Initial Balance (optional)
                </label>
                <div className="relative">
                    <input
                        name="balance"
                        type="number"
                        step="any"
                        defaultValue="0"
                        placeholder="0"
                        className={`${poppins.className}
                            w-full h-12 rounded-xl
                            bg-white/10 border border-white/15
                            pl-10 pr-4 text-white text-sm
                            placeholder:text-white/40
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50
                        `}
                    />
                    <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                </div>
            </div>

            {/* Feedback */}
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
                {isPending ? 'Creating…' : 'Create Account'}
            </Button>
        </form>
    );
}
