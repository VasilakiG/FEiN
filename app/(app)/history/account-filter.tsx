import AccountFilterIcon from '@/app/ui/account-filter-icon';
import type { TransactionAccountLite } from '@/app/lib/queries';

export default function AccountFilter({
    accounts,
}: {
    accounts: TransactionAccountLite[];
}) {
    return <AccountFilterIcon accounts={accounts} resetPageOnChange />;
}
