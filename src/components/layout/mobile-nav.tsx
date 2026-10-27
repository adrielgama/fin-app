"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { EllipsisIcon } from "lucide-react";
import { navItems } from "@/components/layout/nav-items";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = navItems.filter((i) => i.primary);
  const secondary = navItems.filter((i) => !i.primary);
  const moreActive = secondary.some((i) => isActive(pathname, i.href));

  return (
    <>
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit items-center gap-1 rounded-full bg-card/80 p-1.5 shadow-soft ring-1 ring-foreground/10 backdrop-blur-xl md:hidden"
      >
        {primary.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
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
        <button
          type="button"
          aria-label="Mais"
          onClick={() => setMoreOpen(true)}
          className={cn("relative flex h-11 items-center rounded-full px-3.5 text-muted-foreground", moreActive && "text-primary")}
        >
          <EllipsisIcon className="size-5" />
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader>
            <SheetTitle>Mais</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-3 px-4">
            {secondary.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl bg-muted py-3 text-xs font-medium",
                  isActive(pathname, href) && "bg-primary/12 text-primary",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
