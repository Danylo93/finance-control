import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpRight, Trash2, Pencil, Home, ShoppingBag, PiggyBank, Heart, Target, Receipt, CreditCard, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, cn } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: string | number;
  description: string;
  type: "income" | "expense";
  category: string;
  date: string;
  account: "checking" | "benefits";
}

const categoryLabels: Record<string, string> = {
  fixed_expenses: "Gastos Fixos",
  variable_expenses: "Gastos Variáveis",
  savings: "Economia/Investimentos",
  tithe: "Dízimo",
  fiv: "Projeto FIV",
  discounts: "Descontos (IRPF/INSS)"
};

const categoryIcons: Record<string, React.ReactNode> = {
  fixed_expenses: <Home className="h-5 w-5" />,
  variable_expenses: <ShoppingBag className="h-5 w-5" />,
  savings: <PiggyBank className="h-5 w-5" />,
  tithe: <Heart className="h-5 w-5" />,
  fiv: <Target className="h-5 w-5" />,
  discounts: <Receipt className="h-5 w-5" />
};

const categoryColors: Record<string, string> = {
  fixed_expenses: "bg-chart-1/10 text-chart-1",
  variable_expenses: "bg-chart-2/10 text-chart-2",
  savings: "bg-chart-3/10 text-chart-3",
  tithe: "bg-chart-5/10 text-chart-5",
  fiv: "bg-rose-500/10 text-rose-500",
  discounts: "bg-chart-4/10 text-chart-4",
};

interface TransactionListProps {
  selectedMonth: number;
  selectedYear: number;
}

export const TransactionList = ({ selectedMonth, selectedYear }: TransactionListProps) => {
  const queryClient = useQueryClient();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "benefits">("all");

  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editAccount, setEditAccount] = useState<"checking" | "benefits">("checking");

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", selectedMonth, selectedYear],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get(`/api/transactions?userId=${user.userId}`);
      const allTransactions: any[] = response.data;

      return allTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/transactions?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budget-overview"] });
      queryClient.invalidateQueries({ queryKey: ["budget-chart"] });
      queryClient.invalidateQueries({ queryKey: ["budget-limits"] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Transação excluída com sucesso");
    },
    onError: () => {
      toast.error("Erro ao excluir transação");
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async () => {
      if (!editingTransaction) return;
      await axios.put('/api/transactions', {
        id: editingTransaction.id,
        description: editDescription,
        amount: parseFloat(editAmount),
        category: editCategory,
        type: editType,
        account: editAccount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budget-overview"] });
      queryClient.invalidateQueries({ queryKey: ["budget-chart"] });
      queryClient.invalidateQueries({ queryKey: ["budget-limits"] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Transação atualizada com sucesso");
      setEditingTransaction(null);
    },
    onError: () => {
      toast.error("Erro ao atualizar transação");
    },
  });

  const openEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setEditDescription(t.description);
    setEditAmount(t.amount.toString());
    setEditCategory(t.category || "variable_expenses");
    setEditType(t.type);
    setEditAccount(t.account || "checking");
  };

  const filters = [
    { key: "all", label: "Todas" },
    { key: "income", label: "Receitas" },
    { key: "expense", label: "Despesas" },
    { key: "benefits", label: "VA/VR" },
  ] as const;

  const filteredTransactions = transactions?.filter(t => {
    if (filterType === "income") return t.type === "income";
    if (filterType === "expense") return t.type === "expense";
    if (filterType === "benefits") return t.account === "benefits";
    return true;
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl">Transações</CardTitle>
          {!isLoading && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
              {filteredTransactions?.length ?? 0}
            </span>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-secondary/60 p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                filterType === f.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-border p-4">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions?.map((transaction) => {
              const isIncome = transaction.type === "income";
              const chipClass = isIncome
                ? "bg-success/10 text-success"
                : transaction.category && categoryColors[transaction.category]
                  ? categoryColors[transaction.category]
                  : "bg-destructive/10 text-destructive";

              return (
                <div
                  key={transaction.id}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", chipClass)}>
                      {isIncome ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : transaction.category && categoryIcons[transaction.category] ? (
                        categoryIcons[transaction.category]
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{transaction.description}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                        <span className="tabular-nums">
                          {format(new Date(transaction.date), "dd MMM yyyy", { locale: ptBR })}
                        </span>
                        {transaction.category && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {categoryLabels[transaction.category] || transaction.category}
                          </span>
                        )}
                        {transaction.account === "benefits" && (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            VA/VR
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn("text-base font-bold tabular-nums sm:text-lg", isIncome ? "text-success" : "text-expense")}>
                      {isIncome ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                      <Dialog open={editingTransaction?.id === transaction.id} onOpenChange={(open) => {
                        if (!open) setEditingTransaction(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            onClick={() => openEditModal(transaction)}
                            aria-label="Editar transação"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Transação</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Descrição</Label>
                              <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Valor (R$)</Label>
                              <Input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Tipo</Label>
                              <Select value={editType} onValueChange={(v: "income" | "expense") => setEditType(v)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="income">Receita</SelectItem>
                                  <SelectItem value="expense">Despesa</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Conta / Origem</Label>
                              <Select value={editAccount} onValueChange={(v: "checking" | "benefits") => setEditAccount(v)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="checking">Conta Corrente / Salário</SelectItem>
                                  <SelectItem value="benefits">Benefícios (VA/VR)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {editType === "expense" && (
                              <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select value={editCategory} onValueChange={setEditCategory}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fixed_expenses">Gastos Fixos</SelectItem>
                                    <SelectItem value="variable_expenses">Gastos Variáveis</SelectItem>
                                    <SelectItem value="savings">Economia/Investimentos</SelectItem>
                                    <SelectItem value="tithe">Dízimo</SelectItem>
                                    <SelectItem value="fiv">Projeto FIV</SelectItem>
                                    <SelectItem value="discounts">Descontos (IRPF/INSS)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <Button
                              className="w-full"
                              onClick={() => updateTransaction.mutate()}
                              disabled={updateTransaction.isPending || !editDescription || !editAmount}
                            >
                              {updateTransaction.isPending ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Excluir transação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A transação "{transaction.description}" será removida permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTransaction.mutate(transaction.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredTransactions?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <Inbox className="h-7 w-7 opacity-60" />
                </div>
                <p className="font-medium text-foreground">Nenhuma transação encontrada</p>
                <p className="text-sm">
                  {filterType === "all"
                    ? "Adicione sua primeira transação para começar."
                    : "Nenhuma transação corresponde a este filtro."}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
