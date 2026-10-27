# Fin App

Finanças pessoais: Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui + Firebase.

## Funcionalidades

- Login Google (Firebase Auth) com session cookie httpOnly; dados por usuário no Firestore com security rules
- Lançamentos (receita/despesa) com conta/cartão, forma de pagamento, recorrência e comprovantes
- Renda CLT (salário, adiantamento) e PJ (notas, impostos)
- Dashboard: saldo mensal, gastos por categoria, evolução mensal, previsão de fluxo de caixa (90 dias)
- Planilha filtrável/ordenável por mês, exportação `.xlsx` e `.csv`
- Cartões e contas separados (limite, fatura, fechamento/vencimento)
- Contas a pagar com status, recorrência (gera a próxima ao pagar) e lembretes (Cloud Function + FCM/e-mail)
- Tema claro/escuro, animações (`motion`)

## Rodando em modo mock (sem Firebase, sem `.env`)

```bash
npm install
npm run dev
```

Sem `.env.local`, o app sobe em **modo mock**: login demo, dados em memória (reiniciar o servidor restaura o seed) e
todas as telas funcionais (comprovantes e exportações inclusive). Só push/FCM e a Cloud Function exigem Firebase.

Seleção do modo (`NEXT_PUBLIC_MOCK_MODE`):

| Valor | Comportamento |
| --- | --- |
| vazio / ausente | mock se faltar `NEXT_PUBLIC_FIREBASE_API_KEY`/`PROJECT_ID` (e `NODE_ENV != production`); Firebase quando configurado |
| `true` | força mock (não use em produção: o login demo vira bypass de auth) |
| `false` | força Firebase real ou emulador |

Para migrar: preencha as variáveis `NEXT_PUBLIC_FIREBASE_*` e `FIREBASE_ADMIN_*` do `.env.local` e o app passa a usar o Firebase.

## Setup do Firebase

1. [Console Firebase](https://console.firebase.google.com) > **Adicionar projeto**.
2. **Authentication** > Sign-in method > habilite **Google**. Em Settings > Authorized domains, adicione seu domínio de produção.
3. **Firestore Database** > criar banco (modo produção).
4. **Storage** > começar (modo produção).
5. **Configurações do projeto** > Seus apps > **Web** > copie a config para `.env.local`:
   `NEXT_PUBLIC_FIREBASE_*`. O modo mock desliga sozinho ao preencher a config.
6. **Configurações do projeto** > Contas de serviço > **Gerar nova chave privada**. Preencha
   `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`
   (mantenha `\n` literais na chave, entre aspas). Nunca commite o JSON.
7. Publique as regras:
   ```bash
   npx firebase login
   npx firebase use --add          # seu project id (substitui demo-fin-app)
   npm run deploy:rules
   ```
8. Push: **Cloud Messaging** > Web Push certificates > gere o par de chaves e preencha `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

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

## Lembretes (Cloud Function)

`functions/` contém `billReminders`, agendada diariamente às 08:00 (America/Sao_Paulo):
lê contas pendentes (`collectionGroup("bills")`), envia push via FCM e/ou grava em `mail/` (extensão
[Trigger Email from Firestore](https://extensions.dev/extensions/firebase/firestore-send-email)) conforme as preferências em **Ajustes**.

```bash
npm --prefix functions install
npm --prefix functions test       # lógica de seleção/mensagens
npm run deploy:functions          # requer plano Blaze
```

Requisitos: ativar Cloud Messaging, gerar a VAPID key (`NEXT_PUBLIC_FIREBASE_VAPID_KEY`) e instalar a extensão de e-mail (SMTP) se quiser e-mails.
O índice `bills (status, dueDate)` está em `firestore.indexes.json`.

## Testes

```bash
npm run test:rules   # security rules (Firestore + Storage) nos emuladores
```

## Notas

- Valores em centavos (inteiros); datas ISO `YYYY-MM-DD` (strings) no Firestore.
- O servidor acessa o Firestore via Admin SDK, sempre sob `users/{uid}`; as rules protegem acessos diretos do cliente (Storage usa o SDK web).
- Coleção `mail` e campo `lastReminderDate` das contas são escritos apenas pela Cloud Function.
