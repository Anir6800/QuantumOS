'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Magnetic from './Magnetic';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const blurValue = useTransform(scrollY, [0, 100], [0, 16]);
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.8]);

  return (
    <motion.nav 
      style={{
        backdropFilter: blurValue.get() > 0 ? `blur(${blurValue.get()}px)` : 'none',
        backgroundColor: `rgba(5, 5, 8, ${bgOpacity.get()})`
      }}
      className="fixed top-0 left-0 w-full z-50 border-b border-white/5 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-black tracking-tighter outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff] rounded-sm group">
              <span className="text-white group-hover:text-gray-300 transition-colors">Quantum</span>
              <span className="text-[#00e5ff] drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">OS</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-8">
              <Magnetic strength={10}>
                <Link href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Features</Link>
              </Magnetic>
              <Magnetic strength={10}>
                <Link href="#docs" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Docs</Link>
              </Magnetic>
              <Magnetic strength={10}>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.34 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
                  GitHub
                </a>
              </Magnetic>
              <Magnetic strength={20}>
                <Link href="/dashboard" className="bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#00e5ff] hover:text-[#050508] transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] inline-block">
                  Launch Swarm
                </Link>
              </Magnetic>
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white">
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <svg className="block h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="block h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-b border-white/10 bg-[#050508]/95 backdrop-blur-lg">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white">Features</Link>
              <Link href="#docs" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white">Docs</Link>
              <a href="https://github.com" className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white">GitHub</a>
              <Link href="/dashboard" className="block w-full text-center mt-4 bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 px-3 py-2 rounded-md text-base font-bold hover:bg-[#00e5ff] hover:text-[#050508]">
                Launch Swarm
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
