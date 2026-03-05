'use client';

import { useActionState, useEffect, useRef } from 'react';
import { addTag, type ActionState } from './actions';
import { poppins } from '@/app/ui/fonts';
import {
    TagIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';

export default function AddTagForm() {
    const [state, formAction, isPending] = useActionState<ActionState, FormData>(
        addTag,
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
            {/* Tag Name */}
            <div>
                <label className="block text-xs text-white/50 mb-1.5 pl-1">
                    Tag Name
                </label>
                <div className="relative">
                    <input
                        name="name"
                        type="text"
                        required
                        placeholder="e.g. food, rent, salary…"
                        className={`${poppins.className}
                            w-full h-12 rounded-xl
                            bg-white/10 border border-white/15
                            pl-10 pr-4 text-white text-sm
                            placeholder:text-white/40
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50
                        `}
                    />
                    <TagIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                </div>
                <p className="text-xs text-white/30 mt-1.5 pl-1">
                    Tags are shared across all users. Will be lowercased.
                </p>
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
                {isPending ? 'Creating…' : 'Create Tag'}
            </Button>
        </form>
    );
}
