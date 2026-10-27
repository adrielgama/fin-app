# Fin App

Finanças pessoais: Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui + Firebase.

## Status

- [x] Estrutura, auth (Google/Firebase + cookie de sessão), modelo de dados, security rules
- [x] Dados mock (dashboard e lançamentos somente leitura)
- [ ] CRUD de lançamentos, renda CLT/PJ, dashboard com gráficos, planilha/exportação, comprovantes, contas a pagar + lembretes

## Rodando em modo mock (sem Firebase)

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_MOCK_MODE=true
npm run dev
```

Login "demo" cria cookie de sessão mock. Nunca use `NEXT_PUBLIC_MOCK_MODE=true` em produção.

## Setup do Firebase

1. [Console Firebase](https://console.firebase.google.com) > **Adicionar projeto**.
2. **Authentication** > Sign-in method > habilite **Google**. Em Settings > Authorized domains, adicione seu domínio de produção.
3. **Firestore Database** > criar banco (modo produção).
4. **Storage** > começar (modo produção).
5. **Configurações do projeto** > Seus apps > **Web** > copie a config para `.env.local`:
   `NEXT_PUBLIC_FIREBASE_*`. Defina `NEXT_PUBLIC_MOCK_MODE=false`.
6. **Configurações do projeto** > Contas de serviço > **Gerar nova chave privada**. Preencha
   `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`
   (mantenha `\n` literais na chave, entre aspas). Nunca commite o JSON.
7. Publique as regras:
   ```bash
   npx firebase login
   npx firebase use --add          # seu project id (substitui demo-fin-app)
   npm run deploy:rules
   ```
8. (Push, etapa futura) **Cloud Messaging** > Web Push certificates > gere o par de chaves e preencha `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

## Emuladores (dev)

Requer Java 11+ e `firebase-tools` (já em devDependencies).

```bash
npm run emulators               # Auth :9099, Firestore :8080, Storage :9199, UI :4000
```

`.env.local`:

```env
NEXT_PUBLIC_MOCK_MODE=false
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NEXT_PUBLIC_FIREBASE_API_KEY=demo-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-fin-app
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-fin-app.appspot.com
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199
```

Em outro terminal: `npm run dev`. O popup do Google no emulador permite criar contas fictícias.

## Arquitetura

```
src/
  app/
    login/                 página pública
    (app)/                 rotas protegidas (layout valida sessão no servidor)
    api/auth/session/      POST: ID token -> session cookie | DELETE: logout
  components/ui/           shadcn
  lib/
    schemas/               Zod: fonte única dos tipos (valores em centavos, datas ISO)
    repository/            interface FinanceRepository + mock (Firestore na próxima etapa)
    firebase/              client (SDK web + emuladores) e admin (server-only)
    auth/                  sessão (cookie httpOnly `__session`, 5 dias)
  proxy.ts                 redireciona sem cookie para /login
```

### Modelo de dados (Firestore)

Tudo sob `users/{uid}`, isolado por regra (`request.auth.uid == uid`):

| Coleção | Campos principais |
| --- | --- |
| `accounts` | name, type, initialBalance, color |
| `categories` | name, kind (income/expense), color |
| `transactions` | kind, amount, date, categoryId, accountId, paymentMethod, recurrence, receipts[], billId?, incomeEntryId? |
| `incomeEntries` | source (clt/pj), kind (salary/advance/invoice/tax), grossAmount, deductions, competence, client?, invoiceNumber? |
| `bills` | title, amount, dueDate, status, recurrence, reminderDaysBefore[], receipts[] |

Comprovantes: Storage em `users/{uid}/receipts/{arquivo}` (PDF/JPG/PNG/WebP, até 10 MB).
