import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { DiaryEditor } from "@/components/DiaryEditor";
import { useApp } from "@/contexts/AppContext";
import { MOOD_EMOJI } from "@/lib/diary";
import { toast } from "sonner";
import { api, toDiaryLike } from "@/lib/api";

export const Route = createFileRoute("/diary/$id")({ component: DiaryDetail });

function DiaryDetail() {
  const { id } = Route.useParams();
  const { t, user, loading } = useApp();
  const navigate = useNavigate();
  const [diary, setDiary] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    try {
      const data = await api.getDiary(id);
      setDiary(toDiaryLike(data));
    } catch {
      setDiary(null);
    }
  };

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => { if (user) load(); }, [user, id]);

  const handleDelete = async () => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await api.deleteDiary(id);
    } catch (error) {
      return toast.error(error instanceof Error ? error.message : t("error"));
    }
    toast.success(t("deleted"));
    navigate({ to: "/" });
  };

  if (!diary) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-8 text-muted-foreground">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })} className="mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">{t("back")}</span>
        </Button>

        <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {diary.image_url && (
            <img
              src={diary.image_url}
              alt={diary.title}
              className="aspect-[16/9] w-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{format(new Date(diary.entry_date), "yyyy / MM / dd")}</span>
              <span className="text-3xl leading-none">{MOOD_EMOJI[diary.mood]}</span>
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground">{diary.title}</h1>
            <div className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
              {diary.content || "—"}
            </div>
            <div className="mt-8 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                <span className="ml-1">{t("edit")}</span>
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                <span className="ml-1">{t("delete")}</span>
              </Button>
            </div>
          </div>
        </article>
      </main>
      <DiaryEditor open={editOpen} onOpenChange={setEditOpen} onSaved={load} existing={diary} />
    </div>
  );
}
