import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';

interface BudgetData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryBreakdown: {
    fixed: number;
    variable: number;
    savings: number;
    tithe: number;
  };
}

export const Dashboard = () => {
  const { data: budgetData } = useQuery<BudgetData>({
    queryKey: ["budget-overview"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get('/api/transactions');
      const transactions: any[] = response.data;

      const income = transactions
        ?.filter(t => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const expenses = transactions
        ?.filter(t => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const categoryBreakdown = {
        fixed: transactions
          ?.filter(t => t.type === "expense" && t.category === "fixed_expenses")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        variable: transactions
          ?.filter(t => t.type === "expense" && t.category === "variable_expenses")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        savings: transactions
          ?.filter(t => t.type === "expense" && t.category === "savings")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        tithe: transactions
          ?.filter(t => t.type === "expense" && t.category === "tithe")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      };

      return {
        totalIncome: income,
        totalExpenses: expenses,
        balance: income - expenses,
        categoryBreakdown,
      };
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
          <TrendingUp className="h-4 w-4 text-income" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-income">
            {formatCurrency(budgetData?.totalIncome || 0)}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
          <TrendingDown className="h-4 w-4 text-expense" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-expense">
            {formatCurrency(budgetData?.totalExpenses || 0)}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(budgetData?.balance || 0) >= 0 ? "text-income" : "text-expense"}`}>
            {formatCurrency(budgetData?.balance || 0)}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Economia/Investimentos</CardTitle>
          <PiggyBank className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(budgetData?.categoryBreakdown.savings || 0)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
