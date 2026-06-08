import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, CalendarDays, LayoutGrid, Sparkles, UserRound, LogIn, Settings, Sprout } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { DiaryCard } from "@/components/DiaryCard";
import { DiaryCalendar } from "@/components/DiaryCalendar";
import { DiaryEditor } from "@/components/DiaryEditor";
import { AuthDialog } from "@/components/AuthDialog";
import { useApp } from "@/contexts/AppContext";
import { MOODS } from "@/lib/diary";
import { toast } from "sonner";
import sampleCoffee from "@/assets/sample-coffee.jpg";
import sampleRain from "@/assets/sample-rain.jpg";
import sampleLeaves from "@/assets/sample-leaves.jpg";
import sampleBook from "@/assets/sample-book.jpg";
import sampleFriends from "@/assets/sample-friends.jpg";
import sampleRamen from "@/assets/sample-ramen.jpg";
import sampleWalk from "@/assets/sample-walk.jpg";
import { api, toBackendDiaryPayload, toDiaryLike } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

const SAMPLE_TEMPLATES = [
  { title_zh: "安靜的早晨重置", title_en: "A quiet morning reset",
    content_zh: "慢慢沖了一杯咖啡，寫下簡短清單，並讓第一個小時遠離螢幕。整天的節奏因此柔和許多。窗外有風，桌上的楓葉是昨天散步撿的。",
    content_en: "Brewed coffee slowly, wrote a tiny list, kept the first hour screen-free. The whole day softened. There's wind outside; the maple leaves on my desk are from yesterday's walk.",
    mood: "calm", offset: 0, image: sampleCoffee },
  { title_zh: "下午一個人散步", title_en: "An afternoon walk alone",
    content_zh: "從家裡走到河堤，落葉鋪滿整條路，我什麼也沒想，就讓秋天的風把腦袋慢慢清空。",
    content_en: "Walked from home to the riverbank. Leaves carpeted the whole path. I thought of nothing — let the autumn wind clear my head.",
    mood: "calm", offset: 1, image: sampleWalk },
  { title_zh: "下雨的傍晚", title_en: "A rainy evening",
    content_zh: "回家時剛好下雨。我取消了晚餐行程，看著窗外，讓安靜慢慢把心情整理好。雨聲比想像中療癒。",
    content_en: "It rained on the way home. I cancelled dinner plans and watched the window until I felt settled. The rain was more healing than I expected.",
    mood: "sad", offset: 2, image: sampleRain },
  { title_zh: "與朋友的笑聲", title_en: "Laughter with friends",
    content_zh: "好久沒有那種笑到肚子痛的感覺了，今天有。咖啡都涼了我們還在聊。",
    content_en: "Hadn't laughed until my stomach hurt in a while. Today I did. The coffee went cold but we kept talking.",
    mood: "happy", offset: 3, image: sampleFriends },
  { title_zh: "讀完一本書", title_en: "Finished a book",
    content_zh: "終於把那本一直放在床頭的書讀完了，結局比想像中溫柔。也想把這份心情留下來。",
    content_en: "Finally finished the book by my bed. The ending was gentler than I expected. I wanted to keep this feeling.",
    mood: "love", offset: 5, image: sampleBook },
  { title_zh: "深夜的一碗拉麵", title_en: "Late-night ramen",
    content_zh: "加班結束，繞遠路去吃了那家想念的拉麵。湯一進嘴裡，今天的疲憊就被融化了一半。",
    content_en: "After working late, I took the long way to that ramen shop I miss. The broth melted half the day's tiredness.",
    mood: "tired", offset: 7, image: sampleRamen },
  { title_zh: "傍晚的金色街道", title_en: "Golden street at dusk",
    content_zh: "在巷口停下來看了五分鐘的夕陽，整條街都被染成蜂蜜的顏色。",
    content_en: "Stopped at the corner for five minutes just to watch the sunset. The whole street turned the color of honey.",
    mood: "love", offset: 10, image: sampleLeaves },
];

const MORE_SAMPLE_TEMPLATES = [
  { title_zh: "早餐店的熱豆漿", title_en: "Warm soy milk morning", mood: "calm", offset: 0, image: sampleCoffee,
    content_zh: "早上買了熱豆漿和飯糰，趕車前偷偷坐了一下。這種小小的安靜感，讓整天都比較好開始。",
    content_en: "Grabbed warm soy milk and a rice ball before the train. That tiny pocket of quiet made the whole day easier to start." },
  { title_zh: "午后的窗邊光線", title_en: "Afternoon window light", mood: "love", offset: 2, image: sampleBook,
    content_zh: "下午陽光照進來，地板上有一塊很漂亮的光。沒有做什麼特別的事，但心情莫名很好。",
    content_en: "The afternoon sun landed on the floor in a perfect shape. I didn't do anything special, but I felt oddly good." },
  { title_zh: "公車上的耳機", title_en: "Headphones on the bus", mood: "neutral", offset: 4, image: sampleWalk,
    content_zh: "在公車上戴著耳機看窗外，城市像慢慢往後退。今天不急著抵達，反而比較安穩。",
    content_en: "With headphones on the bus, the city slid backward through the window. I wasn't in a hurry, and the day felt steadier." },
  { title_zh: "下班後的便利商店", title_en: "After-work convenience store", mood: "tired", offset: 6, image: sampleRamen,
    content_zh: "下班後只想去便利商店買點熱的東西，晚餐不需要很厲害，只要能把疲憊撐過去就好。",
    content_en: "After work I just wanted something warm from the convenience store. Dinner didn't need to be fancy, only enough to get through the tiredness." },
  { title_zh: "和朋友約晚餐", title_en: "Dinner with friends", mood: "happy", offset: 8, image: sampleFriends,
    content_zh: "朋友臨時約了晚餐，聊到最後差點忘了時間。這種不用特別安排也很開心的日子，很珍貴。",
    content_en: "A friend called for dinner and we talked until we almost lost track of time. Days like this are quietly precious." },
  { title_zh: "雨後的散步", title_en: "Walk after rain", mood: "sad", offset: 11, image: sampleRain,
    content_zh: "雨停後去走了一小段路，空氣很乾淨。心裡雖然還有一點沉，但至少沒有那麼亂。",
    content_en: "I took a short walk after the rain. The air was clean, and while my heart was still heavy, it wasn't as messy." },
  { title_zh: "河堤旁的風", title_en: "Wind by the river", mood: "calm", offset: 14, image: sampleLeaves,
    content_zh: "站在河堤邊吹風，手機放口袋裡，什麼都不想回。那一刻覺得自己真的有休息到。",
    content_en: "I stood by the river and let the wind pass through me. Phone in my pocket, nothing to answer. It actually felt like rest." },
];

function buildDemoTemplates() {
  const pools = [...SAMPLE_TEMPLATES, ...MORE_SAMPLE_TEMPLATES];
  const offsets = [0, 1, 3, 4, 6, 8, 9, 11, 13, 14, 16, 18, 21, 23, 26, 29, 33, 37, 41, 46];
  return offsets.map((offset, index) => {
    const base = pools[index % pools.length];
    return {
      ...base,
      offset,
    };
  });
}

function Index() {
  const { user, loading, t, lang, guestLoginWithApi } = useApp();
  const [diaries, setDiaries] = useState([]);
  const [view, setView] = useState("calendar");
  const [editorOpen, setEditorOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [monthSection, setMonthSection] = useState("this");

  // 這裡是首頁資料來源，先排序再依月份篩選，卡片區和月曆都會吃這份資料。
  const sortedDiaries = [...diaries].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  const filteredDiaries = sortedDiaries.filter((d) => {
    const dt = new Date(d.entry_date);
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const entryDay = new Date(dt);
    entryDay.setHours(0, 0, 0, 0);
    const weekDiff = Math.floor((today.getTime() - entryDay.getTime()) / 86400000);
    if (monthSection === "week") return weekDiff >= 0 && weekDiff < 7;
    if (monthSection === "last") return dt.getFullYear() === lastMonth.getFullYear() && dt.getMonth() === lastMonth.getMonth();
    return dt.getFullYear() === currentMonth.getFullYear() && dt.getMonth() === currentMonth.getMonth();
  });

  const load = async () => {
    if (!user) return;
    try {
      // 從 API / 本機暫存把目前帳號的日記抓回來。
      const data = await api.listDiaries();
      setDiaries(data.map((item) => toDiaryLike(item)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
    }
    setFetched(true);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const seedSamples = async () => {
    if (!user) return;
    const today = new Date();
    // 這批是假資料，主要給錄影或展示用，一次塞多篇讓畫面更像長期使用。
    const rows = buildDemoTemplates().map((s) => {
      const d = new Date(today); d.setDate(today.getDate() - s.offset);
      return {
        user_id: user.id,
        title: lang === "zh" ? s.title_zh : s.title_en,
        content: lang === "zh" ? s.content_zh : s.content_en,
        mood: s.mood,
        entry_date: d.toISOString().slice(0, 10),
        image_url: s.image ?? null,
      };
    });
    try {
      await Promise.all(rows.map((row) => api.createDiary(toBackendDiaryPayload(row))));
      toast.success(t("samplesLoaded"));
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
    }
  };

  const loadMoreSamples = async () => {
    await seedSamples();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Sparkles className="h-6 w-6 animate-pulse text-accent" />
      </div>
    );
  }

  if (!user) {
    const guestLogin = async () => {
      try {
        // 訪客登入入口，讓人可以先看流程，不用先註冊。
        await guestLoginWithApi();
        toast.success(lang === "zh" ? "歡迎訪客！" : "Welcome, guest!");
      } catch {
      }
    };
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "var(--gradient-warm)" }} />
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(194,130,84,0.16),transparent_32%)]" />
          <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-20 text-center sm:py-28">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
              <Sprout className="h-3.5 w-3.5 text-accent" />
              <span>{t("tagline")}</span>
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] text-foreground sm:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">{t("heroSubtitle")}</p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full px-7 shadow-sm" onClick={() => setAuthOpen(true)}>
                <LogIn className="h-4 w-4" /><span className="ml-1.5">{t("getStarted")}</span>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-7 bg-card/70 backdrop-blur" onClick={guestLogin}>
                <UserRound className="h-4 w-4" /><span className="ml-1.5">{t("exploreAsGuest")}</span>
              </Button>
            </div>
            <div className="mt-20 flex items-center gap-5 text-5xl opacity-90">
              {MOODS.map((m) => <span key={m}>{({ happy: "😊", love: "🥰", calm: "😌", neutral: "😐", tired: "😪", sad: "😢", angry: "😤" })[m]}</span>)}
            </div>
          </div>
        </main>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header />
      <main className="mx-auto max-w-2xl px-5 py-4">
        {view === "calendar" ? (
          // 月曆模式：看日期 + emoji + 下方詳情。
          <DiaryCalendar diaries={diaries} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setMonthSection("week")} className={cn("rounded-full px-4 py-2 text-xs font-medium transition-all", monthSection === "week" ? "bg-primary text-primary-foreground" : "bg-card/75 text-muted-foreground ring-1 ring-border/40")}>{lang === "zh" ? "上週" : "Last week"}</button>
              <button onClick={() => setMonthSection("last")} className={cn("rounded-full px-4 py-2 text-xs font-medium transition-all", monthSection === "last" ? "bg-primary text-primary-foreground" : "bg-card/75 text-muted-foreground ring-1 ring-border/40")}>{lang === "zh" ? "上個月" : "Last month"}</button>
              <button onClick={() => setMonthSection("this")} className={cn("rounded-full px-4 py-2 text-xs font-medium transition-all", monthSection === "this" ? "bg-primary text-primary-foreground" : "bg-card/75 text-muted-foreground ring-1 ring-border/40")}>{lang === "zh" ? "本月" : "This month"}</button>
            </div>
            {/* 卡片模式：列出日記摘要，方便快速掃描與點進詳情。 */}
            {fetched && diaries.length === 0 ? (
              <div className="rounded-[28px] bg-card/80 py-16 text-center ring-1 ring-border/40 backdrop-blur"><p className="text-sm text-muted-foreground">{t("noEntries")}</p></div>
            ) : filteredDiaries.length === 0 ? (
              <div className="rounded-[28px] bg-card/80 py-16 text-center ring-1 ring-border/40 backdrop-blur"><p className="text-sm text-muted-foreground">{t("noEntries")}</p></div>
            ) : (
              filteredDiaries.map((d) => <DiaryCard key={d.id} diary={d} />)
            )}
            <div className="pt-2">
              {/* 錄影展示用：一次補很多篇範例日記。 */}
              <Button variant="outline" className="w-full rounded-2xl py-6 text-base" onClick={loadMoreSamples}>
                {lang === "zh" ? "載入更多日誌" : "Load more entries"}
              </Button>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-5 left-0 right-0 z-20 mx-auto flex max-w-2xl items-end justify-between px-5">
        <div className="inline-flex overflow-hidden rounded-full bg-card/90 shadow-lg ring-1 ring-border/40 backdrop-blur">
          <button onClick={() => setView("calendar")} className={cn("flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all", view === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><CalendarDays className="h-4 w-4" />{t("calendarView")}</button>
          <button onClick={() => setView("cards")} className={cn("flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all", view === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}><LayoutGrid className="h-4 w-4" />{t("cardView")}</button>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/settings" className="flex h-14 w-14 items-center justify-center rounded-full bg-card/90 text-foreground shadow-lg ring-1 ring-border/40 backdrop-blur hover:bg-muted transition-colors" title={t("settings")}><Settings className="h-6 w-6" /></Link>
          <button onClick={() => setEditorOpen(true)} className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg hover:scale-105 transition-transform" title={t("newEntry")}><Plus className="h-6 w-6" /></button>
        </div>
      </div>

      <DiaryEditor open={editorOpen} onOpenChange={setEditorOpen} onSaved={load} />
    </div>
  );
}
