import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, Wallet, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format, addMonths, subMonths, isSameMonth } from "date-fns";
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
  const isCurrentMonth = isSameMonth(currentDate, new Date());

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

  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-30 border-b border-border/60">
        <div className="container mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-primary">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="leading-tight">
                <h1 className="text-lg font-bold tracking-tight sm:text-xl">FinanceControl</h1>
                <p className="hidden text-xs text-muted-foreground sm:block">Controle financeiro inteligente</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-0.5 pr-3 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[140px] truncate text-sm font-medium md:inline">
                      {user.email}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-xs font-normal text-muted-foreground">Conectado como</span>
                    <span className="truncate text-sm">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair da conta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-secondary"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-secondary/60 px-4 py-1.5">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold capitalize tabular-nums">
                {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-secondary"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isCurrentMonth && (
              <Button
                variant="outline"
                size="sm"
                className="ml-2 h-8 rounded-full text-xs"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          <div className="animate-fade-up">
            <Dashboard selectedMonth={selectedMonth} selectedYear={selectedYear} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="animate-fade-up" style={{ animationDelay: "80ms" }}>
                <Goals />
              </div>
              <div className="grid animate-fade-up gap-6 md:grid-cols-2" style={{ animationDelay: "120ms" }}>
                <BudgetChart selectedMonth={selectedMonth} selectedYear={selectedYear} />
                <BudgetLimits selectedMonth={selectedMonth} selectedYear={selectedYear} />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
                <Suggestions selectedMonth={selectedMonth} selectedYear={selectedYear} />
              </div>
              <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
                <TransactionList selectedMonth={selectedMonth} selectedYear={selectedYear} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="animate-fade-up lg:sticky lg:top-32" style={{ animationDelay: "120ms" }}>
                <AddTransactionForm />
                <div className="mt-6">
                  <BankConnection />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
