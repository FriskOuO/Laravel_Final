import { MOOD_META } from '../constants.js';
import { t } from '../i18n.js';

export function renderMoodChart(summary) {
    const total = Object.values(summary).reduce((sum, value) => sum + value, 0) || 1;
    const moods = ['happy', 'neutral', 'sad'];

    return `
        <section class="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_50px_rgba(148,163,184,0.16)]">
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">${t('emotion_ratio')}</p>
            <h3 class="mt-2 text-xl font-black text-slate-900">${t('mood_chart')}</h3>
            <div class="mt-5 space-y-4">
                ${moods.map((mood) => {
                    const value = summary[mood] ?? 0;
                    const percent = Math.round((value / total) * 100);
                    const meta = MOOD_META[mood];

                    return `
                        <div>
                            <div class="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                                <span>${meta.emoji} ${t(`mood_${mood}`)}</span>
                                <span>${percent}%</span>
                            </div>
                            <div class="h-3 rounded-full bg-slate-100">
                                <div class="h-3 rounded-full ${mood === 'happy' ? 'bg-amber-300' : mood === 'neutral' ? 'bg-sky-300' : 'bg-rose-300'}" style="width:${percent}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </section>
    `;
}