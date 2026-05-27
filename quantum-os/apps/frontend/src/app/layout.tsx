import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QuantumOS — AI Software Engineering OS',
  description: 'Deploy AI swarms to write, benchmark, and deploy production-ready code.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased bg-[#050508] text-white selection:bg-[#00e5ff] selection:text-[#050508]">
        {children}
      </body>
    </html>
  )
}
