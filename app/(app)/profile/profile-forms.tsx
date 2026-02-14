'use client';

import React from 'react';
import { updateProfile, updatePassword } from './actions';

function ErrorLine({ error }: { error?: string }) {
    if (!error) {
        return null;
    }
    return <p className="text-red-400 text-sm">{error}</p>;
}

export function ProfileUpdateForm({
    defaultName,
    defaultEmail,
}: {
    defaultName: string;
    defaultEmail: string;
}) {
    const [error, action, pending] = React.useActionState<string | undefined, FormData>(
        updateProfile,
        undefined
    );

    return (
        <form action={action} className="space-y-4">
            <div className="space-y-2">
                <label className="text-white/70 text-sm">Name</label>
                <input
                    name="name"
                    defaultValue={defaultName}
                    required
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-white/70 text-sm">Email</label>
                <input
                    name="email"
                    defaultValue={defaultEmail}
                    required
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <ErrorLine error={error} />

            <button
                disabled={pending}
                className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-3 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {pending ? 'Saving…' : 'Save Changes'}
            </button>
        </form>
    );
}

export function PasswordUpdateForm() {
    const [error, action, pending] = React.useActionState<string | undefined, FormData>(
        updatePassword,
        undefined
    );

    return (
        <form action={action} className="space-y-4">
            <div className="space-y-2">
                <label className="text-white/70 text-sm">Current Password</label>
                <input
                    type="password"
                    name="currentPassword"
                    required
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-white/70 text-sm">New Password</label>
                <input
                    type="password"
                    name="newPassword"
                    required
                    minLength={6}
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <ErrorLine error={error} />

            <button
                disabled={pending}
                className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-3 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {pending ? 'Updating…' : 'Update Password'}
            </button>
        </form>
    );
}
