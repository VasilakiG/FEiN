import UrlSearchInput from '@/app/ui/url-search-input';

export default function Search({ placeholder }: { placeholder: string }) {
    return <UrlSearchInput placeholder={placeholder} resetPageOnChange />;
}
