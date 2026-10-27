"use client";

import type { ReactNode } from "react";
import { motion, type Variants } from "motion/react";

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 28 } },
};

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={item}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, step = 0.05 }: { children: ReactNode; className?: string; step?: number }) {
  return (
    <motion.ul
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: step, delayChildren: 0.1 } } }}
    >
      {children}
    </motion.ul>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.li className={className} variants={item}>
      {children}
    </motion.li>
  );
}
