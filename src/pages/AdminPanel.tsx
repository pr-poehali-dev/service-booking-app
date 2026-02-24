import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

type Tab = "users" | "bookings" | "sms";

const AdminPanel = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("admin_token") || "";
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState<Stats>({ users: 0, bookings: 0, broadcasts: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [smsText, setSmsText] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsResult, setSmsResult] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadAll();
  }, [token]);

  const headers = { "Content-Type": "application/json", "X-Auth-Token": token };

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

  const sendBroadcast = async () => {
    if (!smsText.trim()) return;
    setSmsSending(true);
    setSmsResult("");
    try {
      const res = await fetch(`${func2url.admin}/sms-broadcast`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: smsText }),
      });
      const data = await res.json();
      setSmsResult(data.message || "Готово");
      setSmsText("");
      loadAll();
    } catch {
      setSmsResult("Ошибка отправки");
    } finally {
      setSmsSending(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Icon name="Shield" size={16} className="text-black" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">Админ-панель</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">АвтоСервис</p>
          </div>
        </div>
        <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="LogOut" size={18} />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-28">
        {/* Stats */}
        <div className="pt-5 grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Клиентов", value: stats.users, icon: "Users" },
            { label: "Заявок", value: stats.bookings, icon: "ClipboardList" },
            { label: "Рассылок", value: stats.broadcasts, icon: "MessageSquare" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-2xl bg-card border border-border text-center">
              <Icon name={s.icon} size={18} className="text-primary mx-auto mb-1" />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* TAB: users */}
        {tab === "users" && (
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-lg font-bold">Клиенты</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-card animate-pulse" />)}
              </div>
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

        {/* TAB: bookings */}
        {tab === "bookings" && (
          <div className="space-y-3 animate-fade-in">
            <h2 className="text-lg font-bold">Заявки</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)}
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-12 text-center">
                <Icon name="ClipboardList" size={40} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Заявок пока нет</p>
              </div>
            ) : (
              bookings.map((b) => {
                const st = STATUS_LABELS[b.status] || STATUS_LABELS.new;
                return (
                  <div key={b.id} className="p-4 rounded-2xl bg-card border border-border">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-sm">{b.user_name || "Клиент"}</p>
                        <p className="text-xs text-muted-foreground">{b.phone}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    {b.service && (
                      <p className="text-xs text-primary font-medium mb-1 flex items-center gap-1">
                        <Icon name="Wrench" size={11} />
                        {b.service}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {b.car_label && (
                        <span className="flex items-center gap-1">
                          <Icon name="Car" size={11} />
                          {b.car_label}
                        </span>
                      )}
                      {b.scheduled_at && (
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size={11} />
                          {fmt(b.scheduled_at)}
                        </span>
                      )}
                    </div>
                    {b.comment && (
                      <p className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-2 py-1.5">
                        {b.comment}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Создана: {fmt(b.created_at)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB: sms */}
        {tab === "sms" && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-lg font-bold">SMS-рассылка</h2>
              <p className="text-sm text-muted-foreground">Сообщение получат все {stats.users} клиентов</p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Текст сообщения</label>
                <Textarea
                  placeholder="Напишите текст акции или уведомления..."
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  className="bg-background border-border rounded-xl resize-none"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{smsText.length} символов</p>
              </div>

              {smsResult && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-sm text-primary font-medium flex items-center gap-2">
                    <Icon name="Check" size={14} />
                    {smsResult}
                  </p>
                </div>
              )}

              <Button
                onClick={sendBroadcast}
                disabled={smsSending || !smsText.trim() || stats.users === 0}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl"
              >
                {smsSending ? "Отправляем..." : `Разослать ${stats.users} клиентам`}
              </Button>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <Icon name="Info" size={14} className="shrink-0 mt-0.5 text-primary" />
                В демо-режиме рассылка сохраняется в базе данных. Для реальной отправки SMS нужно подключить провайдера (СМСЦентр, СМСПИЛОТ и др.)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex">
          {(
            [
              { key: "users", icon: "Users", label: "Клиенты" },
              { key: "bookings", icon: "ClipboardList", label: "Заявки" },
              { key: "sms", icon: "MessageSquare", label: "Рассылка" },
            ] as { key: Tab; icon: string; label: string }[]
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                tab === item.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User detail dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-card border-border max-w-[90vw] sm:max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="User" size={18} className="text-primary" />
              {selectedUser?.name || "Клиент"}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              {/* Основные данные */}
              <div className="p-3 rounded-xl bg-background space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Phone" size={13} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Телефон:</span>
                  <span className="font-medium">{selectedUser.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Calendar" size={13} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Зарегистрирован:</span>
                  <span className="font-medium">{fmt(selectedUser.created_at)}</span>
                </div>
              </div>

              {/* Автомобили */}
              {selectedUser.cars.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Icon name="Car" size={14} className="text-primary" />
                    Автомобили
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.cars.map((car, i) => (
                      <Badge key={i} variant="outline" className="border-primary/30 text-primary bg-primary/5">
                        {car}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* История заявок */}
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Icon name="ClipboardList" size={14} className="text-primary" />
                  История заявок ({selectedUser.bookings.length})
                </p>
                {selectedUser.bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет заявок</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.bookings.map((b) => {
                      const st = STATUS_LABELS[b.status] || STATUS_LABELS.new;
                      return (
                        <div key={b.id} className="p-3 rounded-xl bg-background border border-border">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-xs font-semibold">{b.service || "Услуга"}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${st.color}`}>
                              {st.label}
                            </span>
                          </div>
                          {b.car_label && (
                            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <Icon name="Car" size={10} />
                              {b.car_label}
                            </p>
                          )}
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {b.scheduled_at && (
                              <span className="flex items-center gap-1">
                                <Icon name="Calendar" size={10} />
                                {fmt(b.scheduled_at)}
                              </span>
                            )}
                            <span>{fmt(b.created_at)}</span>
                          </div>
                          {b.comment && (
                            <p className="mt-1.5 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                              {b.comment}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
