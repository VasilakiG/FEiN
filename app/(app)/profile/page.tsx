import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { poppins } from '@/app/ui/fonts';
import { ProfileUpdateForm, PasswordUpdateForm } from './profile-forms';

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    return (
        <div className="w-full px-6 pt-10 space-y-10">
            <h1
                className={`${poppins.className}
                    text-[40px]
                    leading-tight
                    tracking-tight
                    font-semibold
                    text-center
                    text-white
                `}
            >
                Profile
            </h1>

            <div className="max-w-md mx-auto space-y-8 pb-10">
                {/* Account Info */}
                <section className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6 space-y-5">
                    <ProfileUpdateForm
                        defaultName={session.user.name ?? ''}
                        defaultEmail={session.user.email ?? ''}
                    />
                </section>

                {/* Security */}
                <section className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6 space-y-5">
                    <PasswordUpdateForm />
                </section>

                {/* Logout */}
                <form
                    action={async () => {
                        'use server';
                        await signOut({ redirectTo: '/login' });
                    }}
                >
                    <button className="w-full bg-red-600/90 hover:bg-red-500 rounded-2xl py-3 text-white font-medium transition">
                        Logout
                    </button>
                </form>
            </div>
        </div>
    );
}
