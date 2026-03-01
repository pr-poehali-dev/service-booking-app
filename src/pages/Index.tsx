import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import func2url from "../../backend/func2url.json";

interface Car {
  id: string | number;
  brand: string;
  model: string;
  year: string;
  last_oil_change: string;
  next_oil_change: string;
}

interface Booking {
  id: number;
  car_label: string;
  service: string;
  scheduled_at: string | null;
  comment: string;
  status: string;
  created_at: string;
}

const SERVICE_TYPES = [
  { id: "oil-change", label: "Замена масла" },
  { id: "fluid-change", label: "Аппаратная замена технических жидкостей" },
  { id: "power-steering", label: "Замена масла в гидроусилителе руля" },
  { id: "axle-oil", label: "Замена масла в мостах (РЕДУКТОР)" },
  { id: "coolant", label: "Замена охлаждающей жидкости (АНТИФРИЗ)" },
  { id: "filters", label: "Замена фильтров" },
  { id: "transmission", label: "Замена масла в АКПП, ВАРИАТОР" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Новая", color: "bg-primary/20 text-primary border-primary/30" },
  in_progress: { label: "В работе", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  done: { label: "Выполнена", color: "bg-green-500/20 text-green-400 border-green-500/30" },
};

const formatDT = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const getMinDT = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

type Tab = "home" | "booking" | "history" | "contacts";

const Index = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");
  const userPhone = localStorage.getItem("user_phone") || "";
  const [userName, setUserName] = useState(localStorage.getItem("user_name") || "");

  const [tab, setTab] = useState<Tab>("home");
  const [cars, setCars] = useState<Car[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string>("");
  const [carDialogOpen, setCarDialogOpen] = useState(false);
  const [newCar, setNewCar] = useState({ brand: "", model: "", year: "", last_oil_change: "", next_oil_change: "" });
  const [bookingDate, setBookingDate] = useState("");
  const [bookingService, setBookingService] = useState("oil-change");
  const [bookingComment, setBookingComment] = useState("");
  const [bookingSent, setBookingSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameInput, setNameInput] = useState(localStorage.getItem("user_name") || "");
  const [nameSaving, setNameSaving] = useState(false);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch(`${func2url.profile}?user_id=${userId}`);
      const data = await res.json();
      if (data.user) {
        const name = data.user.name || "";
        setUserName(name);
        localStorage.setItem("user_name", name);
      }
      setCars(data.cars || []);
      setBookings(data.bookings || []);
      if (data.cars?.length > 0) setSelectedCarId(String(data.cars[0].id));
    } catch {
      // offline fallback
    } finally {
      setProfileLoading(false);
    }
  };

  const selectedCar = cars.find((c) => String(c.id) === selectedCarId) || cars[0];
  const selectedServiceLabel = SERVICE_TYPES.find((s) => s.id === bookingService)?.label || "";

  const addCar = async () => {
    if (!newCar.brand || !newCar.model) return;
    try {
      const res = await fetch(`${func2url.profile}/cars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: Number(userId), ...newCar }),
      });
      const data = await res.json();
      if (data.ok) {
        const car: Car = { id: data.car_id, ...newCar };
        setCars((prev) => [...prev, car]);
        setSelectedCarId(String(data.car_id));
        setNewCar({ brand: "", model: "", year: "", last_oil_change: "", next_oil_change: "" });
        setCarDialogOpen(false);
      }
    } catch {
      // ignore
    }
  };

  const handleBooking = async () => {
    if (!bookingDate) return;
    setLoading(true);
    try {
      const res = await fetch(func2url.bookings, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          phone: userPhone,
          user_name: userName,
          car_label: selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : "",
          service: selectedServiceLabel,
          scheduled_at: new Date(bookingDate).toISOString(),
          comment: bookingComment,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setBookingSent(true);
        setBookingComment("");
        setBookingDate("");
        await loadProfile();
        setTimeout(() => setBookingSent(false), 4000);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    if (!nameInput.trim()) return;
    setNameSaving(true);
    try {
      const res = await fetch(`${func2url.profile}/name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: Number(userId), name: nameInput.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setUserName(nameInput.trim());
        localStorage.setItem("user_name", nameInput.trim());
        setNameEditing(false);
      }
    } catch {
      // ignore
    } finally {
      setNameSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_phone");
    localStorage.removeItem("user_name");
    navigate("/login");
  };

  const CONTACTS = {
    address: "Анивская улица, 145, Южно-Сахалинск",
    phone: "+7 (900) 660-37-37",
    gis: "https://2gis.ru",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Icon name="Wrench" size={16} className="text-black" />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">АвтоСервис</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">{userPhone}</p>
          </div>
        </div>
        <button onClick={logout} className="text-muted-foreground hover:text-foreground transition-colors">
          <Icon name="LogOut" size={18} />
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pb-28">
        {/* TAB: home (Профиль) */}
        {tab === "home" && (
          <div className="pt-5 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold">Профиль</h2>
              <p className="text-muted-foreground text-sm">{userPhone}</p>
            </div>

            {/* ФИО */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="User" size={16} className="text-primary" />
                  <p className="font-semibold text-sm">ФИО</p>
                </div>
                {!nameEditing && (
                  <button
                    onClick={() => { setNameInput(userName); setNameEditing(true); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Изменить
                  </button>
                )}
              </div>
              {nameEditing ? (
                <div className="flex gap-2">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Введите ФИО"
                    className="bg-background border-border rounded-xl h-10 text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                  />
                  <Button
                    onClick={saveName}
                    disabled={nameSaving || !nameInput.trim()}
                    className="h-10 px-4 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl text-sm shrink-0"
                  >
                    {nameSaving ? "..." : "Сохранить"}
                  </Button>
                  <button
                    onClick={() => setNameEditing(false)}
                    className="h-10 px-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <Icon name="X" size={16} />
                  </button>
                </div>
              ) : (
                <p className="text-foreground">{userName || <span className="text-muted-foreground italic">Не указано</span>}</p>
              )}
            </div>

            {/* Последнее обращение */}
            {(() => {
              const lastBooking = bookings[0];
              return (
                <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="History" size={16} className="text-primary" />
                    <p className="font-semibold text-sm">Последнее обращение</p>
                  </div>
                  {profileLoading ? (
                    <div className="h-8 rounded-lg bg-muted animate-pulse" />
                  ) : lastBooking ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{lastBooking.service}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {lastBooking.car_label && (
                          <span className="flex items-center gap-1">
                            <Icon name="Car" size={11} />
                            {lastBooking.car_label}
                          </span>
                        )}
                        {lastBooking.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Icon name="Calendar" size={11} />
                            {formatDT(lastBooking.scheduled_at)}
                          </span>
                        )}
                      </div>
                      {(() => {
                        const st = STATUS_LABELS[lastBooking.status] || STATUS_LABELS.new;
                        return (
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Обращений пока не было</p>
                  )}
                </div>
              );
            })()}

            {/* Контакты сервиса */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="MapPin" size={16} className="text-primary" />
                <p className="font-semibold text-sm">Контакты сервиса</p>
              </div>
              <a href="tel:+79147571707" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon name="Phone" size={15} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Телефон</p>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">+7 (914) 757-17-07</p>
                </div>
              </a>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Icon name="Navigation" size={15} className="text-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Адрес</p>
                  <p className="font-semibold text-sm">Южно-Сахалинск, Анивская ул., д.145</p>
                </div>
              </div>
            </div>

            {/* Авто */}
            <div>
              <p className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Icon name="Car" size={16} className="text-primary" />
                Мои автомобили
              </p>
              {profileLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-card animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {cars.map((car) => (
                    <div
                      key={car.id}
                      onClick={() => setSelectedCarId(String(car.id))}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        String(car.id) === selectedCarId
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${String(car.id) === selectedCarId ? "bg-primary" : "bg-secondary"}`}>
                            <Icon name="Car" size={18} className={String(car.id) === selectedCarId ? "text-black" : "text-foreground"} />
                          </div>
                          <div>
                            <p className="font-semibold">{car.brand} {car.model}</p>
                            <p className="text-xs text-muted-foreground">{car.year || "год не указан"}</p>
                          </div>
                        </div>
                        {String(car.id) === selectedCarId && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Icon name="Check" size={12} className="text-black" />
                          </div>
                        )}
                      </div>
                      {(car.last_oil_change || car.next_oil_change) && (
                        <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Последняя замена</p>
                            <p className="text-xs font-medium">{car.last_oil_change || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Следующая замена</p>
                            <p className="text-xs font-medium text-primary">{car.next_oil_change || "—"}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={() => setCarDialogOpen(true)}
                    className="w-full p-4 rounded-2xl border border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary flex items-center justify-center gap-2 transition-all"
                  >
                    <Icon name="Plus" size={18} />
                    <span className="text-sm font-medium">Добавить автомобиль</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: booking */}
        {tab === "booking" && (
          <div className="pt-5 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold">Запись на обслуживание</h2>
              <p className="text-muted-foreground text-sm">Выберите услугу и дату</p>
            </div>

            {bookingSent ? (
              <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                <div className="w-14 h-14 rounded-full bg-primary mx-auto flex items-center justify-center mb-3">
                  <Icon name="Check" size={28} className="text-black" />
                </div>
                <p className="font-bold text-lg">Заявка принята!</p>
                <p className="text-sm text-muted-foreground mt-1">Мы свяжемся с вами для подтверждения</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Авто */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">Автомобиль</label>
                  {cars.length === 0 ? (
                    <button
                      onClick={() => { setTab("home"); setCarDialogOpen(true); }}
                      className="w-full p-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                    >
                      Добавьте автомобиль в разделе «Профиль»
                    </button>
                  ) : (
                    <Select value={selectedCarId} onValueChange={setSelectedCarId}>
                      <SelectTrigger className="bg-card border-border h-11 rounded-xl">
                        <SelectValue placeholder="Выберите авто" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {cars.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.brand} {c.model} {c.year ? `(${c.year})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Услуга */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">Вид услуги</label>
                  <Select value={bookingService} onValueChange={setBookingService}>
                    <SelectTrigger className="bg-card border-border h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {SERVICE_TYPES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Дата */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">Дата и время</label>
                  <Input
                    type="datetime-local"
                    value={bookingDate}
                    min={getMinDT()}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="bg-card border-border h-11 rounded-xl"
                  />
                </div>

                {/* Комментарий */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">Комментарий (необязательно)</label>
                  <Textarea
                    placeholder="Опишите проблему или пожелания..."
                    value={bookingComment}
                    onChange={(e) => setBookingComment(e.target.value)}
                    className="bg-card border-border rounded-xl resize-none"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={loading || !bookingDate}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl text-base"
                >
                  {loading ? "Отправляем..." : "Записаться"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB: history */}
        {tab === "history" && (
          <div className="pt-5 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold">История обращений</h2>
              <p className="text-muted-foreground text-sm">{bookings.length} заявок</p>
            </div>

            {profileLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-card animate-pulse" />)}
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-16 text-center">
                <Icon name="ClipboardList" size={48} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Заявок пока нет</p>
                <button
                  onClick={() => setTab("booking")}
                  className="mt-3 text-primary text-sm hover:underline"
                >
                  Записаться на обслуживание
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => {
                  const st = STATUS_LABELS[b.status] || STATUS_LABELS.new;
                  return (
                    <div key={b.id} className="p-4 rounded-2xl bg-card border border-border">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-sm">{b.service || "Услуга не указана"}</p>
                          {b.car_label && (
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Icon name="Car" size={12} />
                              {b.car_label}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {b.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Icon name="Calendar" size={11} />
                            {formatDT(b.scheduled_at)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Icon name="Clock" size={11} />
                          {formatDT(b.created_at)}
                        </span>
                      </div>
                      {b.comment && (
                        <p className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-2 py-1.5">
                          {b.comment}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: contacts */}
        {tab === "contacts" && (
          <div className="pt-5 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold">Контакты</h2>
              <p className="text-muted-foreground text-sm">АвтоСервис — замена масел</p>
            </div>

            <div className="space-y-3">
              <a href={`tel:${CONTACTS.phone}`} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Icon name="Phone" size={18} className="text-black" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Телефон</p>
                  <p className="font-semibold">{CONTACTS.phone}</p>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Icon name="MapPin" size={18} className="text-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Адрес</p>
                  <p className="font-semibold text-sm">{CONTACTS.address}</p>
                </div>
              </div>

              <a href={CONTACTS.gis} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Icon name="Navigation" size={18} className="text-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Построить маршрут</p>
                  <p className="font-semibold text-sm">Открыть в 2GIS</p>
                </div>
                <Icon name="ExternalLink" size={16} className="text-muted-foreground ml-auto" />
              </a>

              <div className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Icon name="Clock" size={18} className="text-foreground" />
                  </div>
                  <p className="font-semibold">Режим работы</p>
                </div>
                <div className="space-y-1.5 text-sm">
                  {[
                    { days: "Пн — Пт", hours: "09:00 — 19:00" },
                    { days: "Суббота", hours: "10:00 — 17:00" },
                    { days: "Воскресенье", hours: "Выходной" },
                  ].map((row) => (
                    <div key={row.days} className="flex justify-between">
                      <span className="text-muted-foreground">{row.days}</span>
                      <span className={row.hours === "Выходной" ? "text-muted-foreground" : "font-medium"}>{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-md mx-auto flex">
          {(
            [
              { key: "home", icon: "User", label: "Профиль" },
              { key: "booking", icon: "Calendar", label: "Запись" },
              { key: "history", icon: "ClipboardList", label: "История" },
              { key: "contacts", icon: "Phone", label: "Контакты" },
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

      {/* Add car dialog */}
      <Dialog open={carDialogOpen} onOpenChange={setCarDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[90vw] sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Добавить автомобиль</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Марка (Toyota, BMW...)" value={newCar.brand} onChange={(e) => setNewCar((p) => ({ ...p, brand: e.target.value }))} className="bg-background border-border rounded-xl" />
            <Input placeholder="Модель (Camry, X5...)" value={newCar.model} onChange={(e) => setNewCar((p) => ({ ...p, model: e.target.value }))} className="bg-background border-border rounded-xl" />
            <Input placeholder="Год выпуска" value={newCar.year} onChange={(e) => setNewCar((p) => ({ ...p, year: e.target.value }))} className="bg-background border-border rounded-xl" />
            <Input placeholder="Дата последней замены масла" value={newCar.last_oil_change} onChange={(e) => setNewCar((p) => ({ ...p, last_oil_change: e.target.value }))} className="bg-background border-border rounded-xl" />
            <Input placeholder="Дата следующей замены масла" value={newCar.next_oil_change} onChange={(e) => setNewCar((p) => ({ ...p, next_oil_change: e.target.value }))} className="bg-background border-border rounded-xl" />
            <Button onClick={addCar} disabled={!newCar.brand || !newCar.model} className="w-full bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl">
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;