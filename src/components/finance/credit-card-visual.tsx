"use client";

import { motion } from "motion/react";
import { WifiIcon } from "lucide-react";

interface CreditCardVisualProps {
  name: string;
  color: string;
  lastDigits: string | null;
  className?: string;
}

export function CreditCardVisual({ name, color, lastDigits, className }: CreditCardVisualProps) {
  return (
    <motion.div
      whileHover={{ rotate: -2, y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative aspect-[1.586] w-full overflow-hidden rounded-3xl p-5 text-white shadow-soft ${className ?? ""}`}
      style={{ background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 50%, #000))` }}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute right-6 bottom-0 h-3/4 w-1/3 skew-x-[-12deg] bg-white/8" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-base font-medium">{name}</span>
          <WifiIcon className="size-5 rotate-90 text-white/80" />
        </div>
        <div className="size-8 rounded-md bg-linear-to-br from-amber-200 to-amber-400/80" />
        <p className="font-mono text-sm tracking-[0.2em] text-white/90">•••• •••• •••• {lastDigits ?? "0000"}</p>
      </div>
    </motion.div>
  );
}
