import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { poppins } from '@/app/ui/fonts';
import { ProfileUpdateForm, PasswordUpdateForm } from '../profile-forms';
import Link from 'next/link';


export default async function EditProfilePage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/login');
    }

    return (
        <div className="w-full px-6 pt-10 space-y-10 pb-10">

            {/* Back */}
            <div className="max-w-md mx-auto">
                <Link
                    href="/profile"
                    className="inline-flex items-center text-white/60 hover:text-white/80 transition"
                >
                    <span className={`${poppins.className} text-sm`}>← Back</span>
                </Link>
            </div>

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
                Edit profile
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
            </div>
        </div>
    );
}
