import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { Button } from "@/components/ui/button";
import { LogOut, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dashboard } from "@/components/Dashboard";
import { TransactionList } from "@/components/TransactionList";
import { AddTransactionForm } from "@/components/AddTransactionForm";
import { BudgetChart } from "@/components/BudgetChart";
import { BudgetLimits } from "@/components/BudgetLimits";
import { Suggestions } from "@/components/Suggestions";
import { BankConnection } from "@/components/BankConnection";
import { Goals } from "@/components/Goals";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        setUser({ id: currentUser.userId, email: attributes.email || currentUser.username });
      } catch (err) {
        navigate("/auth");
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso!");
      navigate("/auth");
    } catch (error) {
      toast.error("Erro ao sair.");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">FinanceControl</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
          
          <div className="flex items-center justify-center mt-6 gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold w-48 text-center capitalize">
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <Dashboard selectedMonth={selectedMonth} selectedYear={selectedYear} />
          
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Goals />
              <div className="grid gap-6 md:grid-cols-2">
                <BudgetChart selectedMonth={selectedMonth} selectedYear={selectedYear} />
                <BudgetLimits selectedMonth={selectedMonth} selectedYear={selectedYear} />
              </div>
              <Suggestions selectedMonth={selectedMonth} selectedYear={selectedYear} />
              <TransactionList selectedMonth={selectedMonth} selectedYear={selectedYear} />
            </div>
            <div className="space-y-6">
              <BankConnection />
              <AddTransactionForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
