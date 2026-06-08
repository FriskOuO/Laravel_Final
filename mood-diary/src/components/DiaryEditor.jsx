import { useId, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { MOODS, MOOD_EMOJI } from "@/lib/diary";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImagePlus, X } from "lucide-react";
import { api, toBackendDiaryPayload } from "@/lib/api";

export function DiaryEditor({ open, onOpenChange, onSaved, existing }) {
  const { t, user } = useApp();
  const idPrefix = useId();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [content, setContent] = useState(existing?.content ?? "");
  const [mood, setMood] = useState(existing?.mood ?? "neutral");
  const [date, setDate] = useState(existing?.entry_date ?? new Date().toISOString().slice(0, 10));
  const [imageUrl, setImageUrl] = useState(existing?.image_url ?? "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  // 開新一篇時，把表單清空回預設值。
  const reset = () => {
    setTitle("");
    setContent("");
    setMood("neutral");
    setDate(new Date().toISOString().slice(0, 10));
    setImageUrl("");
  };

  const onFile = (file) => {
    if (file.size > 2_500_000) {
      toast.error("Image too large (max 2.5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  // 儲存按鈕的主流程：組 payload，判斷新增或編輯，最後刷新清單。
  const handleSave = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast.error(t("title"));
      return;
    }
    setSaving(true);
    try {
      const payload = toBackendDiaryPayload({
        user_id: user.id,
        title: title.trim(),
        content,
        mood,
        entry_date: date,
        image_url: imageUrl || null,
      });
      if (existing) await api.updateDiary(existing.id, payload);
      else await api.createDiary(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("error"));
      return;
    } finally {
      setSaving(false);
    }
    toast.success(t("saved"));
    onOpenChange(false);
    if (!existing) reset();
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* 這裡是新增 / 編輯日記的表單視窗。 */}
          <DialogTitle className="font-display text-2xl">{existing ? t("edit") : t("newEntry")}</DialogTitle>
          <DialogDescription className="sr-only">{t("tagline")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-title`}>{t("title")}</Label>
            <Input id={`${idPrefix}-title`} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("mood")}</Label>
            <div className="flex gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={cn("flex-1 rounded-lg border-2 py-3 text-2xl transition-all", mood === m ? "border-primary bg-primary/10 scale-105" : "border-border bg-muted/30 hover:bg-muted")}
                >
                  {MOOD_EMOJI[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-date`}>{t("date")}</Label>
            <Input id={`${idPrefix}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-content`}>{t("content")}</Label>
            <Textarea id={`${idPrefix}-content`} rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-image`}>{t("image")}</Label>
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img src={imageUrl} alt="" className="h-44 w-full object-cover" />
                <button type="button" onClick={() => setImageUrl("")} className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 text-foreground shadow hover:bg-background">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 py-8 text-sm text-muted-foreground hover:bg-muted"
              >
                <ImagePlus className="h-5 w-5" />
                {t("uploadImage")}
              </button>
            )}
            <input
              id={`${idPrefix}-image`}
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} disabled={saving}>{t("save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
