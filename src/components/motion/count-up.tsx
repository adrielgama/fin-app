"use client";

import { useEffect } from "react";
import { animate, useMotionValue, useTransform, motion } from "motion/react";
import { formatCents } from "@/lib/format";

export function CountUp({ cents, className }: { cents: number; className?: string }) {
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => formatCents(Math.round(v)));

  useEffect(() => {
    const controls = animate(value, cents, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [cents, value]);

  return <motion.span className={className}>{text}</motion.span>;
}
