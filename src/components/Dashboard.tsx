import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, Wallet, PiggyBank, Utensils, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';
import { formatCurrency, cn } from "@/lib/utils";

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
  const { data: budgetData, isLoading } = useQuery<BudgetData>({
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

  const checkingBalance = budgetData?.checkingBalance ?? 0;

  const metrics = [
    {
      title: "Saldo Conta Corrente",
      value: checkingBalance,
      hint: "Livre para gastos ou FIV",
      icon: Wallet,
      tint: "text-primary",
      chip: "bg-primary/10",
      valueClass: checkingBalance >= 0 ? "text-foreground" : "text-expense",
    },
    {
      title: "Saldo VA/VR",
      value: budgetData?.benefitsBalance ?? 0,
      hint: "Exclusivo para alimentação",
      icon: Utensils,
      tint: "text-amber-500",
      chip: "bg-amber-500/10",
      valueClass: "text-foreground",
    },
    {
      title: "Despesas em Dinheiro",
      value: budgetData?.checkingExpenses ?? 0,
      hint: "Gastos pagos da conta",
      icon: TrendingDown,
      tint: "text-expense",
      chip: "bg-expense/10",
      valueClass: "text-expense",
    },
    {
      title: "Economizado (Reserva)",
      value: budgetData?.savingsOnly ?? 0,
      hint: "Investido no mês",
      icon: PiggyBank,
      tint: "text-primary",
      chip: "bg-primary/10",
      valueClass: "text-foreground",
    },
    {
      title: "Projeto FIV",
      value: budgetData?.fivOnly ?? 0,
      hint: "Aportado no mês",
      icon: Sparkles,
      tint: "text-rose-500",
      chip: "bg-rose-500/10",
      valueClass: "text-foreground",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card
            key={metric.title}
            className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110", metric.chip)}>
                <Icon className={cn("h-5 w-5", metric.tint)} />
              </div>
            </div>
            <p className={cn("mt-3 text-2xl font-bold tabular-nums tracking-tight", metric.valueClass)}>
              {formatCurrency(metric.value)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
          </Card>
        );
      })}
    </div>
  );
};
