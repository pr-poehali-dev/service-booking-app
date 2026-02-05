import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const userData = {
    name: "Василий Геннадьевич",
    car: "Toyota Land Cruiser",
    lastOilChange: "21.12.2025",
    nextOilChange: "21.06.2026",
    phone: "+7 (999) 123-45-67",
    address: "ул. Автомобильная, д. 15, Москва",
    gisLink: "https://2gis.ru"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-md mx-auto pb-24">
        <div className="relative pt-8 px-4 pb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-20 blur-3xl" />
          <div className="relative flex items-center gap-4 animate-fade-in">
            <Avatar className="h-16 w-16 ring-4 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl font-bold">
                {userData.name.split(" ").map(n => n[0]).join("")}
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
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Автомобиль</span>
                    <span className="font-semibold">{userData.car}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Последняя замена</span>
                    <Badge className="bg-gradient-to-r from-primary to-secondary border-0">
                      {userData.lastOilChange}
                    </Badge>
                  </div>
                </div>

                <Button className="w-full mt-6 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60 border-0">
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
                    <p className="text-lg font-semibold">{userData.car}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon name="Droplet" size={20} className="text-accent" />
                      <h3 className="font-bold">Замена масла</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Последняя замена:</span>
                        <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
                          {userData.lastOilChange}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Следующая замена:</span>
                        <Badge className="bg-gradient-to-r from-primary to-secondary border-0">
                          {userData.nextOilChange}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-accent/10 border border-secondary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon name="Info" size={18} className="text-secondary" />
                      <h4 className="font-semibold text-sm">Рекомендация</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Следующая замена масла рекомендуется <span className="font-semibold text-foreground">{userData.nextOilChange}</span>. 
                      Своевременное обслуживание продлевает срок службы двигателя.
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
                    <p className="text-sm text-muted-foreground">Заявка на замену масла</p>
                  </div>
                </div>

                <form className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="User" size={16} />
                      Имя
                    </label>
                    <Input 
                      defaultValue={userData.name}
                      className="bg-muted/30 border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Phone" size={16} />
                      Телефон
                    </label>
                    <Input 
                      type="tel"
                      defaultValue={userData.phone}
                      className="bg-muted/30 border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Car" size={16} />
                      Автомобиль
                    </label>
                    <Input 
                      defaultValue={userData.car}
                      className="bg-muted/30 border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="Calendar" size={16} />
                      Желаемая дата
                    </label>
                    <Input 
                      type="date"
                      className="bg-muted/30 border-border/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Icon name="MessageSquare" size={16} />
                      Комментарий
                    </label>
                    <Textarea 
                      placeholder="Дополнительная информация..."
                      className="bg-muted/30 border-border/50 focus:border-primary min-h-[100px]"
                    />
                  </div>

                  <Button 
                    type="button"
                    className="w-full bg-gradient-to-r from-accent via-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-accent/50 hover:shadow-xl hover:shadow-accent/60 border-0 h-12"
                  >
                    <Icon name="Send" size={18} className="mr-2" />
                    Отправить заявку в Telegram
                  </Button>
                </form>
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
                        <p className="text-sm text-muted-foreground">{userData.phone}</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-secondary via-accent to-primary hover:opacity-90 transition-all shadow-lg shadow-secondary/50 hover:shadow-xl hover:shadow-secondary/60 border-0 h-12"
                    onClick={() => window.open(userData.gisLink, '_blank')}
                  >
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
                {userData.nextOilChange}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
