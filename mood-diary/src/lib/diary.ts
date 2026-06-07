export type Mood = "happy" | "love" | "calm" | "neutral" | "tired" | "sad" | "angry";

export interface Diary {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: Mood;
  entry_date: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export const MOOD_EMOJI: Record<Mood, string> = {
  happy: "😊",
  love: "🥰",
  calm: "😌",
  neutral: "😐",
  tired: "😪",
  sad: "😢",
  angry: "😤",
};

export const MOODS: Mood[] = ["happy", "love", "calm", "neutral", "tired", "sad", "angry"];
