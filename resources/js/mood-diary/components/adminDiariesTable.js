import { escapeHtml, formatDiaryDate, moodInfo } from '../utils.js';
import { t } from '../i18n.js';

export function renderAdminDiariesTable(diaries, moodFilter) {
    const filtered = moodFilter === 'all' ? diaries : diaries.filter((diary) => diary.mood === moodFilter);

    return `
        <section class="rounded-[28px] border border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(148,163,184,0.16)]">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">${t('diaries')}</p>
                    <h3 class="mt-2 text-xl font-black text-slate-900">${t('diary_management')}</h3>
                </div>
                <label class="flex items-center gap-2 text-sm text-slate-600">
                    <span class="font-semibold">${t('mood_filter')}</span>
                    <select data-mood-filter class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                        <option value="all" ${moodFilter === 'all' ? 'selected' : ''}>${t('all_moods')}</option>
                        <option value="happy" ${moodFilter === 'happy' ? 'selected' : ''}>${t('mood_happy')}</option>
                        <option value="neutral" ${moodFilter === 'neutral' ? 'selected' : ''}>${t('mood_neutral')}</option>
                        <option value="sad" ${moodFilter === 'sad' ? 'selected' : ''}>${t('mood_sad')}</option>
                    </select>
                </label>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                    <thead class="bg-slate-50 text-xs uppercase tracking-[0.25em] text-slate-500">
                        <tr>
                            <th class="px-4 py-4">ID</th>
                            <th class="px-4 py-4">${t('user')}</th>
                            <th class="px-4 py-4">${t('title')}</th>
                            <th class="px-4 py-4">${t('mood_badge')}</th>
                            <th class="px-4 py-4">${t('created_at')}</th>
                            <th class="px-4 py-4">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map((diary) => {
                            const mood = moodInfo(diary.mood);

                            return `
                                <tr class="border-b border-slate-100 last:border-0">
                                    <td class="px-4 py-4 font-semibold text-slate-900">#${escapeHtml(diary.id)}</td>
                                    <td class="px-4 py-4 text-slate-700">${escapeHtml(diary.user ?? t('demo_user'))}</td>
                                    <td class="px-4 py-4 text-slate-700">${escapeHtml(diary.title)}</td>
                                    <td class="px-4 py-4">
                                        <span class="rounded-full px-3 py-1 text-xs font-semibold ${mood.chip}">${mood.emoji} ${t(`mood_${diary.mood}`)}</span>
                                    </td>
                                    <td class="px-4 py-4 text-slate-500">${formatDiaryDate(diary.date)}</td>
                                    <td class="px-4 py-4">
                                        <button
                                            type="button"
                                            class="rounded-full bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700"
                                            data-delete-diary="${escapeHtml(diary.id)}"
                                        >
                                            ${t('delete')}
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

export function bindAdminDiariesTable(root, onDelete) {
    root.querySelectorAll('[data-delete-diary]').forEach((button) => {
        button.addEventListener('click', () => {
            onDelete?.(button.dataset.deleteDiary);
        });
    });
}