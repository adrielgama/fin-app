"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit items-center gap-1 rounded-full bg-card/80 p-1.5 shadow-soft ring-1 ring-foreground/10 backdrop-blur-xl md:hidden"
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-11 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-muted-foreground",
              active && "text-primary-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="mobile-active"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <Icon className="relative size-5" />
            {active && <span className="relative">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
