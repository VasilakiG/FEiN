'use server';

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql } from '@/app/lib/db';
import type { ActionState } from '../add/actions';

type BreakdownInput = {
    type: 'from' | 'to';
    accountId: number;
    amount: number;
};

async function requireUserId(): Promise<number> {
    const session = await auth();
    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/history');
    }

    const userId = Number(session.user.id);
    if (!Number.isInteger(userId)) {
        redirect('/login?callbackUrl=/history');
    }

    return userId;
}

function parseTagPayload(rawTagsJson: string, rawNote: string) {
    let tags: string[];

    try {
        const parsed = JSON.parse(rawTagsJson);
        tags = Array.isArray(parsed) ? parsed : [];
    } catch {
        tags = [];
    }

    const normalized = tags
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean)
        .filter((tag) => !tag.startsWith('__note:'));

    const note = rawNote.trim();
    if (note) {
        normalized.push(`__note:${note}`);
    }

    return Array.from(new Set(normalized));
}

function parseBreakdowns(rawBreakdownsJson: string) {
    try {
        const parsed = JSON.parse(rawBreakdownsJson);
        if (!Array.isArray(parsed)) {
            return null;
        }

        const breakdowns = parsed.map((entry) => ({
            type: String(entry.type) as BreakdownInput['type'],
            accountId: Number(entry.accountId),
            amount: Number(entry.amount),
        }));

        return breakdowns;
    } catch {
        return null;
    }
}

function breakdownsMatch(
    existingBreakdowns: Array<{
        transaction_account_id: number;
        spent_amount: string;
        earned_amount: string;
    }>,
    nextBreakdowns: BreakdownInput[],
) {
    if (existingBreakdowns.length !== nextBreakdowns.length) {
        return false;
    }

    for (let index = 0; index < existingBreakdowns.length; index += 1) {
        const existing = existingBreakdowns[index];
        const next = nextBreakdowns[index];
        const existingType = Number(existing.earned_amount) > 0 ? 'to' : 'from';
        const existingAmount = Number(existing.earned_amount) > 0
            ? Number(existing.earned_amount)
            : Number(existing.spent_amount);

        if (
            existing.transaction_account_id !== next.accountId ||
            existingType !== next.type ||
            existingAmount !== next.amount
        ) {
            return false;
        }
    }

    return true;
}

export async function deleteHistoryTransaction(formData: FormData) {
    const userId = await requireUserId();
    const transactionId = Number(formData.get('transactionId'));

    if (!Number.isInteger(transactionId)) {
        redirect('/history');
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await sql.begin(async (tx: any) => {
            const ownership = await tx`
                SELECT t.transaction_id
                FROM transaction t
                JOIN transaction_breakdown tb ON tb.transaction_id = t.transaction_id
                JOIN transaction_account ta ON ta.transaction_account_id = tb.transaction_account_id
                WHERE t.transaction_id = ${transactionId}
                    AND ta.user_id = ${userId}
                LIMIT 1
            `;

            if (ownership.length === 0) {
                throw new Error('Transaction not found.');
            }

            await tx`
                DELETE FROM transaction_breakdown
                WHERE transaction_id = ${transactionId}
            `;
        });
    } catch {
        redirect('/history');
    }

    revalidatePath('/history');
    revalidatePath('/dashboard');
    redirect('/history');
}

export async function updateHistoryTransaction(
    _prev: ActionState,
    formData: FormData,
): Promise<ActionState> {
    const userId = await requireUserId();
    const transactionId = Number(formData.get('transactionId'));
    const name = String(formData.get('name') ?? '').trim();
    const date = String(formData.get('date') ?? '').trim();
    const amountRaw = String(formData.get('amount') ?? '').trim();
    const tagsJson = String(formData.get('tags') ?? '[]');
    const pendingTag = String(formData.get('pendingTag') ?? '').trim().toLowerCase();
    const note = String(formData.get('note') ?? '').trim();
    const breakdownsJson = String(formData.get('breakdowns') ?? '[]');

    if (!Number.isInteger(transactionId)) {
        return { error: 'Invalid transaction.' };
    }
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

    const tags = parseTagPayload(tagsJson, note);
    if (pendingTag && !pendingTag.startsWith('__note:') && !tags.includes(pendingTag)) {
        tags.push(pendingTag);
    }

    const breakdowns = parseBreakdowns(breakdownsJson);
    if (!breakdowns) {
        return { error: 'Invalid breakdowns data.' };
    }
    if (breakdowns.length === 0) {
        return { error: 'At least one breakdown is required.' };
    }

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

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await sql.begin(async (tx: any) => {
            const transactionRows = await tx`
                SELECT t.transaction_id
                FROM transaction t
                JOIN transaction_breakdown tb ON tb.transaction_id = t.transaction_id
                JOIN transaction_account ta ON ta.transaction_account_id = tb.transaction_account_id
                WHERE t.transaction_id = ${transactionId}
                    AND ta.user_id = ${userId}
                LIMIT 1
            `;

            if (transactionRows.length === 0) {
                throw new Error('Transaction not found.');
            }

            const existingBreakdowns = await tx`
                SELECT transaction_breakdown_id, transaction_account_id, spent_amount, earned_amount
                FROM transaction_breakdown
                WHERE transaction_id = ${transactionId}
                ORDER BY transaction_breakdown_id ASC
            `;

            const breakdownsUnchanged = breakdownsMatch(existingBreakdowns, breakdowns);

            const accountIds = [...new Set(breakdowns.map((b) => b.accountId))];
            if (accountIds.length > 0) {
                const ownedAccounts = await tx`
                    SELECT transaction_account_id
                    FROM transaction_account
                    WHERE user_id = ${userId}
                      AND transaction_account_id = ANY(${accountIds}::int[])
                `;
                if (ownedAccounts.length !== accountIds.length) {
                    throw new Error('One or more accounts do not belong to you.');
                }
            }

            let totalEarned = 0;
            let totalSpent = 0;
            for (const breakdown of breakdowns) {
                if (breakdown.type === 'to') {
                    totalEarned += breakdown.amount;
                } else {
                    totalSpent += breakdown.amount;
                }
            }
            const netAmount = totalEarned - totalSpent;

            await tx`
                UPDATE transaction
                SET transaction_name = ${name}, amount = ${amount}, date = ${date}
                WHERE transaction_id = ${transactionId}
            `;

            await tx`
                DELETE FROM tag_assigned_to_transaction
                WHERE transaction_id = ${transactionId}
            `;

            if (!breakdownsUnchanged) {
                for (const breakdown of breakdowns) {
                    const spent = breakdown.type === 'from' ? breakdown.amount : 0;
                    const earned = breakdown.type === 'to' ? breakdown.amount : 0;

                    await tx`
                        INSERT INTO transaction_breakdown
                            (transaction_id, transaction_account_id, spent_amount, earned_amount)
                        VALUES (${transactionId}, ${breakdown.accountId}, ${spent}, ${earned})
                    `;
                }

                for (const oldBreakdown of existingBreakdowns) {
                    await tx`
                        DELETE FROM transaction_breakdown
                        WHERE transaction_breakdown_id = ${oldBreakdown.transaction_breakdown_id}
                    `;
                }
            }

            for (const tagName of tags) {
                const existing = await tx`
                    SELECT tag_id
                    FROM tag
                    WHERE LOWER(tag_name) = ${tagName}
                `;

                let tagId: number;
                if (existing.length > 0) {
                    tagId = existing[0].tag_id;
                } else {
                    const [inserted] = await tx`
                        INSERT INTO tag (tag_name)
                        VALUES (${tagName})
                        RETURNING tag_id
                    `;
                    tagId = inserted.tag_id;
                }

                await tx`
                    INSERT INTO tag_assigned_to_transaction (transaction_id, tag_id)
                    VALUES (${transactionId}, ${tagId})
                `;
            }

            await tx`
                UPDATE transaction
                SET net_amount = ${netAmount}
                WHERE transaction_id = ${transactionId}
            `;
        });
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Failed to update transaction.',
        };
    }

    revalidatePath('/history');
    revalidatePath('/dashboard');
    return { success: 'Transaction updated.' };
}