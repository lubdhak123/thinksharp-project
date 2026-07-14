import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Poppins } from "next/font/google";
import { HeaderNav } from "@/components/HeaderNav";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "500", "700", "800"],
});

export const metadata: Metadata = {
  title: "ThinkSharp Volunteer & Intern Impact Dashboard",
  description: "Record and analyze ThinkSharp Foundation volunteer and intern activity."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased bg-paper text-ink`}>
        <AuthProvider>
          <header className="no-print border-b border-border bg-paper">
            <div className="h-1.5 bg-brand" />
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="flex min-w-0 items-center gap-3 group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-brand text-sm font-display font-extrabold tracking-tighter text-white shadow-sm">
                  TF
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-display font-bold leading-none tracking-normal text-ink sm:text-base">
                    ThinkSharp <span className="font-medium text-mist">Impact Tool</span>
                  </h1>
                </div>
              </Link>
              <HeaderNav />
            </div>
          </header>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

