import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import func2url from "../../backend/func2url.json";

type Step = "phone" | "otp";

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
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
      const res = await fetch(func2url.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", phone: rawPhone() }),
      });
      const data = await res.json();
      if (data.ok) {
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
      const res = await fetch(func2url.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-otp", phone: rawPhone(), code: otp }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("user_id", String(data.user_id));
        localStorage.setItem("user_phone", data.phone);
        localStorage.setItem("user_name", data.name || "");
        localStorage.setItem("user_auth_ts", String(Date.now()));
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[linear-gradient(135deg,#7a5c00_0%,#c8920a_20%,#ffd700_45%,#f0c040_55%,#c8920a_80%,#7a5c00_100%)] mb-4">
            <Icon name="Wrench" size={32} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">АвтоСервис</h1>
          <p className="text-muted-foreground text-sm mt-1">Замена масел и жидкостей</p>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-foreground mb-1">Номер телефона</p>
              <p className="text-sm text-muted-foreground mb-4">
                Отправим SMS с кодом подтверждения
              </p>
              <Input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground h-12 text-base rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                autoFocus
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button
              onClick={sendOtp}
              disabled={loading}
              className="w-full h-12 bg-[linear-gradient(135deg,#7a5c00_0%,#c8920a_20%,#ffd700_45%,#f0c040_55%,#c8920a_80%,#7a5c00_100%)] hover:opacity-90 text-black font-semibold rounded-xl text-base"
            >
              {loading ? "Отправляем..." : "Получить код"}
            </Button>
          </div>
        )}

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
              <p className="text-sm text-muted-foreground mb-4">
                Отправили на <span className="text-foreground font-medium">{phone}</span>
              </p>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="_ _ _ _"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground h-14 text-2xl text-center tracking-[0.5em] rounded-xl font-bold"
                onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                autoFocus
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button
              onClick={verifyOtp}
              disabled={loading || otp.length < 4}
              className="w-full h-12 bg-[linear-gradient(135deg,#7a5c00_0%,#c8920a_20%,#ffd700_45%,#f0c040_55%,#c8920a_80%,#7a5c00_100%)] hover:opacity-90 text-black font-semibold rounded-xl text-base"
            >
              {loading ? "Проверяем..." : "Войти"}
            </Button>
            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full text-sm text-muted-foreground hover:text-[#c8920a] transition-colors"
            >
              Отправить код повторно
            </button>
          </div>
        )}
      </div>

      {/* Инструкция для iPhone */}
      <div className="w-full max-w-sm mt-10">
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#c8920a]/10 flex items-center justify-center shrink-0">
              <Icon name="Smartphone" size={16} className="text-[#c8920a]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Добавить на экран iPhone</p>
              <p className="text-xs text-muted-foreground">Открывайте как приложение</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { step: "1", icon: "Share2", text: 'Нажмите кнопку «Поделиться» внизу Safari' },
              { step: "2", icon: "PlusSquare", text: '«На экран «Домой»»' },
              { step: "3", icon: "Check", text: '«Добавить» — готово! Ярлык «ОЙЛ СЕРВИС» на рабочем столе' },
            ].map(({ step, icon, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#c8920a]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[#c8920a] text-[10px] font-bold">{step}</span>
                </div>
                <div className="flex items-start gap-2 flex-1">
                  <Icon name={icon} size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-snug">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;