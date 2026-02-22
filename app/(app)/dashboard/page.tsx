import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { poppins } from '@/app/ui/fonts';
import { getDashboardData } from '@/app/lib/queries';
import { formatMKD } from '@/app/lib/utils';
import AccountsSection from './accounts-section';


export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/dashboard');
    }

    const userId = Number(session.user.id);
    if (!Number.isInteger(userId)) {
        redirect('/login?callbackUrl=/dashboard');
    }

    const data = await getDashboardData(userId);

    const displayName = session.user.name ?? 'Account name';

    return (
        <div className="w-full px-6 pt-10 pb-10">
            {/* Header name */}
            <h1
                className={`${poppins.className}
                    text-[44px]
                    leading-tight
                    tracking-tight
                    font-semibold
                    text-white
                `}
            >
                {displayName}
            </h1>

            {/* Total balance */}
            <div className="mt-10">
                <div className="text-white/80 text-xl font-semibold">Total Balance</div>
                <div
                    className={`${poppins.className}
                        mt-3
                        text-[40px]
                        leading-tight
                        tracking-tight
                        font-semibold
                        text-white
                    `}
                >
                    {formatMKD(data.totalBalance)}
                </div>
            </div>

            {/* Accounts (stacked cards like screenshot) */}
            <AccountsSection userId={userId} accounts={data.accounts} />

            {/* Quick analytics cards */}
            <div className="mt-8 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-purple-700/45 border border-white/10 backdrop-blur-md px-3 py-4">
                    <div className="text-white text-sm font-semibold leading-tight">
                        Daily budget
                        <br />
                        until end of
                        <br />
                        month
                    </div>
                    <div className="mt-4 text-white text-lg font-semibold">
                        {formatMKD(data.dailyBudgetUntilEndOfMonth)}
                    </div>
                </div>

                <div className="rounded-xl bg-purple-700/45 border border-white/10 backdrop-blur-md px-3 py-4">
                    <div className="text-white text-sm font-semibold leading-tight">
                        Three day
                        <br />
                        spending
                        <br />
                        average
                    </div>
                    <div className="mt-4 text-white text-lg font-semibold">
                        {formatMKD(data.threeDaySpendingAvg)}
                    </div>
                </div>

                <div className="rounded-xl bg-purple-700/45 border border-white/10 backdrop-blur-md px-3 py-4">
                    <div className="text-white text-sm font-semibold leading-tight">
                        Daily
                        <br />
                        spending
                        <br />
                        average
                    </div>
                    <div className="mt-4 text-white text-lg font-semibold">
                        {formatMKD(data.dailySpendingAvgMonthToDate)}
                    </div>
                </div>
            </div>

            {/* Transaction history */}
            <div className="mt-10">
                <div className="text-white text-2xl font-semibold">Transaction History</div>

                <div className="mt-4 space-y-4">
                    {data.recentTransactions.length === 0 ? (
                        <div className="text-white/60 text-sm">
                            No transactions yet.
                        </div>
                    ) : (
                        data.recentTransactions.map((tx) => {
                            const net = Number(tx.net_amount);
                            const isNegative = net < 0;

                            return (
                                <div
                                    key={tx.transaction_id}
                                    className="
                                        rounded-2xl
                                        px-5
                                        py-4
                                        bg-black/30
                                        border border-white/10
                                        backdrop-blur-md
                                        flex
                                        items-center
                                        justify-between
                                    "
                                >
                                    <div>
                                        <div className="text-white text-lg font-semibold">
                                            {tx.transaction_name ?? 'Transaction'}
                                        </div>
                                        <div className="text-white/50 text-sm">
                                            {tx.primary_tag ?? ''}
                                        </div>
                                    </div>

                                    <div
                                        className={`text-xl font-semibold ${isNegative ? 'text-amber-400' : 'text-emerald-300'
                                            }`}
                                    >
                                        {formatMKD(net)}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
