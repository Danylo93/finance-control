import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownRight, ArrowUpRight, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Transaction {
  id: string;
  amount: string | number;
  description: string;
  type: "income" | "expense";
  category: string;
  date: string;
}

const categoryLabels: Record<string, string> = {
  fixed_expenses: "Gastos Fixos",
  variable_expenses: "Gastos Variáveis",
  savings: "Economia/Investimentos",
  tithe: "Dízimo",
  fiv: "Projeto FIV",
  discounts: "Descontos (IRPF/INSS)"
};

export const TransactionList = () => {
  const queryClient = useQueryClient();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get(`/api/transactions?userId=${user.userId}`);
      return response.data;
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/transactions?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] }); // Refetch metas if needed
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
        type: editType
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando transações...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="col-span-full xl:col-span-2 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions?.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-full ${
                    transaction.type === "income"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {transaction.type === "income" ? (
                    <ArrowUpRight className="h-5 w-5" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-base">{transaction.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {format(new Date(transaction.date), "dd 'de' MMMM, yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                    {transaction.category && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                          {categoryLabels[transaction.category] || transaction.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`font-semibold text-lg ${
                    transaction.type === "income"
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <Dialog open={editingTransaction?.id === transaction.id} onOpenChange={(open) => {
                    if (!open) setEditingTransaction(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => openEditModal(transaction)}
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

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteTransaction.mutate(transaction.id)}
                    disabled={deleteTransaction.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {transactions?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma transação registrada ainda.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
