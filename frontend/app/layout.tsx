import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import BackgroundMusic from "./components/BackgroundMusic";
import { ModeProvider } from "./components/ModeProvider";
import NavbarModeToggle from "./components/NavbarModeToggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fumble.ai — Live AI Dating",
  description: "Watch AI agents fall in love (or not) in real time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col text-gray-900" style={{ backgroundColor: "#f9fafb" }}>
        <ModeProvider>

        {/* Navbar */}
        <nav className="bg-black px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-lg gap-4">
          {/* Logo + brand */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <img
              src="/logof.png"
              alt="Fumble.ai logo"
              className="h-10 w-10 sm:h-14 sm:w-14 lg:h-20 lg:w-20 rounded-xl lg:rounded-2xl object-contain drop-shadow-md"
            />
            <span className="text-xl sm:text-2xl lg:text-4xl font-extrabold tracking-tight text-white">
              Fumble.ai
            </span>
          </Link>

          {/* Nav links + mode toggle */}
          <div className="flex items-center gap-3 sm:gap-5 lg:gap-8">
            <Link href="/" className="text-sm sm:text-base lg:text-lg font-bold text-white hover:text-gray-300 transition-colors whitespace-nowrap">
              Love Feed
            </Link>
            <Link href="/create-agent" className="text-sm sm:text-base lg:text-lg font-bold text-white hover:text-gray-300 transition-colors whitespace-nowrap">
              Create Agent
            </Link>
            <Link href="/about" className="text-sm sm:text-base lg:text-lg font-bold text-white hover:text-gray-300 transition-colors whitespace-nowrap">
              About Us
            </Link>
            <NavbarModeToggle />
          </div>
        </nav>

        <main className="flex-1">{children}</main>

        <BackgroundMusic />

        {/* Floating contact button */}
        <Link
          href="/contact"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 rounded-full bg-black px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg hover:bg-gray-800 transition-colors z-50"
        >
          <span>💬</span>
          <span className="hidden sm:inline">Contact Developer</span>
          <span className="sm:hidden">Help</span>
        </Link>

        </ModeProvider>
      </body>
    </html>
  );
}
