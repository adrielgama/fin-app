import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Reveal } from "@/components/motion/reveal";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getCurrentUser } from "@/lib/auth/session";
import { isMockMode } from "@/lib/env";

export const metadata = { title: "Entrar" };

async function SignIn() {
  if (await getCurrentUser()) redirect("/");
  return <SignInButton mock={isMockMode} />;
}

export default function LoginPage() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
      <ThemeToggle className="absolute top-4 right-4" />
      <Reveal className="relative w-full max-w-sm">
        <div className="overflow-hidden rounded-3xl bg-card shadow-soft ring-1 ring-foreground/5">
          <div className="bg-linear-to-br from-hero-from via-hero-via to-hero-to p-8 text-white">
            <span className="mb-6 block size-12 rounded-2xl bg-white/20 backdrop-blur" />
            <h1 className="text-3xl font-semibold tracking-tight">Fin App</h1>
            <p className="mt-1 text-sm text-white/75">
              {isMockMode ? "Modo mock ativo: dados de demonstração." : "Controle suas finanças pessoais."}
            </p>
          </div>
          <div className="p-6">
            <Suspense>
              <SignIn />
            </Suspense>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
