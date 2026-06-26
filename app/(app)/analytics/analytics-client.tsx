"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarDaysIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatMKD } from '@/app/lib/utils';
import UrlSearchInput from '@/app/ui/url-search-input';
import AccountFilterIcon from '@/app/ui/account-filter-icon';
import type { AnalyticsData, AnalyticsTagTotal, AnalyticsTrendPoint } from '@/app/lib/queries';

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#a78bfa', '#fb7185', '#22d3ee', '#f97316'];
const ANALYTICS_KEYS = ['query', 'accountId', 'period', 'startDate', 'endDate', 'focusTags'] as const;
const NAVIGATION_START_EVENT = 'fein:navigation-start';

export default function AnalyticsClient({
    data,
    userId,
}: {
    data: AnalyticsData;
    userId: number;
}) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [trendZoomOpen, setTrendZoomOpen] = useState(false);

    const query = searchParams.get('query') ?? '';
    const period = (searchParams.get('period') ?? 'month') as 'month' | 'year' | 'range';
    const startDate = searchParams.get('startDate') ?? '';
    const endDate = searchParams.get('endDate') ?? '';
    const selectedFocusTags = (searchParams.get('focusTags') ?? '').split(',').filter(Boolean);

    const storageKey = `fein:analyticsState:v1:${userId}`;

    function navigateWithIndicator(nextUrl: string) {
        window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
        replace(nextUrl, { scroll: false });
    }

    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) {
                return;
            }

            const hasActiveParams = ANALYTICS_KEYS.some((key) => searchParams.get(key));
            if (hasActiveParams) {
                return;
            }

            const stored = JSON.parse(raw) as Record<string, string | undefined>;
            const params = new URLSearchParams();
            for (const key of ANALYTICS_KEYS) {
                const value = stored[key];
                if (value) {
                    params.set(key, value);
                }
            }

            const nextQuery = params.toString();
            if (nextQuery) {
                navigateWithIndicator(`${pathname}?${nextQuery}`);
            }
        } catch {
            // ignore storage errors
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, userId]);

    useEffect(() => {
        try {
            const snapshot: Record<string, string | undefined> = {};
            for (const key of ANALYTICS_KEYS) {
                const value = searchParams.get(key) ?? undefined;
                if (value) {
                    snapshot[key] = value;
                }
            }

            localStorage.setItem(storageKey, JSON.stringify(snapshot));
        } catch {
            // ignore storage errors
        }
    }, [searchParams, storageKey]);

    const updateParams = (mutate: (params: URLSearchParams) => void) => {
        const params = new URLSearchParams(searchParams);
        mutate(params);
        const nextQuery = params.toString();
        navigateWithIndicator(nextQuery ? `${pathname}?${nextQuery}` : pathname);
    };

    const setPeriod = (value: 'month' | 'year' | 'range') => {
        updateParams((params) => {
            params.set('period', value);
            if (value !== 'range') {
                params.delete('startDate');
                params.delete('endDate');
            } else if (!params.get('startDate') || !params.get('endDate')) {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                params.set('startDate', toDateInputValue(start));
                params.set('endDate', toDateInputValue(end));
            }
        });
    };

    const setRangeDate = (key: 'startDate' | 'endDate', value: string) => {
        updateParams((params) => {
            params.set('period', 'range');
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
    };

    const toggleFocusTag = (tag: string) => {
        updateParams((params) => {
            const current = (params.get('focusTags') ?? '').split(',').filter(Boolean);
            const next = current.includes(tag)
                ? current.filter((value) => value !== tag)
                : [...current, tag];

            if (next.length > 0) {
                params.set('focusTags', next.join(','));
            } else {
                params.delete('focusTags');
            }
        });
    };

    const clearAllFilters = () => {
        navigateWithIndicator(pathname);
    };

    const mainTagSlices = useMemo(() => toSlices(data.tagTotals), [data.tagTotals]);
    const focusTagSlices = useMemo(() => toSlices(data.focusTagTotals), [data.focusTagTotals]);
    const visibleTags = useMemo(() => {
        if (!query.trim()) return data.tags;
        const lowered = query.trim().toLowerCase();
        return data.tags.filter((tag) => tag.toLowerCase().includes(lowered));
    }, [data.tags, query]);

    return (
        <div className="mt-8 space-y-6 text-white">
            <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-md p-4 md:p-5 space-y-4">
                <div className="flex gap-2 items-center">
                    <div className="flex-1 min-w-0">
                        <UrlSearchInput
                            placeholder="Search tags, accounts, or transactions..."
                            debounceMs={250}
                        />
                    </div>
                    <AccountFilterIcon
                        accounts={data.accounts}
                    />
                </div>

                <div className="space-y-2">
                    <div className="inline-flex w-full justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
                        {([['month', 'Monthly'], ['year', 'Yearly'], ['range', 'Range']] as const).map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setPeriod(value)}
                                className={`rounded-xl px-4 py-2 text-sm font-medium transition whitespace-nowrap ${period === value
                                    ? 'bg-sky-500 text-slate-950'
                                    : 'text-white/65 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {period === 'range' && (
                        <div className="grid grid-cols-2 gap-2">
                            <DatePickerButton
                                label="Start Date"
                                value={startDate}
                                onChange={(value) => setRangeDate('startDate', value)}
                            />
                            <DatePickerButton
                                label="End Date"
                                value={endDate}
                                onChange={(value) => setRangeDate('endDate', value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            <RingCard
                title="Top tags"
                slices={mainTagSlices}
                emptyMessage="No tags match the current filters."
            />

            <TrendCard trend={data.trend} period={period} onZoom={() => setTrendZoomOpen(true)} />

            <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-md p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-white">Custom tag mix</div>

                    {selectedFocusTags.length > 0 && (
                        <button
                            type="button"
                            onClick={() => updateParams((params) => params.delete('focusTags'))}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/12"
                        >
                            <XMarkIcon className="h-4 w-4" />
                            Clear tag mix
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {visibleTags.length === 0 ? (
                        <div className="text-sm text-white/45">No tags available for this account set.</div>
                    ) : (
                        visibleTags.map((tag) => {
                            const selected = selectedFocusTags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleFocusTag(tag)}
                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${selected
                                        ? 'border-sky-400/40 bg-sky-500/15 text-white'
                                        : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {selected && <CheckIcon className="h-4 w-4" />}
                                    <span>{tag}</span>
                                </button>
                            );
                        })
                    )}
                </div>

                {selectedFocusTags.length > 0 && (
                    <RingCard
                        title="Selected tags"
                        slices={focusTagSlices}
                        emptyMessage="None of the selected tags produced spending in the current filters."
                        compact
                    />
                )}
            </div>

            <div className="flex justify-center">
                <button
                    type="button"
                    onClick={clearAllFilters}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10"
                >
                    Reset analytics filters
                </button>
            </div>

            {trendZoomOpen && (
                <TrendZoomModal trend={data.trend} period={period} onClose={() => setTrendZoomOpen(false)} />
            )}
        </div>
    );
}

function DatePickerButton({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const displayValue = value ? formatDateForButton(value) : 'Pick date';
    const useDirectTapInput = useMemo(() => {
        if (typeof navigator === 'undefined' || typeof window === 'undefined') {
            return false;
        }

        const ua = navigator.userAgent || '';
        const isIOS =
            /iPad|iPhone|iPod/.test(ua)
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isTouch = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

        // iOS/PWA is more reliable with a direct tap on a native date input.
        return isIOS && isTouch;
    }, []);

    function openPicker() {
        const input = inputRef.current;
        if (!input) return;

        if (typeof input.showPicker === 'function') {
            input.showPicker();
            return;
        }

        input.focus();
        input.click();
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={openPicker}
                aria-label={label}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition"
            >
                <CalendarDaysIcon className="h-4 w-4 shrink-0 text-white/50" />
                <span className="truncate text-white/75">{displayValue}</span>
            </button>
            <input
                ref={inputRef}
                type="date"
                aria-label={label}
                className={useDirectTapInput
                    ? 'absolute inset-0 h-full w-full cursor-pointer opacity-0'
                    : 'pointer-events-none absolute h-0 w-0 opacity-0'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function TrendCard({
    trend,
    period,
    onZoom,
}: {
    trend: AnalyticsTrendPoint[];
    period: 'month' | 'year' | 'range';
    onZoom: () => void;
}) {
    const values = trend.map((point) => Number(point.spent));
    const max = Math.max(...values, 1);
    const height = 380;
    const width = Math.max(1200, trend.length * 82);
    const padX = 76;
    const padTop = 36;
    const padBottom = 80;
    const innerWidth = width - padX * 2;
    const innerHeight = height - padTop - padBottom;
    const step = trend.length > 1 ? innerWidth / (trend.length - 1) : 0;

    const linePoints = trend.map((point, index) => {
        const x = padX + index * step;
        const y = padTop + innerHeight - (Number(point.spent) / max) * innerHeight;
        return { x, y, label: point.label };
    });

    const linePath = linePoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
    const areaPath =
        linePoints.length > 0
            ? `${linePath} L ${linePoints[linePoints.length - 1].x} ${height - padBottom} L ${linePoints[0].x} ${height - padBottom} Z`
            : '';

    const tickCount = period === 'year' ? 6 : 8;
    const tickStep = Math.max(1, Math.ceil(Math.max(linePoints.length, 1) / tickCount));

    return (
        <button
            type="button"
            onClick={onZoom}
            className="w-full rounded-3xl border border-white/10 bg-black/25 backdrop-blur-md p-5 overflow-hidden text-left transition hover:bg-black/30"
        >
            <div className="flex items-center justify-between gap-4">
                <div className="text-lg font-semibold text-white">Spending trend</div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                <div className="overflow-x-auto no-scrollbar">
                    <svg viewBox={`0 0 ${width} ${height}`} className="h-[320px] min-w-[1000px] w-full">
                        <defs>
                            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
                            </linearGradient>
                        </defs>

                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                            const y = padTop + innerHeight - innerHeight * ratio;
                            return (
                                <g key={ratio}>
                                    <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="5 6" />
                                    <text x={16} y={y + 4} fill="rgba(255,255,255,0.35)" fontSize="18">
                                        {formatAxisValue(max * ratio)}
                                    </text>
                                </g>
                            );
                        })}

                        {areaPath && <path d={areaPath} fill="url(#trendFill)" />}
                        {linePath && <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}

                        {linePoints.map((point) => (
                            <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="6" fill="#e0f2fe" stroke="#0284c7" strokeWidth="4" />
                        ))}

                        {linePoints.map((point, index) => {
                            if (index % tickStep !== 0 && index !== linePoints.length - 1) return null;
                            return (
                                <text key={`${point.label}-${index}`} x={point.x} y={height - 28} fill="rgba(255,255,255,0.45)" fontSize="16" textAnchor="middle">
                                    {point.label}
                                </text>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </button>
    );
}

function RingCard({
    title,
    slices,
    emptyMessage,
    compact = false,
}: {
    title: string;
    slices: { label: string; value: number }[];
    emptyMessage: string;
    compact?: boolean;
}) {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    const radius = compact ? 70 : 82;
    const strokeWidth = compact ? 18 : 22;
    const circumference = 2 * Math.PI * radius;
    const segments = slices.reduce(
        (acc, slice, index) => {
            const portion = total > 0 ? slice.value / total : 0;
            const dash = Math.max(portion * circumference, 0.01);
            acc.push({
                label: slice.label,
                color: COLORS[index % COLORS.length],
                dash,
                offset: acc.length === 0 ? 0 : acc[acc.length - 1].offset + acc[acc.length - 1].dash,
            });
            return acc;
        },
        [] as Array<{ label: string; color: string; dash: number; offset: number }>,
    );

    return (
        <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-md p-5 overflow-hidden">
            <div className="text-lg font-semibold text-white">{title}</div>

            {total > 0 ? (
                <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-center">
                        <svg viewBox="0 0 220 220" className={compact ? 'h-48 w-48' : 'h-56 w-56'}>
                            <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
                            {segments.map((segment) => (
                                <circle
                                    key={segment.label}
                                    cx="110"
                                    cy="110"
                                    r={radius}
                                    fill="none"
                                    stroke={segment.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${segment.dash} ${circumference}`}
                                    strokeDashoffset={-segment.offset}
                                    transform="rotate(-90 110 110)"
                                    strokeLinecap="butt"
                                />
                            ))}
                            <circle cx="110" cy="110" r={radius - strokeWidth * 0.55} fill="#050816" opacity="0.96" />
                            <text x="110" y="106" textAnchor="middle" fill="white" fontSize="18" fontWeight="700">
                                {formatMKD(total)}
                            </text>
                            <text x="110" y="128" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="12">
                                inclusive spend
                            </text>
                        </svg>
                    </div>

                    <div className="space-y-2">
                        {slices.map((slice, index) => {
                            const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
                            return (
                                <div key={slice.label} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 min-w-0">
                                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-white">{slice.label}</div>
                                        <div className="text-xs text-white/45">{pct}% of total</div>
                                    </div>
                                    <div className="text-sm font-semibold text-white whitespace-nowrap">{formatMKD(slice.value)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/12 bg-white/5 px-4 py-8 text-center text-sm text-white/50">
                    {emptyMessage}
                </div>
            )}
        </div>
    );
}

function TrendZoomModal({
    trend,
    period,
    onClose,
}: {
    trend: AnalyticsTrendPoint[];
    period: 'month' | 'year' | 'range';
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="relative w-full max-w-[96vw] rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
                    <div className="text-lg font-semibold text-white">Spending trend</div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:text-white hover:bg-white/10"
                        aria-label="Close trend chart"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="max-h-[82vh] overflow-auto p-4">
                    <div className="min-w-[1400px]">
                        <TrendGraph trend={trend} period={period} zoomed />
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrendGraph({
    trend,
    period,
    zoomed = false,
}: {
    trend: AnalyticsTrendPoint[];
    period: 'month' | 'year' | 'range';
    zoomed?: boolean;
}) {
    const values = trend.map((point) => Number(point.spent));
    const max = Math.max(...values, 1);
    const height = zoomed ? 560 : 380;
    const width = Math.max(1200, trend.length * 82);
    const padX = zoomed ? 88 : 76;
    const padTop = zoomed ? 44 : 36;
    const padBottom = zoomed ? 96 : 80;
    const innerWidth = width - padX * 2;
    const innerHeight = height - padTop - padBottom;
    const step = trend.length > 1 ? innerWidth / (trend.length - 1) : 0;

    const linePoints = trend.map((point, index) => {
        const x = padX + index * step;
        const y = padTop + innerHeight - (Number(point.spent) / max) * innerHeight;
        return { x, y, label: point.label };
    });

    const linePath = linePoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
    const areaPath =
        linePoints.length > 0
            ? `${linePath} L ${linePoints[linePoints.length - 1].x} ${height - padBottom} L ${linePoints[0].x} ${height - padBottom} Z`
            : '';

    const tickCount = period === 'year' ? 6 : 8;
    const tickStep = Math.max(1, Math.ceil(Math.max(linePoints.length, 1) / tickCount));

    return (
        <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur-md p-5 overflow-hidden">
            <div className="mb-4 flex items-center justify-between gap-4">
                <div className="text-lg font-semibold text-white">Spending trend</div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
                <svg viewBox={`0 0 ${width} ${height}`} className="h-[520px] min-w-[1400px] w-full">
                    <defs>
                        <linearGradient id="trendFillZoom" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = padTop + innerHeight - innerHeight * ratio;
                        return (
                            <g key={ratio}>
                                <line x1={padX} x2={width - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="5 6" />
                                <text x={18} y={y + 5} fill="rgba(255,255,255,0.4)" fontSize="18">
                                    {formatAxisValue(max * ratio)}
                                </text>
                            </g>
                        );
                    })}

                    {areaPath && <path d={areaPath} fill="url(#trendFillZoom)" />}
                    {linePath && <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}

                    {linePoints.map((point) => (
                        <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="6" fill="#e0f2fe" stroke="#0284c7" strokeWidth="4" />
                    ))}

                    {linePoints.map((point, index) => {
                        if (index % tickStep !== 0 && index !== linePoints.length - 1) return null;
                        return (
                            <text key={`${point.label}-${index}`} x={point.x} y={height - 32} fill="rgba(255,255,255,0.45)" fontSize="16" textAnchor="middle">
                                {point.label}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

function toSlices(items: AnalyticsTagTotal[]) {
    return items.map((item) => ({
        label: item.tag_name,
        value: Number(item.spent),
    }));
}

function formatAxisValue(value: number) {
    if (value <= 0) {
        return '0';
    }

    if (value >= 1000) {
        return `${Math.round(value / 1000)}k`;
    }

    return String(Math.round(value));
}

function toDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForButton(value: string) {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}
