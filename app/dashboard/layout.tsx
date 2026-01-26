
export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex bg-fein-login h-screen flex-col md:flex-row md:overflow-hidden">
            <div className="grow p-6 md:overflow-y-auto md:p-12">{children}</div>
        </div>
    );
}