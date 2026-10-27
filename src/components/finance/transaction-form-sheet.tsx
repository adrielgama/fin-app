"use client";

import { useEffect, useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { removeTransaction, saveTransaction } from "@/app/(app)/lancamentos/actions";
import { ReceiptsField } from "@/components/finance/receipts-field";
import { Field, selectClass } from "@/components/finance/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  formValuesToInput,
  transactionFormSchema,
  transactionToFormDefaults,
  type Account,
  type Category,
  type Transaction,
  type TransactionFormValues,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

const paymentLabels = {
  pix: "Pix",
  credit: "Crédito",
  debit: "Débito",
  cash: "Dinheiro",
  boleto: "Boleto",
  transfer: "Transferência",
  other: "Outro",
} as const;

const frequencyLabels = { none: "Não repete", weekly: "Semanal", monthly: "Mensal", yearly: "Anual" } as const;

interface TransactionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  categories: Category[];
  accounts: Account[];
  uid: string;
}

function emptyValues(categories: Category[], accounts: Account[]): TransactionFormValues {
  return {
    kind: "expense",
    description: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    categoryId: categories.find((c) => c.kind === "expense")?.id ?? "",
    accountId: accounts.find((a) => !a.archived)?.id ?? "",
    paymentMethod: "pix",
    frequency: "none",
    interval: "1",
    endDate: "",
    notes: "",
  };
}

export function TransactionFormSheet({ open, onOpenChange, transaction, categories, accounts, uid }: TransactionFormSheetProps) {
  const [pending, startTransition] = useTransition();
  const defaults = useMemo(
    () => (transaction ? transactionToFormDefaults(transaction) : emptyValues(categories, accounts)),
    [transaction, categories, accounts],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<TransactionFormValues>({ resolver: zodResolver(transactionFormSchema), defaultValues: defaults });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const kind = useWatch({ control, name: "kind" });
  const frequency = useWatch({ control, name: "frequency" });
  const kindCategories = categories.filter((c) => c.kind === kind);

  function changeKind(next: TransactionFormValues["kind"]) {
    setValue("kind", next);
    setValue("categoryId", categories.find((c) => c.kind === next)?.id ?? "", { shouldValidate: true });
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveTransaction(transaction?.id ?? null, formValuesToInput(values));
      if (result.ok) {
        toast.success(transaction ? "Lançamento atualizado" : "Lançamento criado");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  });

  function onDelete() {
    if (!transaction) return;
    startTransition(async () => {
      const result = await removeTransaction(transaction.id);
      if (result.ok) {
        toast.success("Lançamento excluído");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{transaction ? "Editar lançamento" : "Novo lançamento"}</SheetTitle>
          <SheetDescription>Receita ou despesa, com conta, forma de pagamento e recorrência.</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-4 px-4 pb-4">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Tipo">
            {(["expense", "income"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => changeKind(k)}
                className={cn(
                  "rounded-lg py-1.5 text-sm font-medium transition-colors",
                  kind === k ? "bg-card shadow-sm" : "text-muted-foreground",
                  kind === k && (k === "income" ? "text-success" : "text-destructive"),
                )}
              >
                {k === "expense" ? "Despesa" : "Receita"}
              </button>
            ))}
          </div>

          <Field label="Descrição" error={errors.description?.message}>
            <Input {...register("description")} aria-invalid={!!errors.description} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$)" error={errors.amount?.message}>
              <Input {...register("amount")} inputMode="decimal" placeholder="0,00" aria-invalid={!!errors.amount} />
            </Field>
            <Field label="Data" error={errors.date?.message}>
              <Input type="date" {...register("date")} aria-invalid={!!errors.date} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria" error={errors.categoryId?.message}>
              <select {...register("categoryId")} className={selectClass} aria-invalid={!!errors.categoryId}>
                {kindCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Conta / cartão" error={errors.accountId?.message}>
              <select {...register("accountId")} className={selectClass} aria-invalid={!!errors.accountId}>
                {accounts
                  .filter((a) => !a.archived)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </Field>
          </div>

          <Field label="Forma de pagamento">
            <select {...register("paymentMethod")} className={selectClass}>
              {Object.entries(paymentLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Recorrência" className={frequency === "none" ? "col-span-2" : undefined}>
              <select {...register("frequency")} className={selectClass}>
                {Object.entries(frequencyLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            {frequency !== "none" && (
              <Field label="A cada (n)" error={errors.interval?.message}>
                <Input {...register("interval")} inputMode="numeric" aria-invalid={!!errors.interval} />
              </Field>
            )}
          </div>
          {frequency !== "none" && (
            <Field label="Até (opcional)" error={errors.endDate?.message}>
              <Input type="date" {...register("endDate")} />
            </Field>
          )}

          <Field label="Observações" error={errors.notes?.message}>
            <Textarea {...register("notes")} rows={2} />
          </Field>

          {transaction ? (
            <ReceiptsField target={{ kind: "transaction", id: transaction.id }} receipts={transaction.receipts} uid={uid} />
          ) : (
            <p className="text-xs text-muted-foreground">Salve o lançamento para anexar comprovantes.</p>
          )}

          <div className="mt-auto flex gap-2 pt-2">
            {transaction && (
              <Button type="button" variant="destructive" disabled={pending} onClick={onDelete}>
                Excluir
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
