import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";

const ARTIST_IMG =
  "https://cdn.poehali.dev/projects/a00ce720-a256-43b5-bf17-65d283f28886/files/fac367a0-4036-452d-921f-35c92c86b9ed.jpg";
const CONCERT_IMG =
  "https://cdn.poehali.dev/projects/a00ce720-a256-43b5-bf17-65d283f28886/files/3cd156d9-b001-4dd8-aeb8-c7a385d55d23.jpg";
const EVENTS_URL =
  "https://functions.poehali.dev/f4fdaaee-217c-4ca3-8cfa-bc8c7aaeaf7b";

interface EventItem {
  id: number;
  date: string;
  city: string;
  venue: string;
  status: string;
  city_blur: boolean;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [time, setTime] = useState({ d: "00", h: "00", m: "00", s: "00" });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate + " 20:00:00").getTime() - Date.now();
      if (diff <= 0) return;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({
        d: String(d).padStart(2, "0"),
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div
      className="flex items-center gap-1 font-mono-ibm text-xs"
      style={{ color: "var(--neon)" }}
    >
      <span>{time.d}</span>
      <span className="countdown-sep opacity-60">D</span>
      <span className="mx-1 countdown-sep">:</span>
      <span>{time.h}</span>
      <span className="countdown-sep opacity-60">H</span>
      <span className="mx-1 countdown-sep">:</span>
      <span>{time.m}</span>
      <span className="countdown-sep opacity-60">M</span>
      <span className="mx-1 countdown-sep">:</span>
      <span>{time.s}</span>
      <span className="countdown-sep opacity-60">S</span>
    </div>
  );
}

function formatDateLabel(dateStr: string) {
  const months = [
    "ЯНВ",
    "ФЕВ",
    "МАР",
    "АПР",
    "МАЙ",
    "ИЮН",
    "ИЮЛ",
    "АВГ",
    "СЕН",
    "ОКТ",
    "НОЯ",
    "ДЕК",
  ];
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function EventsAboutContacts() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    fetch(EVENTS_URL)
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []));
  }, []);

  return (
    <>
      {/* ─── АФИША ─── */}
      <section id="афиша" className="relative py-24 px-8 md:px-16">
        <div className="absolute inset-0">
          <img
            src={CONCERT_IMG}
            alt="Концерт"
            className="w-full h-full object-cover"
            style={{ opacity: 0.15, filter: "saturate(0.5)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "rgba(10,10,12,0.88)" }}
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="mb-12">
            <div className="section-label mb-3">04 // афиша</div>
            <h2
              className="font-oswald text-white font-bold tracking-tight"
              style={{ fontSize: "clamp(40px, 7vw, 80px)" }}
            >
              РИТУАЛЫ
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="event-row px-6 py-5"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div
                      className="font-mono-ibm text-xs w-32 shrink-0"
                      style={{ color: "var(--neon)" }}
                    >
                      {formatDateLabel(ev.date)}
                    </div>
                    <div>
                      <div
                        className="font-oswald text-white text-xl font-bold"
                        style={
                          ev.city_blur
                            ? { filter: "blur(6px)", userSelect: "none" }
                            : {}
                        }
                      >
                        {ev.city}
                      </div>
                      <div
                        className="font-mono-ibm text-xs mt-1"
                        style={{
                          color: "rgba(255,255,255,0.3)",
                          ...(ev.city_blur
                            ? { filter: "blur(4px)", userSelect: "none" }
                            : {}),
                        }}
                      >
                        {ev.venue}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <CountdownTimer targetDate={ev.date} />
                    <div
                      className="font-mono-ibm text-xs px-3 py-1"
                      style={{
                        border: `1px solid ${ev.status === "FEW LEFT" ? "#ff4040" : "var(--neon)"}`,
                        color:
                          ev.status === "FEW LEFT" ? "#ff4040" : "var(--neon)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {ev.status}
                    </div>
                    <button
                      className="btn-neon"
                      style={{ padding: "8px 20px", fontSize: "0.65rem" }}
                    >
                      <span>Билет</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ОБ АРТИСТЕ ─── */}
      <section
        id="about"
        className="relative py-24 px-8 md:px-16 overflow-hidden"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label mb-3">05 // об артисте</div>
              <h2
                className="font-oswald text-white font-bold tracking-tight mb-8"
                style={{ fontSize: "clamp(40px, 7vw, 80px)" }}
              >
                ИСТОРИЯ
              </h2>
              <p
                className="font-cormorant text-xl leading-relaxed mb-6"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Мракобесие 2.0 — проект на стыке электронного и индустриального
                звука. Тяжёлые текстуры, тёмная лирика и атмосфера неизбежности
                — всё это отличительные черты уникального звука.
              </p>
              <p
                className="font-mono-ibm text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.32)", lineHeight: 1.8 }}
              >
                Музыка доступна на Яндекс Музыке и VK Музыке. Живые выступления
                — редкость, каждое из которых становится ритуалом для тех, кто
                оказался в нужном месте в нужное время.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  ["2020", "Первые релизы"],
                  ["2022", "Рост аудитории"],
                  ["2023", "Прорыв в андеграунде"],
                  ["2025", "Новый этап"],
                ].map(([y, e]) => (
                  <div key={y} className="flex items-center gap-4">
                    <div className="font-mono-ibm text-xs neon-text shrink-0 w-10">
                      {y}
                    </div>
                    <div
                      className="h-px flex-1"
                      style={{ background: "rgba(176,48,255,0.25)" }}
                    />
                    <div className="font-oswald text-white text-sm tracking-wide">
                      {e}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div
                className="overflow-hidden"
                style={{ border: "1px solid rgba(176,48,255,0.2)" }}
              >
                <img
                  src={ARTIST_IMG}
                  alt="Артист"
                  className="w-full object-cover img-hover-glitch"
                  style={{
                    filter: "grayscale(20%) contrast(1.15)",
                    aspectRatio: "3/4",
                  }}
                />
              </div>
              <div
                className="absolute -top-4 -right-4 w-20 h-20"
                style={{
                  border: "1px solid var(--neon)",
                  borderLeft: "none",
                  borderBottom: "none",
                  boxShadow: "0 0 15px var(--neon-glow)",
                }}
              />
              <div
                className="absolute -bottom-4 -left-4 w-20 h-20"
                style={{
                  border: "1px solid var(--neon)",
                  borderRight: "none",
                  borderTop: "none",
                  boxShadow: "0 0 15px var(--neon-glow)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── КОНТАКТЫ ─── */}
      <section
        id="контакты"
        className="relative py-24 px-8 md:px-16"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <div className="section-label mb-3">06 // контакты</div>
            <h2
              className="font-oswald text-white font-bold tracking-tight"
              style={{ fontSize: "clamp(40px, 7vw, 80px)" }}
            >
              СВЯЗЬ
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div
                className="font-mono-ibm text-sm mb-8"
                style={{ color: "rgba(255,255,255,0.3)", lineHeight: 1.8 }}
              >
                По вопросам бронирования,
                <br />
                коллаборации и прессы:
              </div>
              {(
                [
                  {
                    label: "Booking",
                    value: "mrakobeziebuy@mrakobeziemarket.ru",
                    icon: "Mail",
                  },
                  {
                    label: "Press",
                    value: "mrakobeziebuy@mrakobeziemarket.ru",
                    icon: "FileText",
                  },
                  { label: "Management", value: "нет", icon: "Phone" },
                ] as { label: string; value: string; icon: string }[]
              ).map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-4 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <Icon
                    name={c.icon}
                    size={16}
                    style={{ color: "var(--neon)" }}
                  />
                  <div>
                    <div
                      className="font-mono-ibm text-xs mb-1"
                      style={{
                        color: "rgba(255,255,255,0.25)",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {c.label}
                    </div>
                    <div className="font-oswald text-white text-lg">
                      {c.value}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-4 mt-8">
                {(["Music", "Send", "Youtube"] as string[]).map((icon, i) => (
                  <button
                    key={i}
                    className="w-10 h-10 neon-border flex items-center justify-center"
                    style={{
                      background: "transparent",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(176,48,255,0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Icon
                      name={icon}
                      size={14}
                      style={{ color: "var(--neon)" }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div
                className="font-mono-ibm text-xs mb-6"
                style={{
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.2em",
                }}
              >
                // ОТПРАВИТЬ СООБЩЕНИЕ
              </div>
              <div className="flex flex-col gap-3">
                {["Ваше имя", "Email или телефон"].map((ph) => (
                  <input
                    key={ph}
                    placeholder={ph}
                    className="w-full bg-transparent font-mono-ibm text-sm text-white px-4 py-3 outline-none transition-colors"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "var(--neon)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                    }
                  />
                ))}
                <textarea
                  placeholder="Сообщение"
                  rows={4}
                  className="w-full bg-transparent font-mono-ibm text-sm text-white px-4 py-3 outline-none transition-colors resize-none"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--neon)")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.1)")
                  }
                />
                <button className="btn-neon self-start">
                  <span>Отправить</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        className="py-8 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="font-oswald text-white text-xl font-bold tracking-[0.2em]">
          МРАКОБЕСИЕ 2.0
        </div>
        <div
          className="font-mono-ibm text-xs"
          style={{ color: "rgba(255,255,255,0.18)", letterSpacing: "0.15em" }}
        >
          © 2026 — ВСЕ ПРАВА ЗАЩИЩЕНЫ
        </div>
        <div
          className="font-mono-ibm text-xs neon-text"
          style={{ letterSpacing: "0.15em" }}
        >
          SYSTEM_VERSION: 2.0.26
        </div>
      </footer>
    </>
  );
}
