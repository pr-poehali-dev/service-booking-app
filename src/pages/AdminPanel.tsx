import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface UserHistory {
  date: string;
  action: string;
}

interface UserRecord {
  id: string;
  name: string;
  phone: string;
  cars: string[];
  history: UserHistory[];
  createdAt: string;
}

interface Booking {
  id: string;
  userName: string;
  phone: string;
  car: string;
  dateTime: string;
  comment: string;
  createdAt: string;
}

const BOOKINGS_KEY = "autoservice_bookings";
const USERS_KEY = "autoservice_users";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatDateTime = (dt: string) => {
  if (!dt) return "—";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    setUsers(JSON.parse(localStorage.getItem(USERS_KEY) || "[]"));
    setBookings(JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-2xl mx-auto pb-8">
        <div className="relative pt-6 px-4 pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-10 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
                <Icon name="Shield" size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Админ-панель</h1>
                <p className="text-xs text-muted-foreground">Управление сервисом</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <Icon name="ArrowLeft" size={18} className="mr-1" />
              На сайт
            </Button>
          </div>
        </div>

        <div className="px-4 mb-4 grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Users" size={18} className="text-primary" />
              <span className="text-sm text-muted-foreground">Пользователи</span>
            </div>
            <p className="text-2xl font-bold">{users.length}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="ClipboardList" size={18} className="text-accent" />
              <span className="text-sm text-muted-foreground">Заявки</span>
            </div>
            <p className="text-2xl font-bold">{bookings.length}</p>
          </Card>
        </div>

        <div className="px-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm border border-border/50 mb-4">
              <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary">
                <Icon name="Users" size={16} className="mr-2" />
                Пользователи
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary">
                <Icon name="ClipboardList" size={16} className="mr-2" />
                Заявки
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-3 animate-fade-in">
              {users.length === 0 ? (
                <Card className="p-8 text-center bg-card/50 border-border/50">
                  <Icon name="UserX" size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Пользователей пока нет</p>
                  <p className="text-xs text-muted-foreground mt-1">Они появятся после первой заявки</p>
                </Card>
              ) : (
                users.map((user) => (
                  <Card key={user.id} className="p-4 bg-card/80 border-border/50 hover:border-primary/30 transition-all cursor-pointer" onClick={() => setSelectedUser(user)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
                          <Icon name="User" size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {user.cars.length} авто
                        </Badge>
                        <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="bookings" className="space-y-3 animate-fade-in">
              {bookings.length === 0 ? (
                <Card className="p-8 text-center bg-card/50 border-border/50">
                  <Icon name="CalendarX" size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Заявок пока нет</p>
                  <p className="text-xs text-muted-foreground mt-1">Они появятся после записи на обслуживание</p>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="p-4 bg-card/80 border-border/50 hover:border-accent/30 transition-all cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon name="User" size={16} className="text-muted-foreground" />
                        <span className="font-semibold text-sm">{booking.userName}</span>
                      </div>
                      <Badge className="bg-gradient-to-r from-accent to-primary border-0 text-xs">
                        {formatDateTime(booking.dateTime)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="Car" size={12} />
                        {booking.car || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="Phone" size={12} />
                        {booking.phone}
                      </span>
                    </div>
                    {booking.comment && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        {booking.comment}
                      </p>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-card border-border max-w-[90vw] sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="User" size={20} className="text-primary" />
              {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Phone" size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Телефон:</span>
                  <span className="font-medium">{selectedUser.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Calendar" size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Зарегистрирован:</span>
                  <span className="font-medium">{formatDate(selectedUser.createdAt)}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Icon name="Car" size={16} className="text-secondary" />
                  Автомобили
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.cars.filter(Boolean).map((car, i) => (
                    <Badge key={i} variant="secondary" className="bg-secondary/20 text-secondary border-secondary/30">
                      {car}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Icon name="History" size={16} className="text-accent" />
                  История обращений
                </h4>
                {selectedUser.history.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.history.map((h, i) => (
                      <div key={i} className="p-2 rounded-lg bg-muted/20 flex items-start gap-2">
                        <Badge variant="outline" className="text-xs shrink-0 mt-0.5">
                          {formatDate(h.date)}
                        </Badge>
                        <span className="text-sm">{h.action}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Нет записей</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="bg-card border-border max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="ClipboardList" size={20} className="text-accent" />
              Заявка
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/20 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="User" size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Клиент:</span>
                  <span className="font-medium">{selectedBooking.userName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Phone" size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Телефон:</span>
                  <span className="font-medium">{selectedBooking.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Car" size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Автомобиль:</span>
                  <span className="font-medium">{selectedBooking.car || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Calendar" size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">Дата и время:</span>
                  <Badge className="bg-gradient-to-r from-primary to-secondary border-0 text-xs">
                    {formatDateTime(selectedBooking.dateTime)}
                  </Badge>
                </div>
              </div>
              {selectedBooking.comment && (
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                    <Icon name="MessageSquare" size={14} className="text-accent" />
                    Проблема / комментарий
                  </h4>
                  <p className="text-sm text-muted-foreground">{selectedBooking.comment}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Заявка создана: {formatDate(selectedBooking.createdAt)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
