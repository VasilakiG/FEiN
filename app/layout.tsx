import '@/app/ui/global.css';
import { poppins } from '@/app/ui/fonts';
import { Metadata } from 'next';
import GlobalNavigationIndicator from '@/app/ui/global-navigation-indicator';

export const metadata: Metadata = {
  title: {
    template: '%s | FEiN',
    default: 'FEiN',
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
      {/* lock page scroll; the app will scroll inside the phone shell */}
      <body className={`${poppins.className} antialiased bg-black overflow-hidden`}>
        {/* Outer background wrapper */}
        <div className="min-h-screen w-full xs:bg-fein  md:bg-black flex items-center justify-center">
          {/* Phone shell */}
          <div
            className="
              relative
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
              bg-fein
            "
          >
            {children}
          </div>
        </div>

        <GlobalNavigationIndicator />
      </body>
    </html>
  );
}
