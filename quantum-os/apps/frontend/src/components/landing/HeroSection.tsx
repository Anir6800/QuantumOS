'use client';

import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Magnetic from './Magnetic';

const Typewriter = ({ text, delay }: { text: string, delay: number }) => {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text, started]);

  return <span>{displayText}<span className="animate-pulse text-[#00e5ff]">_</span></span>;
};

export default function HeroSection() {
  const headline = "The AI That Writes Its Own Best Code".split(" ");
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 400]); // Parallax background
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  const x = useMotionValue(0);
  const yAxis = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
  const mouseYSpring = useSpring(yAxis, { stiffness: 100, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    x.set(clientX / innerWidth - 0.5);
    yAxis.set(clientY / innerHeight - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    yAxis.set(0);
  };

  return (
    <section 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden perspective-[2000px]"
    >
      {/* Animated Grid Background with Parallax */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#00e5ff0d_1px,transparent_1px),linear-gradient(to_bottom,#00e5ff0d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_70%,transparent_100%)] motion-safe:animate-[pulse_5s_ease-in-out_infinite] opacity-60 scale-125" 
      />
      
      {/* Glow Effect */}
      <motion.div 
        style={{ opacity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[900px] h-[600px] bg-gradient-to-r from-[#00e5ff]/0 via-[#00e5ff]/5 to-[#8b5cf6]/5 blur-[120px] rounded-full pointer-events-none z-0" 
      />

      <motion.div 
        style={{ rotateX, rotateY, opacity }}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center preserve-3d"
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
          }}
          className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-10"
        >
          {headline.map((word, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: 40, rotateX: -90 },
                visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: 'spring', damping: 15, stiffness: 100 } }
              }}
              className="text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60 drop-shadow-sm"
            >
              {word}
            </motion.span>
          ))}
        </motion.div>

        <div className="h-24 md:h-20 mb-12 max-w-3xl mx-auto">
          <p className="text-xl md:text-2xl text-gray-400 font-mono leading-relaxed">
            <Typewriter text="Deploy intelligent swarms that parallel-test solutions and auto-benchmark the most optimized production-ready output." delay={1000} />
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 1, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
        >
          <Magnetic strength={30}>
            <Link href="/dashboard" className="relative group w-full sm:w-auto bg-[#00e5ff] text-[#050508] px-10 py-5 rounded-xl font-black text-xl hover:bg-white transition-all overflow-hidden inline-block text-center">
              <span className="relative z-10 flex items-center justify-center gap-2">
                Launch Swarm 
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </span>
              <div className="absolute inset-0 h-full w-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <div className="absolute inset-0 bg-[#00e5ff] blur-[20px] -z-10 group-hover:opacity-100 opacity-50 transition-opacity" />
            </Link>
          </Magnetic>
          
          <Magnetic strength={20}>
            <button className="w-full sm:w-auto bg-transparent text-white border-2 border-white/10 px-10 py-5 rounded-xl font-bold text-xl hover:border-white/30 hover:bg-white/5 transition-all focus:outline-none">
              View Docs
            </button>
          </Magnetic>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1.5 }}
          className="flex flex-wrap items-center justify-center gap-4 md:gap-8"
        >
          {['Parallel Execution', 'Auto-Benchmark', 'Production Ready'].map((badge, idx) => (
            <motion.div 
              whileHover={{ scale: 1.05, y: -2 }}
              key={idx} 
              className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/10 text-sm font-bold text-gray-300 backdrop-blur-sm cursor-default hover:bg-white/[0.08] transition-colors"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,1)]" />
              {badge}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
