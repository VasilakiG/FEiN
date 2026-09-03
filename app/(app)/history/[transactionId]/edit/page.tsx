import { auth } from '@/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { poppins } from '@/app/ui/fonts';
import { getAllTags, getHistoryTransactionEditData, getUserTransactionAccounts } from '@/app/lib/queries';
import AddTransactionForm, { type Breakdown } from '@/app/(app)/add/add-transaction-form';
import { updateHistoryTransaction } from '../../actions';

export default async function EditTransactionPage(props: {
    params: Promise<{ transactionId: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/history');
    }

    const userId = Number(session.user.id);
    if (!Number.isInteger(userId)) {
        redirect('/login?callbackUrl=/history');
    }

    const params = await props.params;
    const transactionId = Number(params.transactionId);
    if (!Number.isInteger(transactionId)) {
        redirect('/history');
    }

    const [transaction, accounts, allTags] = await Promise.all([
        getHistoryTransactionEditData({ userId, transactionId }),
        getUserTransactionAccounts(userId),
        getAllTags(),
    ]);
    if (!transaction) {
        notFound();
    }

    const tags = Array.isArray(transaction.tags)
        ? Array.from(new Set(transaction.tags.filter(Boolean).map((tag) => tag.trim().toLowerCase())))
        : [];
    const note = tags.find((tag) => tag.startsWith('__note:'))?.slice('__note:'.length) ?? '';
    const selectedTags = tags.filter((tag) => !tag.startsWith('__note:'));

    const initialBreakdowns: Breakdown[] = transaction.breakdowns.map((breakdown, index) => ({
        id: breakdown.transaction_breakdown_id || index + 1,
        type: Number(breakdown.earned_amount) > 0 ? 'to' : 'from',
        accountId: breakdown.transaction_account_id,
        amount: String(Number(breakdown.earned_amount) > 0 ? breakdown.earned_amount : breakdown.spent_amount),
    }));

    return (
        <div className="w-full overflow-hidden px-6 pt-10 pb-10">
            <div className="max-w-2xl mx-auto">
                <Link
                    href="/history"
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
                Edit transaction
            </h1>

            <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-white/5 border border-white/10 p-5">
                <AddTransactionForm
                    accounts={accounts}
                    allTags={allTags}
                    action={updateHistoryTransaction}
                    transactionId={transaction.transaction_id}
                    initialName={transaction.transaction_name ?? ''}
                    initialDate={transaction.date.slice(0, 10)}
                    initialAmount={transaction.amount}
                    initialBreakdowns={initialBreakdowns}
                    initialSelectedTags={selectedTags}
                    initialNote={note}
                    submitLabel="Save changes"
                    pendingLabel="Saving…"
                    resetOnSuccess={false}
                />
            </div>
        </div>
    );
}