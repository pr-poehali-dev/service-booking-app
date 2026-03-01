import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import func2url from "../../backend/func2url.json";

interface UserBooking {
  id: number;
  car_label: string;
  service: string;
  scheduled_at: string | null;
  comment: string;
  status: string;
  created_at: string;
}

interface AdminUser {
  id: number;
  phone: string;
  name: string;
  created_at: string;
  bookings_count: number;
  cars: string[];
  bookings: UserBooking[];
}

interface AdminBooking {
  id: number;
  user_name: string;
  phone: string;
  car_label: string;
  service: string;
  scheduled_at: string | null;
  comment: string;
  status: string;
  created_at: string;
}

interface Stats {
  users: number;
  bookings: number;
  broadcasts: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Новая", color: "bg-primary/20 text-primary border-primary/30" },
  in_progress: { label: "В работе", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  done: { label: "Выполнена", color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const fmt = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

type Tab = "users" | "bookings";

const AdminPanel = ({ token, onLogout }: { token: string; onLogout: () => void }) => {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState<Stats>({ users: 0, bookings: 0, broadcasts: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const headers = { "Content-Type": "application/json", "X-Auth-Token": token };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersRes, bookingsRes, statsRes] = await Promise.all([
        fetch(`${func2url.admin}/users`, { headers }),
        fetch(`${func2url.admin}/bookings`, { headers }),
        fetch(`${func2url.admin}/stats`, { headers }),
      ]);
      const ud = await usersRes.json();
      const bd = await bookingsRes.json();
      const sd = await statsRes.json();
      setUsers(ud.users || []);
      setBookings(bd.bookings || []);
      setStats(sd);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Icon name="Shield" size={16} className="text-black" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">Панель управления</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">АвтоСервис</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="LogOut" size={18} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-28">
        <div className="pt-5 grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Клиентов", value: stats.users, icon: "Users" },
            { label: "Заявок", value: stats.bookings, icon: "ClipboardList" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-2xl bg-card border border-border text-center">
              <Icon name={s.icon} size={18} className="text-primary mx-auto mb-1" />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {([["users", "Клиенты", "Users"], ["bookings", "Заявки", "ClipboardList"]] as const).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === id ? "bg-primary text-black" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={icon} size={15} />
              {label}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <div className="space-y-3 animate-fade-in">
            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />)
            ) : users.length === 0 ? (
              <div className="py-12 text-center">
                <Icon name="Users" size={40} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Пока нет клиентов</p>
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="w-full text-left p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon name="User" size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{user.name || "Без имени"}</p>
                        <p className="text-xs text-muted-foreground">{user.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{user.bookings_count} заявок</span>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {tab === "bookings" && (
          <div className="space-y-3 animate-fade-in">
            {loading ? (
              [1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)
            ) : bookings.length === 0 ? (
              <div className="py-12 text-center">
                <Icon name="ClipboardList" size={40} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Заявок пока нет</p>
              </div>
            ) : (
              bookings.map((b) => {
                const st = STATUS_LABELS[b.status] || STATUS_LABELS.new;
                return (
                  <div key={b.id} className="p-4 rounded-2xl bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{b.user_name || "Без имени"}</p>
                        <p className="text-xs text-muted-foreground">{b.phone}</p>
                      </div>
                      <Badge className={`text-xs border ${st.color}`}>{st.label}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p><span className="text-foreground/70">Авто:</span> {b.car_label || "—"}</p>
                      <p><span className="text-foreground/70">Услуга:</span> {b.service}</p>
                      <p><span className="text-foreground/70">Дата:</span> {fmt(b.scheduled_at)}</p>
                      {b.comment && <p><span className="text-foreground/70">Комментарий:</span> {b.comment}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {selectedUser && (
        <Dialog open onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="bg-card border-border max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon name="User" size={14} className="text-primary" />
                </div>
                {selectedUser.name || "Без имени"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Телефон</p>
                <p className="font-medium">{selectedUser.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Зарегистрирован</p>
                <p className="font-medium">{fmt(selectedUser.created_at)}</p>
              </div>
              {selectedUser.cars?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Автомобили</p>
                  <div className="space-y-1">
                    {selectedUser.cars.map((car, i) => (
                      <p key={i} className="font-medium">{car}</p>
                    ))}
                  </div>
                </div>
              )}
              {selectedUser.bookings?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs">История заявок</p>
                  {selectedUser.bookings.map((b) => {
                    const st = STATUS_LABELS[b.status] || STATUS_LABELS.new;
                    return (
                      <div key={b.id} className="p-3 rounded-xl bg-background border border-border space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-xs">{b.service}</p>
                          <Badge className={`text-xs border ${st.color}`}>{st.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{b.car_label} · {fmt(b.scheduled_at)}</p>
                        {b.comment && <p className="text-xs text-muted-foreground">{b.comment}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const AdminLogin = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "");

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
        setToken(data.token);
      } else {
        setError(data.error || "Неверный логин или пароль");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("user_role");
    setToken("");
  };

  if (token) {
    return <AdminPanel token={token} onLogout={handleLogout} />;
  }

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
