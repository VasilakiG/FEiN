import '@/app/ui/global.css';
import { poppins } from '@/app/ui/fonts';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | FEiN Dashboard',
    default: 'FEiN Dashboard',
  },
  description: 'Mobile-first web-application for personal finance tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased bg-black md:bg-black`}>
        <div className="min-h-screen flex items-center justify-center">
          {/* Phone shell */}
          <div
            className="
              w-full
              h-screen
              md:h-[800px]
              md:max-h-[90vh]
              md:w-[390px]
              shadow-xl
              md:rounded-2xl
              overflow-hidden
              flex 
              flex-col
              bg-transparent
            "
          >
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
