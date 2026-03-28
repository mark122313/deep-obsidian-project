{
  /* ─── КОНТАКТЫ ─── */
}
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
            <Icon name={c.icon} size={16} style={{ color: "var(--neon)" }} />
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
              <div className="font-oswald text-white text-lg">{c.value}</div>
            </div>
          </div>
        ))}

        {/* ─── ИНН ─── */}
        <div
          className="mt-8 p-5"
          style={{
            background: "rgba(176,48,255,0.03)",
            border: "1px solid rgba(176,48,255,0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Icon name="FileText" size={14} style={{ color: "var(--neon)" }} />
            <div
              className="font-mono-ibm text-xs"
              style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}
            >
              ИНН
            </div>
          </div>
          <div className="font-mono-ibm text-lg text-white tracking-wider text-center py-2">
            100605013294
          </div>
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
              onFocus={(e) => (e.target.style.borderColor = "var(--neon)")}
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
</section>;
