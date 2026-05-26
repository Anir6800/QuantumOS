'use client';

import { motion } from 'framer-motion';
import Magnetic from './Magnetic';

export default function CTASection() {
  return (
    <section className="py-32 relative overflow-hidden bg-[#050508] border-t border-white/5">
      <div className="absolute inset-0 bg-[#00e5ff]/5" />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#00e5ff]/20 to-[#8b5cf6]/20 blur-[150px] rounded-full pointer-events-none" 
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">
            Ready to scale your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-[#8b5cf6]">intelligence?</span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto font-mono">
            Join the waitlist or start deploying local swarms today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Magnetic strength={25}>
              <button className="relative group w-full sm:w-auto bg-[#00e5ff] text-[#050508] px-6 py-4 sm:px-10 sm:py-5 rounded-xl font-black text-lg sm:text-xl hover:bg-white transition-all overflow-hidden shadow-[0_0_40px_rgba(0,229,255,0.3)] hover:shadow-[0_0_60px_rgba(0,229,255,0.6)]">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started Free
                </span>
                <div className="absolute inset-0 h-full w-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </button>
            </Magnetic>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
