import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { isMockMode } from "@/lib/env";

export const metadata = { title: "Entrar" };

async function SignIn() {
  if (await getCurrentUser()) redirect("/");
  return <SignInButton mock={isMockMode} />;
}

export default function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Fin App</CardTitle>
          <CardDescription>
            {isMockMode ? "Modo mock ativo: dados de demonstração." : "Controle suas finanças pessoais."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <SignIn />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
