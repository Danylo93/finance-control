import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: "income" | "expense";
  category: string | null;
  date: string;
}

const categoryLabels: Record<string, string> = {
  fixed_expenses: "Gastos Fixos",
  variable_expenses: "Gastos Variáveis",
  savings: "Economia/Investimentos",
  tithe: "Dízimo",
  fiv: "Projeto FIV",
};

export const TransactionList = () => {
  const queryClient = useQueryClient();

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get('/api/transactions');
      return response.data || [];
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/transactions?id=${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["budget-overview"] });
      toast.success("Transação excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir transação");
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma transação registrada ainda
            </p>
          ) : (
            transactions?.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-full ${
                      transaction.type === "income"
                        ? "bg-income/10"
                        : "bg-expense/10"
                    }`}
                  >
                    {transaction.type === "income" ? (
                      <ArrowDownRight className="h-5 w-5 text-income" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-expense" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.date), "dd 'de' MMMM, yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      {transaction.category && (
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[transaction.category]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p
                    className={`text-lg font-semibold ${
                      transaction.type === "income"
                        ? "text-income"
                        : "text-expense"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTransaction.mutate(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4 text-expense" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
