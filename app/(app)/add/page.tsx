import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUserTransactionAccounts, getAllTags } from '@/app/lib/queries';
import AddPageClient from './add-page-client';

export default async function Page() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/add');
    }

    const userId = Number(session.user.id);
    if (!Number.isInteger(userId)) {
        redirect('/login?callbackUrl=/add');
    }

    const [accounts, allTags] = await Promise.all([
        getUserTransactionAccounts(userId),
        getAllTags(),
    ]);

    return <AddPageClient accounts={accounts} allTags={allTags} />;
}
