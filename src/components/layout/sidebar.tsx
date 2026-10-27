import { SignOutButton } from "@/components/auth/sign-out-button";
import { NavLinks } from "@/components/layout/nav-links";
import type { SessionUser } from "@/lib/auth/constants";

export function Sidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="flex w-56 shrink-0 flex-col gap-6 border-r p-4 max-md:hidden">
      <span className="px-3 text-lg font-semibold">Fin App</span>
      <NavLinks />
      <div className="mt-auto flex flex-col gap-2">
        <div className="truncate px-3 text-xs text-muted-foreground">{user.email}</div>
        <SignOutButton />
      </div>
    </aside>
  );
}
