import { poppins } from '@/app/ui/fonts';

export default function Page() {
    return (
        <>
            <main
                className="
                    flex-1
                    flex
                    flex-col
                    items-center
                    justify-center 
                    md:justify-center
                    px-4
                    mt-[-80]
                "
            >
                <h1
                    className={`${poppins.className} 
                        text-[40px] 
                        leading-tight
                        tracking-tight
                        font-semibold 
                        text-center
                        mb-10 
                        text-white 
                        antialiased
                    `}
                >
                    Profile
                </h1>

            </main>
        </>
    );
}
