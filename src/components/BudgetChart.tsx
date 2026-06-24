import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from 'aws-amplify/auth';
import axios from 'axios';

interface CategoryData {
  name: string;
  value: number;
  color: string;
  recommended: number;
}

export const BudgetChart = () => {
  const { data: chartData } = useQuery<CategoryData[]>({
    queryKey: ["budget-chart"],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      const response = await axios.get('/api/transactions');
      const allTransactions: any[] = response.data;
      
      const transactions = allTransactions.filter(t => t.type === 'expense');

      const totalExpenses = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 1;

      const validExpenses = transactions?.filter(t => t.type === "expense" && t.category !== "discounts") || [];

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
        },
        {
          name: "Gastos Variáveis",
          value: categoryData.variable,
          color: "hsl(var(--chart-2))",
          recommended: 20,
        },
        {
          name: "Economia/Investimentos",
          value: categoryData.savings,
          color: "hsl(var(--chart-3))",
          recommended: 10,
        },
        {
          name: "Dízimo",
          value: categoryData.tithe,
          color: "hsl(var(--chart-4))",
          recommended: 10,
        },
        {
          name: "Projeto FIV",
          value: categoryData.fiv,
          color: "hsl(var(--chart-5))",
          recommended: 10,
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
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
              <span className="text-muted-foreground">
                Recomendado: {item.recommended}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
