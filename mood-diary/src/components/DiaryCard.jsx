import { Link } from "@tanstack/react-router";
import { MOOD_EMOJI } from "@/lib/diary";

function dateBits(d) {
  const date = new Date(d);
  return {
    year: date.getFullYear(),
    md: `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`,
  };
}

export function DiaryCard({ diary }) {
  const { year, md } = dateBits(diary.entry_date);
  return (
    <Link
      to="/diary/$id"
      params={{ id: diary.id }}
      className="group flex min-h-24 items-center gap-4 rounded-3xl bg-card px-4 py-4 shadow-sm ring-1 ring-border/40 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex w-16 flex-col items-center justify-center rounded-2xl bg-muted/60 py-3 text-center">
        <div className="text-[11px] font-medium text-muted-foreground">{year}</div>
        <div className="font-display text-lg font-semibold leading-tight text-foreground">{md}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-3xl leading-none">{MOOD_EMOJI[diary.mood]}</span>
          <h3 className="truncate text-lg font-semibold text-foreground">{diary.title}</h3>
        </div>
        <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {diary.content || "—"}
        </p>
      </div>
      {diary.image_url && (
        <div className="h-18 w-18 shrink-0 overflow-hidden rounded-2xl bg-muted">
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
