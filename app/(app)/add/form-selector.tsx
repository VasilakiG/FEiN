'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { poppins } from '@/app/ui/fonts';

const FORM_OPTIONS = [
    { value: 'transaction', label: 'Transaction' },
    { value: 'account', label: 'Transaction Account' },
    { value: 'tag', label: 'Tag' },
] as const;

export type FormType = (typeof FORM_OPTIONS)[number]['value'];

export default function FormSelector({
    value,
    onChange,
}: {
    value: FormType;
    onChange: (v: FormType) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const currentLabel = FORM_OPTIONS.find((o) => o.value === value)?.label;

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`${poppins.className}
                    w-full flex items-center justify-center
                    h-12 rounded-xl
                    bg-white/10 border border-white/15
                    px-4 text-white text-2xl
                    transition-colors hover:bg-white/15
                `}
            >
                <span className='pr-2'>{currentLabel}</span>
                <ChevronDownIcon
                    className={`h-4 w-4 text-white/60 transition-transform ${open ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {open && (
                <div
                    className="
                        absolute z-50 mt-1 w-full
                        rounded-xl bg-[#1a1a2e] border border-white/15
                        shadow-xl overflow-hidden
                    "
                >
                    {FORM_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                                onChange(opt.value);
                                setOpen(false);
                            }}
                            className={`
                                w-full text-left px-4 py-3 text-sm transition-colors
                                ${opt.value === value
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'text-white/80 hover:bg-white/10'
                                }
                            `}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
