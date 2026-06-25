import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex max-w-md flex-col items-center text-center animate-fade-up">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Compass className="h-8 w-8 text-primary" />
        </div>
        <p className="text-6xl font-bold tracking-tight text-gradient">404</p>
        <h1 className="mt-4 text-2xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <Button className="mt-6" onClick={() => navigate("/")}>
          <Home className="mr-2 h-4 w-4" />
          Voltar ao início
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
