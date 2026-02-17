import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Car {
  id: string;
  brand: string;
  model: string;
  year: string;
  lastOilChange: string;
  nextOilChange: string;
}

const STORAGE_KEY = "autoservice_cars";
const SELECTED_CAR_KEY = "autoservice_selected_car";
const BOOKINGS_KEY = "autoservice_bookings";
const USERS_KEY = "autoservice_users";

const loadCars = (): Car[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  const defaultCar: Car = {
    id: "1",
    brand: "Toyota",
    model: "Land Cruiser",
    year: "2023",
    lastOilChange: "21.12.2025",
    nextOilChange: "21.06.2026",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultCar]));
  return [defaultCar];
};

const saveCars = (cars: Car[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
};

const getMinDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [cars, setCars] = useState<Car[]>(loadCars);
  const [selectedCarId, setSelectedCarId] = useState<string>(() => {
    return localStorage.getItem(SELECTED_CAR_KEY) || loadCars()[0]?.id || "";
  });
  const [carDialogOpen, setCarDialogOpen] = useState(false);
  const [newCar, setNewCar] = useState({ brand: "", model: "", year: "", lastOilChange: "", nextOilChange: "" });
  const [bookingDate, setBookingDate] = useState("");
  const [bookingName, setBookingName] = useState("Василий Геннадьевич");
  const [bookingPhone, setBookingPhone] = useState("+7 (900) 660-37-37");
  const [bookingComment, setBookingComment] = useState("");
  const [bookingService, setBookingService] = useState("oil-change");
  const [bookingSent, setBookingSent] = useState(false);

  const selectedCar = cars.find((c) => c.id === selectedCarId) || cars[0];

  const serviceTypes = [
    { id: "oil-change", label: "Заявка на замену масла" },
    { id: "fluid-change", label: "Аппаратная замена технических жидкостей" },
    { id: "power-steering", label: "Замена масла в гидроусилителе руля" },
    { id: "axle-oil", label: "Замена масла в мостах (РЕДУКТОР)" },
    { id: "coolant", label: "Замена охлаждающей жидкости (АНТИФРИЗ)" },
    { id: "filters", label: "Замена фильтров" },
    { id: "transmission", label: "Замена масла в АКПП, ВАРИАТОР" },
  ];

  const selectedServiceLabel = serviceTypes.find((s) => s.id === bookingService)?.label || "";

  const userData = {
    name: "Василий Геннадьевич",
    phone: "+7 (900) 660-37-37",
    address: "Анивская улица, 145, Южно-Сахалинск",
    gisLink: "https://2gis.ru",
  };

  useEffect(() => {
    saveCars(cars);
  }, [cars]);

  useEffect(() => {
    localStorage.setItem(SELECTED_CAR_KEY, selectedCarId);
  }, [selectedCarId]);

  const addCar = () => {
    if (!newCar.brand || !newCar.model) return;
    const car: Car = {
      id: Date.now().toString(),
      brand: newCar.brand,
      model: newCar.model,
      year: newCar.year || new Date().getFullYear().toString(),
      lastOilChange: newCar.lastOilChange || "—",
      nextOilChange: newCar.nextOilChange || "—",
    };
    const updated = [...cars, car];
    setCars(updated);
    setSelectedCarId(car.id);
    setNewCar({ brand: "", model: "", year: "", lastOilChange: "", nextOilChange: "" });
    setCarDialogOpen(false);
  };

  const deleteCar = (id: string) => {
    const updated = cars.filter((c) => c.id !== id);
    setCars(updated);
    if (selectedCarId === id && updated.length > 0) {
      setSelectedCarId(updated[0].id);
    }
  };

  const handleBooking = () => {
    if (!bookingDate || !bookingName || !bookingPhone) return;
    const booking = {
      id: Date.now().toString(),
      userName: bookingName,
      phone: bookingPhone,
      car: selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : "",
      service: selectedServiceLabel,
      dateTime: bookingDate,
      comment: bookingComment,
      createdAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
    existing.push(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(existing));

    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    const existingUser = users.find((u: { phone: string; cars: string[]; history: { date: string; action: string }[] }) => u.phone === bookingPhone);
    if (existingUser) {
      existingUser.cars = [...new Set([...existingUser.cars, selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : ""])];
      existingUser.history.push({ date: new Date().toISOString(), action: `${selectedServiceLabel}${bookingComment ? ` — ${bookingComment}` : ""}` });
    } else {
      users.push({
        id: Date.now().toString(),
        name: bookingName,
        phone: bookingPhone,
        cars: [selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : ""],
        history: [{ date: new Date().toISOString(), action: `${selectedServiceLabel}${bookingComment ? ` — ${bookingComment}` : ""}` }],
        createdAt: new Date().toISOString(),
      });
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    setBookingSent(true);
    setBookingComment("");
    setBookingDate("");
    setTimeout(() => setBookingSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-md mx-auto pb-24">
        <div className="relative pt-8 px-4 pb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-20 blur-3xl" />
          <div className="relative flex items-center gap-4 animate-fade-in">
            <Avatar className="h-16 w-16 ring-4 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl font-bold">
                {userData.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{userData.name}</h1>
              <p className="text-muted-foreground text-sm">Добро пожаловать!</p>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="home" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary">
                <Icon name="Home" size={18} />
              </TabsTrigger>
              <TabsTrigger value="service" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary">
                <Icon name="Wrench" size={18} />
              </TabsTrigger>
              <TabsTrigger value="booking" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary">
                <Icon name="Calendar" size={18} />
              </TabsTrigger>
              <TabsTrigger value="contacts" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary">
                <Icon name="Phone" size={18} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="space-y-4 animate-fade-in">
              <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                    <Icon name="Car" size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Главное</h2>
                    <p className="text-sm text-muted-foreground">Основная информация</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Владелец</span>
                    <span className="font-semibold">{userData.name}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Автомобиль</span>
                      <Dialog open={carDialogOpen} onOpenChange={setCarDialogOpen}>
                        <DialogTrigger asChild>
                          <button className="text-primary text-xs hover:underline flex items-center gap-1">
                            <Icon name="Settings" size={12} />
                            Управление
                          </button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border max-w-[90vw] sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Мои автомобили</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {cars.length > 0 && (
                              <div className="space-y-2">
                                {cars.map((car) => (
                                  <div key={car.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${car.id === selectedCarId ? "border-primary bg-primary/10" : "border-border/50 bg-muted/20 hover:bg-muted/40"}`} onClick={() => setSelectedCarId(car.id)}>
                                    <div className="flex items-center gap-3">
                                      <Icon name="Car" size={18} className={car.id === selectedCarId ? "text-primary" : "text-muted-foreground"} />
                                      <div>
                                        <p className="font-semibold text-sm">{car.brand} {car.model}</p>
                                        <p className="text-xs text-muted-foreground">{car.year} г.</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {car.id === selectedCarId && <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Активный</Badge>}
                                      {cars.length > 1 && (
                                        <button onClick={(e) => { e.stopPropagation(); deleteCar(car.id); }} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                                          <Icon name="Trash2" size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="border-t border-border/50 pt-4 space-y-3">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Icon name="Plus" size={16} />
                                Добавить автомобиль
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Марка" value={newCar.brand} onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })} className="bg-muted/30 text-sm" />
                                <Input placeholder="Модель" value={newCar.model} onChange={(e) => setNewCar({ ...newCar, model: e.target.value })} className="bg-muted/30 text-sm" />
                              </div>
                              <Input placeholder="Год выпуска" value={newCar.year} onChange={(e) => setNewCar({ ...newCar, year: e.target.value })} className="bg-muted/30 text-sm" />
                              <Button onClick={addCar} disabled={!newCar.brand || !newCar.model} className="w-full bg-gradient-to-r from-primary to-secondary border-0">
                                <Icon name="Plus" size={16} className="mr-2" />
                                Добавить
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {cars.length > 1 ? (
                      <Select value={selectedCarId} onValueChange={setSelectedCarId}>
                        <SelectTrigger className="bg-muted/40 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {cars.map((car) => (
                            <SelectItem key={car.id} value={car.id}>
                              {car.brand} {car.model} ({car.year})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="font-semibold">
                        {selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : "—"}
                      </span>
                    )}
                  </div>

                  {selectedCar && (
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <span className="text-sm text-muted-foreground">Последняя замена</span>
                      <Badge className="bg-gradient-to-r from-primary to-secondary border-0">
                        {selectedCar.lastOilChange}
                      </Badge>
                    </div>
                  )}
                </div>

                <Button onClick={() => setActiveTab("booking")} className="w-full mt-6 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60 border-0">
                  <Icon name="Calendar" size={18} className="mr-2" />
                  Записаться на замену масла
                </Button>
              </Card>

              <Card className="p-5 bg-gradient-to-br from-card to-accent/5 border-accent/20">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Icon name="Phone" size={18} className="text-accent" />
                  Контакты сервиса
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-start gap-2">
                    <Icon name="MapPin" size={16} className="text-muted-foreground mt-0.5" />
                    <span>{userData.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Icon name="Phone" size={16} className="text-muted-foreground" />
                    <span>{userData.phone}</span>
                  </p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="service" className="space-y-4 animate-fade-in">
              <Card className="p-6 bg-gradient-to-br from-card via-card to-secondary/5 border-secondary/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-primary">
                    <Icon name="FileText" size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Сервисный лист</h2>
                    <p className="text-sm text-muted-foreground">История обслуживания</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon name="Car" size={20} className="text-primary" />
                      <h3 className="font-bold">Автомобиль</h3>
                    </div>
                    <p className="text-lg font-semibold">
                      {selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : "—"}
                    </p>
                  </div>

                  {selectedCar && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20">
                      <div className="flex items-center gap-3 mb-3">
                        <Icon name="Droplet" size={20} className="text-accent" />
                        <h3 className="font-bold">Замена масла</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Последняя замена:</span>
                          <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
                            {selectedCar.lastOilChange}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Следующая замена:</span>
                          <Badge className="bg-gradient-to-r from-primary to-secondary border-0">
                            {selectedCar.nextOilChange}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-accent/10 border border-secondary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon name="Info" size={18} className="text-secondary" />
                      <h4 className="font-semibold text-sm">Рекомендация</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedCar ? (
                        <>Следующая замена масла рекомендуется <span className="font-semibold text-foreground">{selectedCar.nextOilChange}</span>. Своевременное обслуживание продлевает срок службы двигателя.</>
                      ) : (
                        "Добавьте автомобиль для получения рекомендаций."
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="booking" className="space-y-4 animate-fade-in">
              <Card className="p-6 bg-gradient-to-br from-card via-card to-accent/5 border-accent/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-primary">
                    <Icon name="Calendar" size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Запись на обслуживание</h2>
                    <p className="text-sm text-muted-foreground">Выберите услугу и запишитесь</p>
                  </div>
                </div>

                {bookingSent && (
                  <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                    <Icon name="CheckCircle" size={20} className="text-green-500" />
                    <p className="text-sm text-green-400 font-medium">Заявка успешно отправлена!</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="User" size={16} />
                      Имя
                    </label>
                    <Input value={bookingName} onChange={(e) => setBookingName(e.target.value)} className="bg-muted/30 border-border/50 focus:border-primary" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Phone" size={16} />
                      Телефон
                    </label>
                    <Input type="tel" value={bookingPhone} onChange={(e) => setBookingPhone(e.target.value)} className="bg-muted/30 border-border/50 focus:border-primary" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Wrench" size={16} />
                      Вид услуги
                    </label>
                    <Select value={bookingService} onValueChange={setBookingService}>
                      <SelectTrigger className="bg-muted/30 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {serviceTypes.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Car" size={16} />
                      Автомобиль
                    </label>
                    {cars.length > 1 ? (
                      <Select value={selectedCarId} onValueChange={setSelectedCarId}>
                        <SelectTrigger className="bg-muted/30 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {cars.map((car) => (
                            <SelectItem key={car.id} value={car.id}>
                              {car.brand} {car.model} ({car.year})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : ""} readOnly className="bg-muted/30 border-border/50" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Calendar" size={16} />
                      Дата и время
                    </label>
                    <Input type="datetime-local" min={getMinDateTime()} value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="bg-muted/30 border-border/50 focus:border-primary" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="MessageSquare" size={16} />
                      Комментарий
                    </label>
                    <Textarea placeholder="Опишите проблему или вид обслуживания..." value={bookingComment} onChange={(e) => setBookingComment(e.target.value)} className="bg-muted/30 border-border/50 focus:border-primary min-h-[100px]" />
                  </div>

                  <Button type="button" onClick={handleBooking} disabled={!bookingDate || !bookingName || !bookingPhone} className="w-full bg-gradient-to-r from-accent via-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-accent/50 hover:shadow-xl hover:shadow-accent/60 border-0 h-12 disabled:opacity-40">
                    <Icon name="Send" size={18} className="mr-2" />
                    Отправить заявку
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4 animate-fade-in">
              <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
                    <Icon name="MapPin" size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Контакты</h2>
                    <p className="text-sm text-muted-foreground">Как нас найти</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-muted/20 to-primary/5 border border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Icon name="MapPin" size={20} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Адрес</h3>
                        <p className="text-sm text-muted-foreground">{userData.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-muted/20 to-secondary/5 border border-border/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-secondary/20">
                        <Icon name="Phone" size={20} className="text-secondary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">Телефон</h3>
                        <a href={`tel:${userData.phone}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">{userData.phone}</a>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-secondary via-accent to-primary hover:opacity-90 transition-all shadow-lg shadow-secondary/50 hover:shadow-xl hover:shadow-secondary/60 border-0 h-12" onClick={() => window.open(userData.gisLink, "_blank")}>
                    <Icon name="MapPin" size={18} className="mr-2" />
                    Открыть в 2ГИС
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
          <Card className="p-4 bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
                <span className="text-xs text-muted-foreground">Следующее ТО через</span>
              </div>
              <Badge className="bg-gradient-to-r from-primary to-secondary border-0">
                {selectedCar?.nextOilChange || "—"}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;