import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { poppins } from '@/app/ui/fonts';
import { getAnalyticsData } from '@/app/lib/queries';
import AnalyticsClient from './analytics-client';

export default async function Page(props: {
    searchParams?: Promise<{
        query?: string;
        accountId?: string;
        period?: string;
        startDate?: string;
        endDate?: string;
        focusTags?: string;
    }>;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/analytics');
    }

    const userId = Number(session.user.id);
    if (!Number.isInteger(userId)) {
        redirect('/login?callbackUrl=/analytics');
    }

    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';
    const accountId = searchParams?.accountId ? Number(searchParams.accountId) : undefined;
    const period = searchParams?.period === 'year' || searchParams?.period === 'range' ? searchParams.period : 'month';
    const startDate = searchParams?.startDate || undefined;
    const endDate = searchParams?.endDate || undefined;
    const focusTags = searchParams?.focusTags ? searchParams.focusTags.split(',').filter(Boolean) : [];

    const data = await getAnalyticsData({
        userId,
        query,
        accountId: Number.isInteger(accountId) ? accountId : undefined,
        period,
        startDate,
        endDate,
        focusTags,
    });

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
                Analytics
            </h1>

            <AnalyticsClient data={data} />
        </div>
    );
}
