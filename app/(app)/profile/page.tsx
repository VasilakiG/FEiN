import { auth, signOut } from '@/auth';
import { redirect } from 'next/navigation';
import { poppins } from '@/app/ui/fonts';
import { updateProfile, updatePassword } from './actions';

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return (
        <div className="w-full px-6 pt-10 space-y-10">
            {/* Title */}
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

                    <form action={updateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-white/70 text-sm">Name</label>
                            <input
                                name="name"
                                defaultValue={session.user.name ?? ''}
                                required
                                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-white/70 text-sm">Email</label>
                            <input
                                name="email"
                                defaultValue={session.user.email ?? ''}
                                required
                                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <button className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-3 text-white font-medium transition">
                            Save Changes
                        </button>
                    </form>
                </section>

                {/* Security */}
                <section className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6 space-y-5">

                    <form action={updatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-white/70 text-sm">
                                Current Password
                            </label>
                            <input
                                type="password"
                                name="currentPassword"
                                required
                                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-white/70 text-sm">
                                New Password
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                required
                                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <button className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-3 text-white font-medium transition">
                            Update Password
                        </button>
                    </form>
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
