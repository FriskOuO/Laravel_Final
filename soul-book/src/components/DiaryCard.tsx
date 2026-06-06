import { Link } from "@tanstack/react-router";
import { MOOD_EMOJI, type Diary } from "@/lib/diary";

function dateBits(d: string) {
  const date = new Date(d);
  return {
    year: date.getFullYear(),
    md: `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`,
  };
}

export function DiaryCard({ diary }: { diary: Diary }) {
  const { year, md } = dateBits(diary.entry_date);
  return (
    <Link
      to="/diary/$id"
      params={{ id: diary.id }}
      className="group flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border/40 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex w-14 flex-col items-center justify-center rounded-xl bg-muted/60 py-2 text-center">
        <div className="text-[10px] font-medium text-muted-foreground">{year}</div>
        <div className="font-display text-base font-semibold text-foreground leading-tight">{md}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-2xl leading-none">{MOOD_EMOJI[diary.mood]}</span>
          <h3 className="truncate font-medium text-foreground">{diary.title}</h3>
        </div>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground whitespace-pre-wrap">
          {diary.content || "—"}
        </p>
      </div>
      {diary.image_url && (
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
          <img
            src={diary.image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>
      )}
    </Link>
  );
}
