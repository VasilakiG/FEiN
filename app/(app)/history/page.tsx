import { poppins } from '@/app/ui/fonts';

export default function Page() {
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
                History
            </h1>

            <div className="mt-10 rounded-3xl bg-white/5 border border-white/10 p-6 text-white/80">
                History placeholder
            </div>
        </div>
    );
}
