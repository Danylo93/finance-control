import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';
import { PieChart as PieChartIcon } from "lucide-react";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  recommended: number;
  percentageText: string;
}

interface BudgetChartProps {
  selectedMonth: number;
  selectedYear: number;
}

export const BudgetChart = ({ selectedMonth, selectedYear }: BudgetChartProps) => {
  const { data: chartData } = useQuery<CategoryData[]>({
    queryKey: ["budget-chart", selectedMonth, selectedYear],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get('/api/transactions');
      const allTransactions: any[] = response.data.filter((t: any) => {
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });
      
      const transactions = allTransactions.filter(t => t.account === 'checking');
      
      const grossIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const discounts = transactions
        .filter(t => t.type === 'expense' && t.category === 'discounts')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const netIncome = grossIncome - discounts;
      const safeNetIncome = netIncome > 0 ? netIncome : 1;
      const safeGrossIncome = grossIncome > 0 ? grossIncome : 1;

      const validExpenses = transactions.filter(t => t.type === 'expense' && t.category !== "discounts");

      const categoryData = {
        fixed: validExpenses.filter(t => t.category === "fixed_expenses")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        variable: validExpenses.filter(t => t.category === "variable_expenses")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        savings: validExpenses.filter(t => t.category === "savings")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        tithe: validExpenses.filter(t => t.category === "tithe")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
        fiv: validExpenses.filter(t => t.category === "fiv")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0,
      };

      return [
        {
          name: "Gastos Fixos",
          value: categoryData.fixed,
          color: "hsl(var(--chart-1))",
          recommended: 50,
          percentageText: `${((categoryData.fixed / safeNetIncome) * 100).toFixed(1)}% do Líquido`
        },
        {
          name: "Gastos Variáveis",
          value: categoryData.variable,
          color: "hsl(var(--chart-2))",
          recommended: 20,
          percentageText: `${((categoryData.variable / safeNetIncome) * 100).toFixed(1)}% do Líquido`
        },
        {
          name: "Economia/Investimentos",
          value: categoryData.savings,
          color: "hsl(var(--chart-3))",
          recommended: 10,
          percentageText: `${((categoryData.savings / safeNetIncome) * 100).toFixed(1)}% do Líquido`
        },
        {
          name: "Dízimo",
          value: categoryData.tithe,
          color: "hsl(var(--chart-4))",
          recommended: 10,
          percentageText: `${((categoryData.tithe / safeGrossIncome) * 100).toFixed(1)}% do Bruto`
        },
        {
          name: "Projeto FIV",
          value: categoryData.fiv,
          color: "hsl(var(--chart-5))",
          recommended: 10,
          percentageText: `${((categoryData.fiv / safeNetIncome) * 100).toFixed(1)}% do Líquido`
        },
      ];
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Distribuição por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData && chartData.every(item => item.value === 0) ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-center px-4">
            <PieChartIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Nenhum dado neste mês</p>
            <p className="text-sm">Adicione receitas ou despesas para visualizar o gráfico de orçamento.</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, payload }) => `${name}: ${payload.percentageText.split(' ')[0]}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-center mb-4">Padrão Recomendado: 50/20/10/10/10</p>
          {chartData?.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
                <div className="text-right flex flex-col">
                  <span className="font-semibold text-primary">{item.percentageText}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    Recomendado: {item.recommended}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
        )}
      </CardContent>
    </Card>
  );
};
