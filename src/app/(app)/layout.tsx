import { Suspense, type ReactNode } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth/session";

async function AppShell({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-svh">
      <Sidebar user={user} />
      <main className="min-w-0 flex-1 px-4 pt-4 pb-28 md:px-10 md:py-10">
        <div className="mb-4 flex justify-end md:hidden">
          <ThemeToggle />
        </div>
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<Skeleton className="min-h-svh w-full rounded-none" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
