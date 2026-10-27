import Link from "next/link";
import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}

export function Section({ title, href, linkLabel = "Ver tudo", children }: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {href && (
          <Link href={href} className="text-sm font-medium text-primary hover:underline">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl bg-card p-4 shadow-soft ring-1 ring-foreground/5">{children}</div>;
}
