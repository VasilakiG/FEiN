'use server';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { sql } from '@/app/lib/db';
import { revalidatePath } from 'next/cache';

// ─── Shared helpers ────────────────────────────────────────────

export type ActionState = {
    error?: string;
    success?: string;
} | undefined;

async function requireUserId(): Promise<number> {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login');
    }
    const userId = Number(session.user.id);
    if (!Number.isInteger(userId)) {
        redirect('/login');
    }
    return userId;
}

// ─── Add Transaction Account ───────────────────────────────────

export async function addTransactionAccount(
    _prev: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const userId = await requireUserId();

    const name = String(formData.get('name') ?? '').trim();
    const balanceRaw = String(formData.get('balance') ?? '0').trim();

    if (!name) {
        return { error: 'Account name is required.' };
    }

    const balance = Number(balanceRaw);
    if (Number.isNaN(balance)) {
        return { error: 'Balance must be a number.' };
    }

    try {
        await sql`
            INSERT INTO transaction_account (account_name, balance, user_id)
            VALUES (${name}, ${balance}, ${userId})
        `;
    } catch {
        return { error: 'Failed to create account.' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/add');
    return { success: `Account "${name}" created.` };
}

// ─── Add Tag ───────────────────────────────────────────────────

export async function addTag(
    _prev: ActionState,
    formData: FormData,
): Promise<ActionState> {
    await requireUserId(); // auth guard only

    const name = String(formData.get('name') ?? '').trim().toLowerCase();

    if (!name) {
        return { error: 'Tag name is required.' };
    }
    if (name.startsWith('__note:')) {
        return { error: 'Reserved tag prefix.' };
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await sql.begin(async (tx: any) => {
            // Check duplicate (case-insensitive)
            const existing = await tx`
                SELECT tag_id FROM tag WHERE LOWER(tag_name) = ${name}
            `;
            if (existing.length > 0) {
                throw new Error(`Tag "${name}" already exists.`);
            }

            await tx`INSERT INTO tag (tag_name) VALUES (${name})`;
        });
    } catch (e: any) {
        if (e instanceof Error && e.message.includes('already exists')) {
            return { error: e.message };
        }
        return { error: 'Failed to create tag.' };
    }

    revalidatePath('/add');
    return { success: `Tag "${name}" created.` };
}

// ─── Add Transaction ───────────────────────────────────────────

type BreakdownInput = {
    type: 'from' | 'to';
    accountId: number;
    amount: number;
};

export async function addTransaction(
    _prev: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const userId = await requireUserId();

    const name = String(formData.get('name') ?? '').trim();
    const date = String(formData.get('date') ?? '').trim();
    const amountRaw = String(formData.get('amount') ?? '').trim();
    const tagsJson = String(formData.get('tags') ?? '[]');
    const pendingTag = String(formData.get('pendingTag') ?? '').trim().toLowerCase();
    const note = String(formData.get('note') ?? '').trim();
    const breakdownsJson = String(formData.get('breakdowns') ?? '[]');

    // ── Validation ──
    if (!name) {
        return { error: 'Transaction name is required.' };
    }
    if (!date) {
        return { error: 'Date is required.' };
    }

    const amount = Number(amountRaw);
    if (!amountRaw || Number.isNaN(amount)) {
        return { error: 'Amount must be a number.' };
    }

    let tags: string[];
    try {
        tags = JSON.parse(tagsJson);
        if (!Array.isArray(tags)) {
            throw new Error();
        }
    } catch {
        return { error: 'Invalid tags data.' };
    }

    // Include any tag the user typed but didn't press Enter for
    if (pendingTag && !pendingTag.startsWith('__note:') && !tags.includes(pendingTag)) {
        tags.push(pendingTag);
    }

    let breakdowns: BreakdownInput[];
    try {
        breakdowns = JSON.parse(breakdownsJson);
        if (!Array.isArray(breakdowns)) {
            throw new Error();
        }
    } catch {
        return { error: 'Invalid breakdowns data.' };
    }

    // Validate each breakdown
    for (const breakdown of breakdowns) {
        if (!['from', 'to'].includes(breakdown.type)) {
            return { error: 'Invalid breakdown type.' };
        }
        if (!Number.isFinite(breakdown.amount) || breakdown.amount <= 0) {
            return { error: 'Breakdown amounts must be positive.' };
        }
        if (!Number.isInteger(breakdown.accountId)) {
            return { error: 'Invalid account in breakdown.' };
        }
    }

    // Verify all accounts belong to this user
    if (breakdowns.length > 0) {
        const accountIds = [...new Set(breakdowns.map((b) => b.accountId))];
        const ownedAccounts = await sql`
            SELECT transaction_account_id
            FROM transaction_account
            WHERE user_id = ${userId}
              AND transaction_account_id = ANY(${accountIds}::int[])
        `;
        if (ownedAccounts.length !== accountIds.length) {
            return { error: 'One or more accounts do not belong to you.' };
        }
    }

    // Compute net_amount from breakdowns
    let totalEarned = 0;
    let totalSpent = 0;
    for (const breakdown of breakdowns) {
        if (breakdown.type === 'to') {
            totalEarned += breakdown.amount;
        }
        else {
            totalSpent += breakdown.amount;
        }
    }
    const netAmount = totalEarned - totalSpent;

    try {
        // Use a SQL transaction for atomicity
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await sql.begin(async (tx: any) => {
            // 1. Insert transaction
            const [txRow] = await tx`
                INSERT INTO transaction (transaction_name, amount, net_amount, date)
                VALUES (${name}, ${amount}, ${netAmount}, ${date})
                RETURNING transaction_id
            `;
            const transactionId: number = txRow.transaction_id;

            // 2. Insert breakdowns
            for (const breakdown of breakdowns) {
                const spent = breakdown.type === 'from' ? breakdown.amount : 0;
                const earned = breakdown.type === 'to' ? breakdown.amount : 0;

                await tx`
                    INSERT INTO transaction_breakdown
                        (transaction_id, transaction_account_id, spent_amount, earned_amount)
                    VALUES (${transactionId}, ${breakdown.accountId}, ${spent}, ${earned})
                `;
            }

            // 3. Handle tags
            for (const tagName of tags) {
                const trimmed = tagName.trim().toLowerCase();
                if (!trimmed || trimmed.startsWith('__note:')) {
                    continue;
                }

                // Find or insert tag
                const existing = await tx`
                    SELECT tag_id FROM tag WHERE LOWER(tag_name) = ${trimmed}
                `;
                let tagId: number;
                if (existing.length > 0) {
                    tagId = existing[0].tag_id;
                } else {
                    const [inserted] = await tx`
                        INSERT INTO tag (tag_name) VALUES (${trimmed})
                        RETURNING tag_id
                    `;
                    tagId = inserted.tag_id;
                }

                // Check if assignment already exists
                const existingAssignment = await tx`
                    SELECT tag_assigned_to_transaction_id
                    FROM tag_assigned_to_transaction
                    WHERE transaction_id = ${transactionId} AND tag_id = ${tagId}
                `;
                if (existingAssignment.length === 0) {
                    await tx`
                        INSERT INTO tag_assigned_to_transaction (transaction_id, tag_id)
                        VALUES (${transactionId}, ${tagId})
                    `;
                }
            }

            // 4. Handle note as a special __note: tag
            if (note) {
                const noteTagName = `__note:${note}`;

                const existingNote = await tx`
                    SELECT tag_id FROM tag WHERE tag_name = ${noteTagName}
                `;
                let noteTagId: number;
                if (existingNote.length > 0) {
                    noteTagId = existingNote[0].tag_id;
                } else {
                    const [inserted] = await tx`
                        INSERT INTO tag (tag_name) VALUES (${noteTagName})
                        RETURNING tag_id
                    `;
                    noteTagId = inserted.tag_id;
                }

                await tx`
                    INSERT INTO tag_assigned_to_transaction (transaction_id, tag_id)
                    VALUES (${transactionId}, ${noteTagId})
                `;
            }
        });
    } catch (e) {
        console.error('addTransaction error:', e);
        return { error: 'Failed to create transaction.' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/history');
    revalidatePath('/add');
    return { success: `Transaction "${name}" created.` };
}
