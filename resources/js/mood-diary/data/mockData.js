import { toInputDate } from '../utils.js';

export const mockDiaries = [
    {
        id: 1,
        title: '安靜的早晨重置',
        content: '慢慢沖了一杯咖啡，寫下簡短清單，並讓第一個小時遠離螢幕。整天的節奏因此柔和許多。',
        mood: 'happy',
        date: toInputDate(new Date()),
        image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    },
    {
        id: 2,
        title: '通勤路上的想法',
        content: '坐在車上看著周圍的人，也留意到自己其實很累。沒有什麼戲劇化，只是一個普通到不能再普通的週三。',
        mood: 'neutral',
        date: '2026-06-02',
        image_url: '',
    },
    {
        id: 3,
        title: '下雨的傍晚',
        content: '回家時剛好下雨。我取消了晚餐行程，看著窗外，讓安靜慢慢把心情整理好。',
        mood: 'sad',
        date: '2026-06-01',
        image_url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=900&q=80',
    },
];

export const mockUsers = [
    { id: 1001, name: 'Mia Chen', email: 'mia@example.com', created_at: '2026-05-29' },
    { id: 1002, name: 'Noah Lin', email: 'noah@example.com', created_at: '2026-05-30' },
    { id: 1003, name: 'Ava Huang', email: 'ava@example.com', created_at: '2026-05-31' },
    { id: 1004, name: 'Ethan Wu', email: 'ethan@example.com', created_at: '2026-06-02' },
];

export function moodSummary(diaries) {
    return ['happy', 'neutral', 'sad'].reduce((summary, mood) => {
        summary[mood] = diaries.filter((diary) => diary.mood === mood).length;
        return summary;
    }, {});
}

export function mostActiveDay(diaries) {
    const counts = diaries.reduce((summary, diary) => {
        summary[diary.date] = (summary[diary.date] ?? 0) + 1;
        return summary;
    }, {});

    return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? '—';
}
