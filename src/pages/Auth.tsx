import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signUp, getCurrentUser } from 'aws-amplify/auth';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Wallet, Eye, EyeOff, PieChart, Target, ShieldCheck } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        await getCurrentUser();
        navigate("/");
      } catch (err) {
        // Usuário não está logado
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          }
        }
      });
      toast.success("Conta criada com sucesso! Verifique seu email se necessário e faça login.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      await signIn({
        username: email,
        password,
      });
      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: PieChart, title: "Orçamento 50/20/10/10/10", desc: "Acompanhe a distribuição ideal da sua renda." },
    { icon: Target, title: "Metas financeiras", desc: "Defina objetivos e veja o progresso em tempo real." },
    { icon: ShieldCheck, title: "Seus dados protegidos", desc: "Autenticação segura para sua tranquilidade." },
  ];

  const renderPasswordField = (id: string) => (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShowPassword((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-primary p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-black/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Wallet className="h-7 w-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight">FinanceControl</span>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold leading-tight">
              Domine suas finanças<br />com clareza e foco.
            </h2>
            <p className="max-w-md text-white/80">
              Visualize seu orçamento, organize gastos por categoria e alcance suas metas — tudo em um só lugar.
            </p>
          </div>

          <div className="space-y-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="text-sm text-white/75">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-sm text-white/60">© {new Date().getFullYear()} FinanceControl</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-8">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-primary">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold">FinanceControl</h1>
          </div>

          <Card className="border-border/70 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
              <CardDescription>Entre ou crie sua conta para continuar</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Criar Conta</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Senha</Label>
                      {renderPasswordField("signin-password")}
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      {renderPasswordField("signup-password")}
                      <p className="text-xs text-muted-foreground">Use ao menos 8 caracteres.</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Criando conta..." : "Criar Conta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
