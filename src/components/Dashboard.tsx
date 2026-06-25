import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, Wallet, PiggyBank, Utensils } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';

interface BudgetData {
  checkingBalance: number;
  benefitsBalance: number;
  checkingExpenses: number;
  savingsOnly: number;
  fivOnly: number;
}

interface DashboardProps {
  selectedMonth: number;
  selectedYear: number;
}

export const Dashboard = ({ selectedMonth, selectedYear }: DashboardProps) => {
  const { data: budgetData } = useQuery<BudgetData>({
    queryKey: ["budget-overview", selectedMonth, selectedYear],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get(`/api/transactions?userId=${user.userId}`);
      const allTransactions: any[] = response.data;
      
      const monthlyTransactions = allTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });

      const cumulativeTransactions = allTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() < selectedYear || (d.getFullYear() === selectedYear && d.getMonth() <= selectedMonth);
      });

      // Checking Account (Salário)
      // Checking Account Balance (Cumulative)
      const checkingIncome = cumulativeTransactions
        ?.filter(t => t.type === "income" && t.account === "checking")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const cumulativeCheckingExpenses = cumulativeTransactions
        ?.filter(t => t.type === "expense" && t.account === "checking")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Checking Expenses (Monthly)
      const checkingExpenses = monthlyTransactions
        ?.filter(t => t.type === "expense" && t.account === "checking")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Benefits Account Balance (Cumulative)
      const benefitsIncome = cumulativeTransactions
        ?.filter(t => t.type === "income" && t.account === "benefits")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const benefitsExpenses = cumulativeTransactions
        ?.filter(t => t.type === "expense" && t.account === "benefits")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Savings (Monthly)
      const savingsOnly = monthlyTransactions
        ?.filter(t => t.type === "expense" && t.account === "checking" && t.category === "savings")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // FIV (Monthly)
      const fivOnly = monthlyTransactions
        ?.filter(t => t.type === "expense" && t.account === "checking" && t.category === "fiv")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      return {
        checkingBalance: checkingIncome - cumulativeCheckingExpenses,
        benefitsBalance: benefitsIncome - benefitsExpenses,
        checkingExpenses,
        savingsOnly,
        fivOnly
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="hover:shadow-lg transition-shadow bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Conta Corrente</CardTitle>
          <Wallet className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(budgetData?.checkingBalance || 0) >= 0 ? "text-income" : "text-expense"}`}>
            {formatCurrency(budgetData?.checkingBalance || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Livre para gastos ou FIV</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow bg-amber-500/5 dark:bg-amber-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo VA/VR</CardTitle>
          <Utensils className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-500">
            {formatCurrency(budgetData?.benefitsBalance || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Exclusivo para alimentação</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Despesas em Dinheiro</CardTitle>
          <TrendingDown className="h-4 w-4 text-expense" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-expense">
            {formatCurrency(budgetData?.checkingExpenses || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Gastos pagos da conta</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Economizado (Reserva)</CardTitle>
          <PiggyBank className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(budgetData?.savingsOnly || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Investido no mês</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow bg-rose-500/5 dark:bg-rose-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projeto FIV</CardTitle>
          <PiggyBank className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-500">
            {formatCurrency(budgetData?.fivOnly || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Aportado no mês</p>
        </CardContent>
      </Card>
    </div>
  );
};
