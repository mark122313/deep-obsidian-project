import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

const ARTIST_IMG = "https://cdn.poehali.dev/projects/a00ce720-a256-43b5-bf17-65d283f28886/files/fac367a0-4036-452d-921f-35c92c86b9ed.jpg";
const CONCERT_IMG = "https://cdn.poehali.dev/projects/a00ce720-a256-43b5-bf17-65d283f28886/files/3cd156d9-b001-4dd8-aeb8-c7a385d55d23.jpg";
const MERCH_IMG = "https://cdn.poehali.dev/projects/a00ce720-a256-43b5-bf17-65d283f28886/files/40ce2d4d-b4a2-48c4-b60d-16b9a187eb5a.jpg";

const tracks = [
  { id: 1, title: "Четыре стены", iframeSrc: "https://music.yandex.ru/iframe/album/39688145/track/146093003" },
  { id: 2, title: "Кислород", iframeSrc: "https://music.yandex.ru/iframe/album/37601762/track/141420264" },
  { id: 3, title: "Блять...", iframeSrc: "https://music.yandex.ru/iframe/album/41276956/track/149544686" },
  { id: 4, title: "Балконная кровь", iframeSrc: "https://music.yandex.ru/iframe/album/37601762/track/141420266" },
  { id: 5, title: "Грустный Демон", iframeSrc: "https://music.yandex.ru/iframe/album/37601762/track/141420261" },
];

const events = [
  { date: "12 Apr 2026", dateLabel: "12 АПР 2026", city: "МОСКВА", venue: "Клуб TMNL", status: "ДОСТУПНЫ БИЛЕТЫ", coords: "55.7558° N, 37.6173° E" },
  { date: "19 Apr 2026", dateLabel: "19 АПР 2026", city: "САНКТ-ПЕТЕРБУРГ", venue: "AURORA", status: "FEW LEFT", coords: "59.9343° N, 30.3351° E" },
  { date: "03 May 2026", dateLabel: "03 МАЙ 2026", city: "ЕКАТЕРИНБУРГ", venue: "Teleclub", status: "ДОСТУПНЫ БИЛЕТЫ", coords: "56.8389° N, 60.6057° E" },
  { date: "17 May 2026", dateLabel: "17 МАЙ 2026", city: "КАЗАНЬ", venue: "URBAN", status: "СКОРО", coords: "55.7887° N, 49.1221° E" },
];

const merch = [
  { name: "VOID HOODIE", price: "4 900 ₽", tag: "ЛИМИТ" },
  { name: "SIGNAL TEE", price: "2 400 ₽", tag: "НОВОЕ" },
  { name: "CHROME CAP", price: "1 800 ₽", tag: "" },
  { name: "DISORDER PACK", price: "7 200 ₽", tag: "КОМПЛЕКТ" },
];

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
    <div className="flex items-center gap-1 font-mono-ibm text-xs" style={{ color: "var(--neon)" }}>
      <span>{time.d}</span><span className="countdown-sep opacity-60">D</span>
      <span className="mx-1 countdown-sep">:</span>
      <span>{time.h}</span><span className="countdown-sep opacity-60">H</span>
      <span className="mx-1 countdown-sep">:</span>
      <span>{time.m}</span><span className="countdown-sep opacity-60">M</span>
      <span className="mx-1 countdown-sep">:</span>
      <span>{time.s}</span><span className="countdown-sep opacity-60">S</span>
    </div>
  );
}

function WaveVisualizer({ playing }: { playing: boolean }) {
  const bars = Array.from({ length: 20 });
  return (
    <div className="flex items-end gap-[3px] h-8">
      {bars.map((_, i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            animationDelay: `${i * 0.06}s`,
            animationPlayState: playing ? "running" : "paused",
            height: playing ? undefined : "3px",
            opacity: playing ? 1 : 0.25,
          }}
        />
      ))}
    </div>
  );
}

export default function Index() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const [playingTrack, setPlayingTrack] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top = e.clientY + "px";
      }
      setTimeout(() => {
        if (trailRef.current) {
          trailRef.current.style.left = e.clientX + "px";
          trailRef.current.style.top = e.clientY + "px";
        }
      }, 80);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--obsidian)", position: "relative" }}>
      <div ref={cursorRef} className="cursor" />
      <div ref={trailRef} className="cursor-trail" />
      <div className="scanline" />

      {/* Smoke orbs */}
      <div className="smoke-orb" style={{ width: 600, height: 600, top: -100, left: -200, animationDuration: "12s" }} />
      <div className="smoke-orb" style={{ width: 400, height: 400, top: "40%", right: -100, animationDuration: "18s", animationDelay: "3s" }} />
      <div className="smoke-orb" style={{ width: 300, height: 300, bottom: "20%", left: "30%", animationDuration: "15s", animationDelay: "6s" }} />

      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{ background: "linear-gradient(to bottom, rgba(10,10,12,0.96), transparent)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => scrollTo("main")}
          className="glitch-wrapper font-oswald text-white text-xl font-bold tracking-[0.2em]"
          data-text="МРАКОБЕСИЕ 2.0">
          МРАКОБЕСИЕ 2.0
        </button>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "главная", id: "main" },
            { label: "музыка", id: "музыка" },
            { label: "мерч", id: "мерч" },
            { label: "афиша", id: "афиша" },
            { label: "об артисте", id: "about" },
            { label: "контакты", id: "контакты" },
          ].map(link => (
            <button key={link.id} onClick={() => scrollTo(link.id)} className="nav-link">
              {link.label}
            </button>
          ))}
        </div>

        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          <Icon name={menuOpen ? "X" : "Menu"} size={20} />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8"
          style={{ background: "rgba(10,10,12,0.97)" }}>
          {[
            { label: "ГЛАВНАЯ", id: "main" },
            { label: "МУЗЫКА", id: "музыка" },
            { label: "МЕРЧ", id: "мерч" },
            { label: "АФИША", id: "афиша" },
            { label: "ОБ АРТИСТЕ", id: "about" },
            { label: "КОНТАКТЫ", id: "контакты" },
          ].map(link => (
            <button key={link.id} onClick={() => scrollTo(link.id)}
              className="font-oswald text-white text-3xl tracking-widest hover:text-[var(--neon)] transition-colors">
              {link.label}
            </button>
          ))}
        </div>
      )}

      {/* ─── HERO ─── */}
      <section id="main" className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={ARTIST_IMG} alt="Артист"
            className="w-full h-full object-cover img-hover-glitch"
            style={{ opacity: 0.45, filter: "contrast(1.2) saturate(0.6)" }} />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(105deg, rgba(10,10,12,0.97) 35%, rgba(10,10,12,0.2) 100%)"
          }} />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to top, rgba(10,10,12,1) 0%, transparent 60%)"
          }} />
        </div>

        <div className="relative z-10 px-8 md:px-16 pt-28 pb-20 max-w-4xl">
          <div className="section-label mb-6" style={{ animation: "fadeInUp 0.8s ease 0.2s both" }}>
            // официальный сайт_
          </div>

          <h1 className="glitch-wrapper font-oswald text-white leading-none mb-3"
            data-text="МРАКОБЕСИЕ 2.0"
            style={{
              fontSize: "clamp(48px, 10vw, 140px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              animation: "fadeInUp 1s ease 0.4s both",
            }}>
            МРАКОБЕСИЕ 2.0
          </h1>

          <p className="font-cormorant text-2xl md:text-3xl mb-10 italic"
            style={{
              color: "rgba(255,255,255,0.45)",
              animation: "fadeInUp 1s ease 0.7s both"
            }}>
            Тьма как основа. Звук как оружие.
          </p>

          <div className="flex flex-wrap gap-4" style={{ animation: "fadeInUp 1s ease 1s both" }}>
            <button className="btn-neon" onClick={() => scrollTo("музыка")}><span>Слушать</span></button>
            <button className="btn-neon" onClick={() => scrollTo("афиша")}><span>Купить билет</span></button>
          </div>

          <div className="flex gap-10 mt-16" style={{ animation: "fadeInUp 1s ease 1.2s both" }}>
            {[["128K", "слушателей"], ["3", "альбома"], ["47", "концертов"]].map(([v, l]) => (
              <div key={l}>
                <div className="font-oswald text-4xl font-bold neon-text">{v}</div>
                <div className="font-mono-ibm text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="font-mono-ibm text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>scroll</div>
          <div style={{ width: 1, height: 60, background: "linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)" }} />
        </div>
      </section>

      {/* ─── МУЗЫКА ─── */}
      <section id="музыка" className="relative py-24 px-8 md:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="section-label mb-3">02 // музыка</div>
              <h2 className="font-oswald text-white font-bold tracking-tight" style={{ fontSize: "clamp(40px, 7vw, 80px)" }}>ТРЕКИ</h2>
            </div>
            <WaveVisualizer playing={playingTrack !== null} />
          </div>

          <div>
            {tracks.map((track, i) => (
              <div key={track.id}>
                <div className="track-row flex items-center gap-4 py-5 px-4 cursor-none"
                  onClick={() => setPlayingTrack(playingTrack === track.id ? null : track.id)}>
                  <div className="w-8 text-center font-mono-ibm text-xs flex items-center justify-center"
                    style={{ color: "rgba(255,255,255,0.25)" }}>
                    {playingTrack === track.id
                      ? <Icon name="ChevronUp" size={14} style={{ color: "var(--neon)" }} />
                      : <span>{String(i + 1).padStart(2, "0")}</span>
                    }
                  </div>
                  <div className="flex-1 flex items-center gap-4">
                    <Icon name={playingTrack === track.id ? "Pause" : "Play"} size={16}
                      style={{ color: playingTrack === track.id ? "var(--neon)" : "rgba(255,255,255,0.3)" }} />
                    <div className={`font-oswald text-xl font-medium tracking-wide ${playingTrack === track.id ? "neon-text" : "text-white"}`}>
                      {track.title}
                    </div>
                  </div>
                  <div className="font-mono-ibm text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {playingTrack === track.id ? "— скрыть" : "слушать →"}
                  </div>
                </div>
                {playingTrack === track.id && (
                  <div className="px-4 pb-4" style={{ background: "rgba(176,48,255,0.04)", borderBottom: "1px solid rgba(176,48,255,0.2)" }}>
                    <iframe
                      frameBorder="0"
                      allow="clipboard-write"
                      style={{ border: "none", width: "100%", height: 244, display: "block" }}
                      src={track.iframeSrc}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 flex gap-4">
            <a href="https://music.yandex.ru/artist/24448370" target="_blank" rel="noopener noreferrer" className="btn-neon"><span>Яндекс Музыка</span></a>
            <a href="https://vk.com/artist/mrakobesie2_0" target="_blank" rel="noopener noreferrer" className="btn-neon"><span>VK Музыка</span></a>
          </div>
        </div>
      </section>

      {/* ─── МЕРЧ ─── */}
      <section id="мерч" className="relative py-24 px-8 md:px-16"
        style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="section-label mb-3">03 // мерч</div>
            <h2 className="font-oswald text-white font-bold tracking-tight" style={{ fontSize: "clamp(40px, 7vw, 80px)" }}>МАГАЗИН</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="merch-card relative overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)", aspectRatio: "1" }}>
              <img src={MERCH_IMG} alt="Мерч" className="w-full h-full object-cover img-hover-glitch" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,12,0.85) 0%, transparent 50%)" }} />
              <div className="absolute bottom-6 left-6">
                <div className="section-label mb-1">новая коллекция</div>
                <div className="font-oswald text-white text-2xl font-bold">VOID SERIES 2026</div>
              </div>
            </div>

            <div className="grid grid-cols-2">
              {merch.map((item, i) => (
                <div key={i} className="merch-card relative p-6 flex flex-col justify-between"
                  style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    minHeight: 180,
                    background: i % 2 === 0 ? "rgba(15,15,18,1)" : "rgba(10,10,12,1)"
                  }}>
                  {item.tag && (
                    <span className="inline-block px-2 py-1 font-mono-ibm text-xs mb-3 self-start"
                      style={{ background: "var(--neon)", color: "#000", letterSpacing: "0.12em", fontSize: "0.6rem" }}>
                      {item.tag}
                    </span>
                  )}
                  <div>
                    <div className="font-oswald text-white text-xl font-bold mb-2">{item.name}</div>
                    <div className="font-mono-ibm text-lg neon-text">{item.price}</div>
                  </div>
                  <button className="btn-neon mt-4 self-start" style={{ padding: "8px 20px", fontSize: "0.65rem" }}>
                    <span>В корзину</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── АФИША ─── */}
      <section id="афиша" className="relative py-24 px-8 md:px-16">
        <div className="absolute inset-0">
          <img src={CONCERT_IMG} alt="Концерт" className="w-full h-full object-cover"
            style={{ opacity: 0.15, filter: "saturate(0.5)" }} />
          <div className="absolute inset-0" style={{ background: "rgba(10,10,12,0.88)" }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="mb-12">
            <div className="section-label mb-3">04 // афиша</div>
            <h2 className="font-oswald text-white font-bold tracking-tight" style={{ fontSize: "clamp(40px, 7vw, 80px)" }}>РИТУАЛЫ</h2>
          </div>

          <div className="flex flex-col gap-3">
            {events.map((ev, i) => (
              <div key={i} className="event-row px-6 py-5"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="font-mono-ibm text-xs w-24 shrink-0" style={{ color: "var(--neon)", filter: "blur(5px)", userSelect: "none" }}>
                      {ev.dateLabel}
                    </div>
                    <div>
                      <div className="font-oswald text-white text-xl font-bold" style={{ filter: "blur(6px)", userSelect: "none" }}>{ev.city}</div>
                      <div className="font-mono-ibm text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)", filter: "blur(4px)", userSelect: "none" }}>{ev.venue}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="font-mono-ibm text-xs hidden lg:block" style={{ color: "rgba(255,255,255,0.18)" }}>
                      {ev.coords}
                    </div>
                    <CountdownTimer targetDate={ev.date} />
                    <div className="font-mono-ibm text-xs px-3 py-1"
                      style={{
                        border: `1px solid ${ev.status === "FEW LEFT" ? "#ff4040" : "var(--neon)"}`,
                        color: ev.status === "FEW LEFT" ? "#ff4040" : "var(--neon)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.15em"
                      }}>
                      {ev.status}
                    </div>
                    <button className="btn-neon" style={{ padding: "8px 20px", fontSize: "0.65rem" }}>
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
      <section id="about" className="relative py-24 px-8 md:px-16 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label mb-3">05 // об артисте</div>
              <h2 className="font-oswald text-white font-bold tracking-tight mb-8"
                style={{ fontSize: "clamp(40px, 7vw, 80px)" }}>ИСТОРИЯ</h2>
              <p className="font-cormorant text-xl leading-relaxed mb-6"
                style={{ color: "rgba(255,255,255,0.6)" }}>
                Мракобесие 2.0 — проект на стыке электронного и индустриального звука. Тяжёлые текстуры, тёмная лирика и атмосфера неизбежности — всё это отличительные черты уникального звука.
              </p>
              <p className="font-mono-ibm text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.32)", lineHeight: 1.8 }}>
                Музыка доступна на Яндекс Музыке и VK Музыке. Живые выступления — редкость, каждое из которых становится ритуалом для тех, кто оказался в нужном месте в нужное время.
              </p>

              <div className="mt-10 space-y-4">
                {[["2020", "Первые релизы"], ["2022", "Рост аудитории"], ["2023", "Прорыв в андеграунде"], ["2025", "Новый этап"]].map(([y, e]) => (
                  <div key={y} className="flex items-center gap-4">
                    <div className="font-mono-ibm text-xs neon-text shrink-0 w-10">{y}</div>
                    <div className="h-px flex-1" style={{ background: "rgba(176,48,255,0.25)" }} />
                    <div className="font-oswald text-white text-sm tracking-wide">{e}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden" style={{ border: "1px solid rgba(176,48,255,0.2)" }}>
                <img src={ARTIST_IMG} alt="Артист"
                  className="w-full object-cover img-hover-glitch"
                  style={{ filter: "grayscale(20%) contrast(1.15)", aspectRatio: "3/4" }} />
              </div>
              <div className="absolute -top-4 -right-4 w-20 h-20"
                style={{ border: "1px solid var(--neon)", borderLeft: "none", borderBottom: "none", boxShadow: "0 0 15px var(--neon-glow)" }} />
              <div className="absolute -bottom-4 -left-4 w-20 h-20"
                style={{ border: "1px solid var(--neon)", borderRight: "none", borderTop: "none", boxShadow: "0 0 15px var(--neon-glow)" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── КОНТАКТЫ ─── */}
      <section id="контакты" className="relative py-24 px-8 md:px-16"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <div className="section-label mb-3">06 // контакты</div>
            <h2 className="font-oswald text-white font-bold tracking-tight" style={{ fontSize: "clamp(40px, 7vw, 80px)" }}>СВЯЗЬ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <div className="font-mono-ibm text-sm mb-8" style={{ color: "rgba(255,255,255,0.3)", lineHeight: 1.8 }}>
                По вопросам бронирования,<br />коллаборации и прессы:
              </div>
              {([ 
                { label: "Booking", value: "booking@artist.ru", icon: "Mail" },
                { label: "Press", value: "press@artist.ru", icon: "FileText" },
                { label: "Management", value: "+7 (999) 000-00-00", icon: "Phone" },
              ] as { label: string; value: string; icon: string }[]).map(c => (
                <div key={c.label} className="flex items-center gap-4 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <Icon name={c.icon} size={16} style={{ color: "var(--neon)" }} />
                  <div>
                    <div className="font-mono-ibm text-xs mb-1"
                      style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em" }}>{c.label}</div>
                    <div className="font-oswald text-white text-lg">{c.value}</div>
                  </div>
                </div>
              ))}

              <div className="flex gap-4 mt-8">
                {(["Music", "Send", "Youtube"] as string[]).map((icon, i) => (
                  <button key={i} className="w-10 h-10 neon-border flex items-center justify-center"
                    style={{ background: "transparent", transition: "all 0.3s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(176,48,255,0.1)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <Icon name={icon} size={14} style={{ color: "var(--neon)" }} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="font-mono-ibm text-xs mb-6"
                style={{ color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em" }}>
                // ОТПРАВИТЬ СООБЩЕНИЕ
              </div>
              <div className="flex flex-col gap-3">
                {["Ваше имя", "Email или телефон"].map(ph => (
                  <input key={ph} placeholder={ph}
                    className="w-full bg-transparent font-mono-ibm text-sm text-white px-4 py-3 outline-none transition-colors"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "white",
                      fontFamily: "'IBM Plex Mono', monospace"
                    }}
                    onFocus={e => (e.target.style.borderColor = "var(--neon)")}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                ))}
                <textarea placeholder="Сообщение" rows={4}
                  className="w-full bg-transparent font-mono-ibm text-sm text-white px-4 py-3 outline-none transition-colors resize-none"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontFamily: "'IBM Plex Mono', monospace"
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--neon)")}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                <button className="btn-neon self-start"><span>Отправить</span></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-8 px-8 md:px-16 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="font-oswald text-white text-xl font-bold tracking-[0.2em]">МРАКОБЕСИЕ 2.0</div>
        <div className="font-mono-ibm text-xs" style={{ color: "rgba(255,255,255,0.18)", letterSpacing: "0.15em" }}>
          © 2026 — ВСЕ ПРАВА ЗАЩИЩЕНЫ
        </div>
        <div className="font-mono-ibm text-xs neon-text" style={{ letterSpacing: "0.15em" }}>
          SYSTEM_VERSION: 2.0.26
        </div>
      </footer>
    </div>
  );
}