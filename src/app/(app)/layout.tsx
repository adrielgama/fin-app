import { Suspense, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth/session";

async function AppShell({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-svh">
      <Sidebar user={user} />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
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
