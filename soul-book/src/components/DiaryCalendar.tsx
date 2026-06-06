import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { MOOD_EMOJI, type Diary } from "@/lib/diary";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatKeyLabel(key: string) {
  const [y, m, d] = key.split("-");
  return `${y} / ${m} / ${d}`;
}

const WEEKDAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];
const WEEKDAYS_EN = ["S", "M", "T", "W", "T", "F", "S"];

export function DiaryCalendar({ diaries }: { diaries: Diary[] }) {
  const { lang, t } = useApp();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState<string>(toKey(new Date()));

  const map = useMemo(() => {
    const m = new Map<string, Diary>();
    for (const d of diaries) if (!m.has(d.entry_date)) m.set(d.entry_date, d);
    return m;
  }, [diaries]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toKey(new Date());

  const monthLabel =
    lang === "zh" ? `${month + 1}月` : cursor.toLocaleString("en", { month: "short" });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weekdays = lang === "zh" ? WEEKDAYS_ZH : WEEKDAYS_EN;
  const selectedEntry = map.get(selected);

  useEffect(() => {
    if (selectedEntry) return;
    const todayEntry = map.get(todayKey);
    if (todayEntry) {
      setSelected(todayKey);
      return;
    }
    const firstDiary = diaries[0];
    if (firstDiary) setSelected(firstDiary.entry_date);
  }, [diaries, map, selectedEntry, todayKey]);

  const monthEntries = diaries.filter((d) => d.entry_date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`));
  const weekEntries = diaries.filter((d) => {
    const dt = new Date(d.entry_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entryDay = new Date(dt);
    entryDay.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - entryDay.getTime()) / 86400000);
    return diffDays >= 0 && diffDays < 7;
  });
  const previousMonthEntries = diaries.filter((d) => {
    const dt = new Date(d.entry_date);
    const prev = new Date(year, month - 1, 1);
    return dt.getFullYear() === prev.getFullYear() && dt.getMonth() === prev.getMonth();
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="inline-flex rounded-full bg-card/80 px-4 py-2 text-xs font-medium text-muted-foreground ring-1 ring-border/40 backdrop-blur">
            {lang === "zh" ? "月曆" : "Calendar"}
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary px-5 py-2.5 text-xl font-display font-semibold text-primary-foreground shadow-sm">
              {monthLabel}
            </div>
            <span className="text-sm text-muted-foreground">{year}</span>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-card/75 p-4 shadow-sm ring-1 ring-border/40 backdrop-blur">
          <div className="text-xs text-muted-foreground">{lang === "zh" ? "本週" : "This week"}</div>
          <div className="mt-2 text-2xl font-display font-semibold text-foreground">{weekEntries.length}</div>
        </div>
        <div className="rounded-2xl bg-card/75 p-4 shadow-sm ring-1 ring-border/40 backdrop-blur">
          <div className="text-xs text-muted-foreground">{lang === "zh" ? "本月" : "This month"}</div>
          <div className="mt-2 text-2xl font-display font-semibold text-foreground">{monthEntries.length}</div>
        </div>
        <div className="rounded-2xl bg-card/75 p-4 shadow-sm ring-1 ring-border/40 backdrop-blur">
          <div className="text-xs text-muted-foreground">{lang === "zh" ? "上月" : "Last month"}</div>
          <div className="mt-2 text-2xl font-display font-semibold text-foreground">{previousMonthEntries.length}</div>
        </div>
      </div>

      <div className="rounded-[28px] bg-card/80 p-4 shadow-sm ring-1 ring-border/40 backdrop-blur">
        <div className="grid grid-cols-7 gap-y-2 px-1 pb-2 text-center text-[10px] font-medium text-muted-foreground/70">
          {weekdays.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-2 px-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className="h-12" />;
            const key = toKey(new Date(year, month, d));
            const entry = map.get(key);
            const isToday = key === todayKey;
            const isSelected = key === selected;
            return (
              <button
                key={i}
                onClick={() => setSelected(key)}
                className={cn(
                  "relative flex h-12 items-center justify-center rounded-full transition-all",
                  isSelected && "bg-accent/12 ring-2 ring-accent",
                  !entry && "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]",
                  !isSelected && "hover:bg-muted/50",
                )}
              >
                {entry ? (
                  <span className="flex flex-col items-center justify-center leading-none">
                    <span className={cn("text-4xl", isToday && "drop-shadow-sm")}>{MOOD_EMOJI[entry.mood]}</span>
                    <span className="mt-0.5 text-[9px] font-medium text-muted-foreground/65">{d}</span>
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-muted-foreground/25",
                      isToday ? "bg-accent/10 text-accent" : "bg-background/40 text-muted-foreground/40",
                    )}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-current opacity-40" />
                  </span>
                )}
                <span
                  className={cn(
                    "absolute bottom-1 text-[9px] tabular-nums",
                    isToday ? "font-semibold text-accent" : "text-muted-foreground/70",
                  )}
                >
                  {d}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] bg-card/80 shadow-sm ring-1 ring-border/40 backdrop-blur">
        {selectedEntry ? (
          <Link to="/diary/$id" params={{ id: selectedEntry.id }} className="block group">
            {selectedEntry.image_url && (
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                <img
                  src={selectedEntry.image_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatKeyLabel(selected)}</span>
                <span className="text-4xl leading-none">{MOOD_EMOJI[selectedEntry.mood]}</span>
              </div>
              <h3 className="mt-2 font-display text-xl font-semibold text-foreground">{selectedEntry.title}</h3>
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {selectedEntry.content || "—"}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent">
                {t("diaryDetail")} <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </Link>
        ) : (
          <div className="px-5 py-8 text-center">
            <div className="text-xs text-muted-foreground">{selected.replaceAll("-", " / ")}</div>
            <p className="mt-2 text-sm text-muted-foreground/80">{t("selectDate")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
