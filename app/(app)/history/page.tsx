import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { poppins } from '@/app/ui/fonts';
import {
    getHistoryTransactions,
    getHistoryTransactionPages,
    getUserTransactionAccounts,
    getUserTagsForHistory,
} from '@/app/lib/queries';
import Search from './search';
import AccountFilter from './account-filter';
import TagFilter from './tag-filter';
import TransactionList from './transaction-list';
import Pagination from './pagination';

export default async function HistoryPage(props: {
    searchParams?: Promise<{
        query?: string;
        accountId?: string;
        tags?: string;
        page?: string;
    }>;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/history');
    }

    const userId = Number(session.user.id);
    if (!Number.isInteger(userId)) {
        redirect('/login?callbackUrl=/history');
    }

    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    const accountId = searchParams?.accountId
        ? Number(searchParams.accountId)
        : undefined;
    const selectedTags = searchParams?.tags
        ? searchParams.tags.split(',').filter(Boolean)
        : [];
    const currentPage = Number(searchParams?.page) || 1;

    const [transactions, totalPages, accounts, allTags] = await Promise.all([
        getHistoryTransactions({ userId, accountId, query, tags: selectedTags, page: currentPage }),
        getHistoryTransactionPages({ userId, accountId, query, tags: selectedTags }),
        getUserTransactionAccounts(userId),
        getUserTagsForHistory(userId),
    ]);

    return (
        <div className="w-full px-6 pt-10 pb-10">
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
                History
            </h1>

            <div className="mt-8 flex flex-col gap-3">
                <div className="flex gap-2 items-center">
                    <div className="flex-1 min-w-0">
                        <Suspense fallback={null}>
                            <Search placeholder="Name, tag, or account…" />
                        </Suspense>
                    </div>
                    <Suspense fallback={null}>
                        <AccountFilter accounts={accounts} />
                    </Suspense>
                </div>

                <Suspense fallback={null}>
                    <TagFilter tags={allTags} />
                </Suspense>
            </div>

            <TransactionList transactions={transactions} />

            <Suspense fallback={null}>
                <Pagination totalPages={totalPages} />
            </Suspense>
        </div>
    );
}
