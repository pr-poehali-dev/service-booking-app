import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!login || !password) {
      setError("Введите логин и пароль");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(func2url.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "x7k2m9", login, password }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("user_role", "admin");
        navigate("/admin_panel");
      } else {
        setError(data.error || "Неверный логин или пароль");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-secondary border border-border mb-4">
            <Icon name="Shield" size={26} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Панель управления</h1>
          <p className="text-muted-foreground text-sm mt-1">Вход для сотрудников</p>
        </div>

        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Логин"
            value={login}
            autoComplete="username"
            onChange={(e) => setLogin(e.target.value)}
            className="bg-card border-border text-foreground h-12 rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            autoFocus
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            className="bg-card border-border text-foreground h-12 rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {error && (
            <p className="text-destructive text-sm flex items-center gap-1.5">
              <Icon name="AlertCircle" size={14} />
              {error}
            </p>
          )}
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl text-base mt-1"
          >
            {loading ? "Входим..." : "Войти"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;