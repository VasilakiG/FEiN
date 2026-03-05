'use client';

import { useState } from 'react';
import FormSelector, { type FormType } from './form-selector';
import AddAccountForm from './add-account-form';
import AddTagForm from './add-tag-form';
import AddTransactionForm from './add-transaction-form';
import { poppins } from '@/app/ui/fonts';

type AccountOption = { transaction_account_id: number; account_name: string | null };
type TagOption = { tag_id: number; tag_name: string };

export default function AddPageClient({
    accounts,
    allTags,
}: {
    accounts: AccountOption[];
    allTags: TagOption[];
}) {
    const [formType, setFormType] = useState<FormType>('transaction');

    const titles: Record<FormType, string> = {
        transaction: 'Transaction',
        account: 'Account',
        tag: 'Tag',
    };

    return (
        <div className="w-full overflow-hidden px-6 pt-10 pb-10">
            <h1
                className={`${poppins.className}
                    text-[32px] leading-tight tracking-tight
                    font-semibold text-center text-white mb-6
                `}
            >
                Add
            </h1>

            {/* Selector */}
            <div className="mb-6">
                <FormSelector value={formType} onChange={setFormType} />
            </div>

            {/* Form card */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                {formType === 'transaction' && (
                    <AddTransactionForm accounts={accounts} allTags={allTags} />
                )}
                {formType === 'account' && <AddAccountForm />}
                {formType === 'tag' && <AddTagForm />}
            </div>
        </div>
    );
}
