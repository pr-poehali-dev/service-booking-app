import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

type Step = "choose" | "phone" | "otp" | "admin";

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choose");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [adminLogin, setAdminLogin] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length === 0) return "";
    let d = digits.startsWith("8") ? "7" + digits.slice(1) : digits;
    if (!d.startsWith("7")) d = "7" + d;
    d = d.slice(0, 11);
    let result = "+7";
    if (d.length > 1) result += " (" + d.slice(1, 4);
    if (d.length >= 4) result += ") " + d.slice(4, 7);
    if (d.length >= 7) result += "-" + d.slice(7, 9);
    if (d.length >= 9) result += "-" + d.slice(9, 11);
    return result;
  };

  const rawPhone = () => "+" + phone.replace(/\D/g, "");

  const sendOtp = async () => {
    setError("");
    if (phone.replace(/\D/g, "").length < 11) {
      setError("Введите полный номер телефона");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${func2url.auth}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: rawPhone() }),
      });
      const data = await res.json();
      if (data.ok) {
        setDemoCode(data.demo_code || "");
        setStep("otp");
      } else {
        setError(data.error || "Ошибка отправки");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError("");
    if (otp.length < 4) {
      setError("Введите 4-значный код");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${func2url.auth}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: rawPhone(), code: otp }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("user_id", String(data.user_id));
        localStorage.setItem("user_phone", data.phone);
        localStorage.setItem("user_name", data.name || "");
        navigate("/");
      } else {
        setError(data.error || "Неверный код");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const adminLoginHandler = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${func2url.auth}/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: adminLogin, password: adminPass }),
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
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Icon name="Wrench" size={32} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">АвтоСервис</h1>
          <p className="text-muted-foreground text-sm mt-1">Замена масел и жидкостей</p>
        </div>

        {/* STEP: choose */}
        {step === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("phone")}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon name="Smartphone" size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Войти по номеру телефона</p>
                <p className="text-xs text-muted-foreground">Получите SMS с кодом</p>
              </div>
              <Icon name="ChevronRight" size={18} className="text-muted-foreground ml-auto" />
            </button>

            <button
              onClick={() => setStep("admin")}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon name="Shield" size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Войти как администратор</p>
                <p className="text-xs text-muted-foreground">Для сотрудников сервиса</p>
              </div>
              <Icon name="ChevronRight" size={18} className="text-muted-foreground ml-auto" />
            </button>
          </div>
        )}

        {/* STEP: phone */}
        {step === "phone" && (
          <div className="space-y-4">
            <button
              onClick={() => setStep("choose")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors mb-2"
            >
              <Icon name="ArrowLeft" size={16} />
              Назад
            </button>
            <div>
              <p className="font-semibold text-foreground mb-1">Номер телефона</p>
              <p className="text-sm text-muted-foreground mb-4">Отправим SMS с кодом подтверждения</p>
              <Input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 text-base rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button
              onClick={sendOtp}
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl text-base"
            >
              {loading ? "Отправляем..." : "Получить код"}
            </Button>
          </div>
        )}

        {/* STEP: otp */}
        {step === "otp" && (
          <div className="space-y-4">
            <button
              onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors mb-2"
            >
              <Icon name="ArrowLeft" size={16} />
              Изменить номер
            </button>
            <div>
              <p className="font-semibold text-foreground mb-1">Введите код из SMS</p>
              <p className="text-sm text-muted-foreground mb-4">Отправили на {phone}</p>
              {demoCode && (
                <div className="mb-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground">Демо-режим — ваш код:</p>
                  <p className="text-2xl font-bold text-primary tracking-widest">{demoCode}</p>
                </div>
              )}
              <Input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="_ _ _ _"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 text-xl text-center tracking-[0.5em] rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button
              onClick={verifyOtp}
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl text-base"
            >
              {loading ? "Проверяем..." : "Войти"}
            </Button>
          </div>
        )}

        {/* STEP: admin */}
        {step === "admin" && (
          <div className="space-y-4">
            <button
              onClick={() => setStep("choose")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors mb-2"
            >
              <Icon name="ArrowLeft" size={16} />
              Назад
            </button>
            <div>
              <p className="font-semibold text-foreground mb-1">Вход для администратора</p>
              <p className="text-sm text-muted-foreground mb-4">Введите логин и пароль</p>
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Логин"
                  value={adminLogin}
                  onChange={(e) => setAdminLogin(e.target.value)}
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 rounded-xl"
                />
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && adminLoginHandler()}
                />
              </div>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button
              onClick={adminLoginHandler}
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-semibold rounded-xl text-base"
            >
              {loading ? "Входим..." : "Войти"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
