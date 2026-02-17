import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { poppins } from '@/app/ui/fonts';
import { getDashboardData } from '@/app/lib/queries';

function formatMKD(value: string | number) {
    let n = typeof value === 'number' ? value : Number(value);

    // Normalize -0 to 0
    if (Object.is(n, -0) || Math.abs(n) < 0.005) {
        n = 0;
    }

    const formatted = new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
    }).format(Math.abs(n));

    if (n < 0) {
        return `MKD -${formatted}`;
    }

    return `MKD ${formatted}`;
}


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
            <div className="mt-8 space-y-5">
                {data.accounts.map((acc) => (
                    <div
                        key={acc.transaction_account_id}
                        className="
                            rounded-2xl
                            px-6
                            py-6
                            bg-blue-600/20
                            border
                            border-white/10
                            backdrop-blur-md
                            shadow-lg
                        "
                    >
                        <div className="text-white text-2xl font-semibold">
                            {acc.account_name ?? 'Account'}
                        </div>
                        <div className="mt-3 text-white text-2xl font-semibold">
                            {formatMKD(acc.balance)}
                        </div>
                    </div>
                ))}
            </div>

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
