import { sql } from './db';

export type DashboardAccount = {
    transaction_account_id: number;
    account_name: string | null;
    balance: string; // DECIMAL comes as string
};

export type DashboardTransaction = {
    transaction_id: number;
    transaction_name: string | null;
    date: string; // timestamptz as ISO-ish string
    net_amount: string; // signed: earned - spent
    primary_tag: string | null;
};

export type DashboardData = {
    totalBalance: string; // DECIMAL -> string
    accounts: DashboardAccount[];

    // Quick analytics cards
    dailyBudgetUntilEndOfMonth: string; // DECIMAL -> string
    threeDaySpendingAvg: string; // DECIMAL -> string (spend only, positive)
    dailySpendingAvgMonthToDate: string; // DECIMAL -> string (spend only, positive)

    recentTransactions: DashboardTransaction[];
};

export type TransactionAccountLite = {
    transaction_account_id: number;
    account_name: string | null;
};

export type HistoryTransaction = {
    transaction_id: number;
    transaction_name: string | null;
    date: string; // ISO from PG
    net_amount: string; // numeric comes as string via postgres.js
    tags: string[]; // aggregated
};

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export async function getDashboardData(userId: number): Promise<DashboardData> {
    const now = new Date();
    const som = startOfMonth(now);
    const eom = endOfMonth(now);

    // Days remaining including today (budget "until end of month")
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDayStart = new Date(eom.getFullYear(), eom.getMonth(), eom.getDate());
    const daysLeft =
        Math.max(
            1,
            Math.round((lastDayStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        );

    // Days passed including today (month-to-date average)
    const daysPassed = Math.max(1, now.getDate());

    // Accounts + total balance
    const accounts = await sql<DashboardAccount[]>`
        SELECT
        transaction_account_id,
        account_name,
        balance
        FROM transaction_account
        WHERE user_id = ${userId}
        ORDER BY transaction_account_id ASC
    `;

    const totalBalanceRow = await sql<{ total: string | null }[]>`
        SELECT COALESCE(SUM(balance), 0)::numeric(12,2) AS total
        FROM transaction_account
        WHERE user_id = ${userId}
    `;
    const totalBalance = totalBalanceRow[0]?.total ?? '0.00';

    // Month spend total (spent_amount only) scoped to user via accounts
    const monthSpendRow = await sql<{ spent: string | null }[]>`
        SELECT COALESCE(SUM(tb.spent_amount), 0)::numeric(12,2) AS spent
        FROM transaction_breakdown tb
        JOIN transaction_account ta ON ta.transaction_account_id = tb.transaction_account_id
        JOIN transaction t ON t.transaction_id = tb.transaction_id
        WHERE ta.user_id = ${userId}
        AND t.date >= ${som.toISOString()}
        AND t.date <= ${eom.toISOString()}
    `;
    const monthSpent = monthSpendRow[0]?.spent ?? '0.00';

    // Last 3 calendar days spend (including today)
    const threeDaysAgoStart = new Date(todayStart);
    threeDaysAgoStart.setDate(threeDaysAgoStart.getDate() - 2); // today + previous 2 days
    const threeDaySpendRow = await sql<{ spent: string | null }[]>`
    SELECT COALESCE(SUM(tb.spent_amount), 0)::numeric(12,2) AS spent
    FROM transaction_breakdown tb
    JOIN transaction_account ta ON ta.transaction_account_id = tb.transaction_account_id
    JOIN transaction t ON t.transaction_id = tb.transaction_id
    WHERE ta.user_id = ${userId}
      AND t.date >= ${threeDaysAgoStart.toISOString()}
      AND t.date <= ${now.toISOString()}
  `;
    const threeDaySpent = threeDaySpendRow[0]?.spent ?? '0.00';

    // Compute quick cards in JS (still DECIMAL-safe enough for display)
    const totalBalanceNum = Number(totalBalance);
    const monthSpentNum = Number(monthSpent);
    const threeDaySpentNum = Number(threeDaySpent);

    const dailyBudgetUntilEndOfMonth = (totalBalanceNum / daysLeft).toFixed(2);
    const threeDaySpendingAvg = (threeDaySpentNum / 3).toFixed(2);
    const dailySpendingAvgMonthToDate = (monthSpentNum / daysPassed).toFixed(2);

    // Recent transactions (scoped via breakdown -> account user)
    // net_amount = SUM(earned) - SUM(spent) for that user’s breakdown rows
    // primary_tag = first tag_name (alphabetical) if exists
    const recentTransactions = await sql<DashboardTransaction[]>`
        WITH tx AS (
        SELECT
            t.transaction_id,
            t.transaction_name,
            t.date,
            (COALESCE(SUM(tb.earned_amount), 0) - COALESCE(SUM(tb.spent_amount), 0))::numeric(12,2) AS net_amount
        FROM transaction t
        JOIN transaction_breakdown tb ON tb.transaction_id = t.transaction_id
        JOIN transaction_account ta ON ta.transaction_account_id = tb.transaction_account_id
        WHERE ta.user_id = ${userId}
        GROUP BY t.transaction_id, t.transaction_name, t.date
        ORDER BY t.date DESC
        LIMIT 6
        ),
        tag_one AS (
        SELECT
            tat.transaction_id,
            MIN(tag.tag_name) AS primary_tag
        FROM tag_assigned_to_transaction tat
        JOIN tag ON tag.tag_id = tat.tag_id
        WHERE tag.tag_name NOT LIKE '__note:%'
        GROUP BY tat.transaction_id
        )
        SELECT
        tx.transaction_id,
        tx.transaction_name,
        tx.date,
        tx.net_amount::text AS net_amount,
        tag_one.primary_tag
        FROM tx
        LEFT JOIN tag_one ON tag_one.transaction_id = tx.transaction_id
        ORDER BY tx.date DESC
    `;

    return {
        totalBalance,
        accounts,
        dailyBudgetUntilEndOfMonth,
        threeDaySpendingAvg,
        dailySpendingAvgMonthToDate,
        recentTransactions,
    };
}

export async function getUserTransactionAccounts(userId: number) {
    const rows = await sql<TransactionAccountLite[]>`
        SELECT
            ta.transaction_account_id,
            ta.account_name
        FROM transaction_account ta
        WHERE ta.user_id = ${userId}
        ORDER BY ta.transaction_account_id ASC
    `;
    return rows;
}

export async function getUserTagsForHistory(userId: number) {
    // Only tags that appear in user's transactions (through breakdown -> account -> user)
    const rows = await sql<{ tag_name: string }[]>`
        SELECT DISTINCT tg.tag_name
        FROM tag tg
        JOIN tag_assigned_to_transaction tat ON tat.tag_id = tg.tag_id
        JOIN transaction t ON t.transaction_id = tat.transaction_id
        JOIN transaction_breakdown tb ON tb.transaction_id = t.transaction_id
        JOIN transaction_account ta ON ta.transaction_account_id = tb.transaction_account_id
        WHERE ta.user_id = ${userId}
          AND tg.tag_name NOT LIKE '__note:%'
        ORDER BY tg.tag_name ASC
    `;
    return rows.map((r) => r.tag_name);
}

export async function getAllTags() {
    const rows = await sql<{ tag_id: number; tag_name: string }[]>`
        SELECT tag_id, tag_name
        FROM tag
        WHERE tag_name NOT LIKE '__note:%'
        ORDER BY tag_name ASC
    `;
    return rows;
}

export const HISTORY_ITEMS_PER_PAGE = 10;

export async function getHistoryTransactions(params: {
    userId: number;
    accountId?: number;
    query?: string; // searches transaction_name, tag_name, account_name
    tags?: string[]; // intersection: transaction must have ALL of these tags
    page?: number;
}) {
    const { userId, accountId, query, tags, page = 1 } = params;
    const offset = (page - 1) * HISTORY_ITEMS_PER_PAGE;
    const searchPattern = query ? `%${query}%` : null;
    const tagFilter = tags && tags.length > 0 ? tags : null;
    const tagCount = tagFilter ? tagFilter.length : 0;

    const rows = await sql<HistoryTransaction[]>`
        WITH filtered_tx AS (
            SELECT
                t.transaction_id,
                t.transaction_name,
                t.date,
                (
                    COALESCE(SUM(COALESCE(tb.earned_amount, 0)), 0)
                    -
                    COALESCE(SUM(COALESCE(tb.spent_amount, 0)), 0)
                )::text AS net_amount
            FROM transaction t
            JOIN transaction_breakdown tb ON tb.transaction_id = t.transaction_id
            JOIN transaction_account ta ON ta.transaction_account_id = tb.transaction_account_id
            WHERE ta.user_id = ${userId}
                AND (${accountId ?? null}::int IS NULL OR tb.transaction_account_id = ${accountId ?? null})
                AND (
                    ${searchPattern}::text IS NULL
                    OR t.transaction_name ILIKE ${searchPattern}
                    OR ta.account_name ILIKE ${searchPattern}
                    OR EXISTS (
                        SELECT 1
                        FROM tag_assigned_to_transaction tat2
                        JOIN tag tg2 ON tg2.tag_id = tat2.tag_id
                        WHERE tat2.transaction_id = t.transaction_id
                            AND tg2.tag_name ILIKE ${searchPattern}
                    )
                )
                AND (
                    ${tagCount}::int = 0
                    OR (
                        SELECT COUNT(DISTINCT tg_f.tag_name)
                        FROM tag_assigned_to_transaction tat_f
                        JOIN tag tg_f ON tg_f.tag_id = tat_f.tag_id
                        WHERE tat_f.transaction_id = t.transaction_id
                            AND tg_f.tag_name = ANY(${tagFilter ?? []}::text[])
                    ) = ${tagCount}
                )
            GROUP BY t.transaction_id
            ORDER BY t.date DESC
            LIMIT ${HISTORY_ITEMS_PER_PAGE}
            OFFSET ${offset}
        )
        SELECT
            ft.transaction_id,
            ft.transaction_name,
            ft.date::text AS date,
            ft.net_amount,
            COALESCE(
                ARRAY_REMOVE(ARRAY_AGG(DISTINCT tg.tag_name), NULL),
                ARRAY[]::text[]
            ) AS tags
        FROM filtered_tx ft
        LEFT JOIN tag_assigned_to_transaction tat ON tat.transaction_id = ft.transaction_id
        LEFT JOIN tag tg ON tg.tag_id = tat.tag_id
        GROUP BY ft.transaction_id, ft.transaction_name, ft.date, ft.net_amount
        ORDER BY ft.date DESC
    `;

    return rows;
}

export async function getHistoryTransactionPages(params: {
    userId: number;
    accountId?: number;
    query?: string;
    tags?: string[];
}) {
    const { userId, accountId, query, tags } = params;
    const searchPattern = query ? `%${query}%` : null;
    const tagFilter = tags && tags.length > 0 ? tags : null;
    const tagCount = tagFilter ? tagFilter.length : 0;

    const countResult = await sql<{ count: string }[]>`
        SELECT COUNT(DISTINCT t.transaction_id)::text AS count
        FROM transaction t
        JOIN transaction_breakdown tb ON tb.transaction_id = t.transaction_id
        JOIN transaction_account ta ON ta.transaction_account_id = tb.transaction_account_id
        LEFT JOIN tag_assigned_to_transaction tat ON tat.transaction_id = t.transaction_id
        LEFT JOIN tag tg ON tg.tag_id = tat.tag_id
        WHERE ta.user_id = ${userId}
            AND (${accountId ?? null}::int IS NULL OR tb.transaction_account_id = ${accountId ?? null})
            AND (
                ${searchPattern}::text IS NULL
                OR t.transaction_name ILIKE ${searchPattern}
                OR ta.account_name ILIKE ${searchPattern}
                OR EXISTS (
                    SELECT 1
                    FROM tag_assigned_to_transaction tat2
                    JOIN tag tg2 ON tg2.tag_id = tat2.tag_id
                    WHERE tat2.transaction_id = t.transaction_id
                        AND tg2.tag_name ILIKE ${searchPattern}
                )
            )
            AND (
                ${tagCount}::int = 0
                OR (
                    SELECT COUNT(DISTINCT tg_f.tag_name)
                    FROM tag_assigned_to_transaction tat_f
                    JOIN tag tg_f ON tg_f.tag_id = tat_f.tag_id
                    WHERE tat_f.transaction_id = t.transaction_id
                        AND tg_f.tag_name = ANY(${tagFilter ?? []}::text[])
                ) = ${tagCount}
            )
    `;

    const totalCount = Number(countResult[0]?.count ?? '0');
    return Math.ceil(totalCount / HISTORY_ITEMS_PER_PAGE);
}
