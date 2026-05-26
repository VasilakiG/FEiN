'use client';

import { useEffect, useState } from 'react';

const NAVIGATION_START_EVENT = 'fein:navigation-start';

export default function GlobalNavigationIndicator() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function onNavigationStart() {
            setVisible(true);
        }

        function onDocumentClick(event: MouseEvent) {
            if (event.defaultPrevented) return;
            const target = event.target as Element | null;
            if (!target) return;

            const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
            if (!anchor) return;
            if (anchor.target && anchor.target !== '_self') return;
            if (anchor.hasAttribute('download')) return;
            if (anchor.getAttribute('href')?.startsWith('#')) return;

            setVisible(true);
        }

        function onFormSubmit() {
            setVisible(true);
        }

        window.addEventListener(NAVIGATION_START_EVENT, onNavigationStart);
        document.addEventListener('click', onDocumentClick, true);
        document.addEventListener('submit', onFormSubmit, true);

        return () => {
            window.removeEventListener(NAVIGATION_START_EVENT, onNavigationStart);
            document.removeEventListener('click', onDocumentClick, true);
            document.removeEventListener('submit', onFormSubmit, true);
        };
    }, []);

    useEffect(() => {
        if (!visible) return;
        const timeoutId = window.setTimeout(() => setVisible(false), 1400);
        return () => clearTimeout(timeoutId);
    }, [visible]);

    if (!visible) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center backdrop-blur-[2px] bg-white/5">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white/90 shadow-[0_0_24px_rgba(255,255,255,0.25)]" />
        </div>
    );
}
