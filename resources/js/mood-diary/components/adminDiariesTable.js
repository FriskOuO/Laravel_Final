import { escapeHtml, formatDiaryDate, moodInfo } from '../utils.js';
import { t } from '../i18n.js';

export function renderAdminDiariesTable(diaries, moodFilter) {
    const filtered = moodFilter === 'all' ? diaries : diaries.filter((diary) => diary.mood === moodFilter);

    return `
        <section class="card-base !p-0 overflow-hidden border-none shadow-xl mt-12">
            <div class="bg-accent/5 px-8 py-6 border-b border-accent-soft flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 class="text-2xl font-black text-main flex items-center gap-3">
                        <span class="text-accent">📖</span> ${t('diary_management')}
                    </h3>
                    <p class="text-sm text-muted mt-1">監控系統內的所有心情日記，確保內容合規性</p>
                </div>
                <div class="flex items-center gap-4">
                    <label class="flex items-center gap-3 text-sm font-bold text-sub">
                        <span class="whitespace-nowrap">${t('mood_filter')}</span>
                        <select data-mood-filter class="input-base !py-2 !px-4 !text-sm !w-auto !rounded-xl border border-accent-soft">
                            <option value="all" ${moodFilter === 'all' ? 'selected' : ''}>${t('all_moods')}</option>
                            <option value="happy" ${moodFilter === 'happy' ? 'selected' : ''}>${t('mood_happy')}</option>
                            <option value="neutral" ${moodFilter === 'neutral' ? 'selected' : ''}>${t('mood_neutral')}</option>
                            <option value="sad" ${moodFilter === 'sad' ? 'selected' : ''}>${t('mood_sad')}</option>
                        </select>
                    </label>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full text-left">
                    <thead class="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase tracking-[0.2em] text-muted border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th class="px-8 py-5 font-black">ID</th>
                            <th class="px-8 py-5 font-black">${t('user')}</th>
                            <th class="px-8 py-5 font-black">${t('title')}</th>
                            <th class="px-8 py-5 font-black">${t('mood_badge')}</th>
                            <th class="px-8 py-5 font-black">狀態</th>
                            <th class="px-8 py-5 font-black">${t('created_at')}</th>
                            <th class="px-8 py-5 font-black text-right">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 dark:divide-slate-800/50">
                        ${filtered.map((diary) => {
                            const mood = moodInfo(diary.mood);

                            return `
                                <tr class="hover:bg-accent-subtle/30 transition-colors group">
                                    <td class="px-8 py-6">
                                        <span class="text-xs font-black px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-muted">#${escapeHtml(diary.id)}</span>
                                    </td>
                                    <td class="px-8 py-6">
                                        <div class="flex flex-col">
                                            <span class="font-bold text-main">${escapeHtml(diary.user ?? t('demo_user'))}</span>
                                            <span class="text-[10px] text-muted uppercase tracking-wider">${diary.user_email ?? 'user@example.com'}</span>
                                        </div>
                                    </td>
                                    <td class="px-8 py-6 text-sub font-medium truncate max-w-[200px]">${escapeHtml(diary.title)}</td>
                                    <td class="px-8 py-6">
                                        <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black border border-current ${mood.chip}">
                                            <span>${mood.emoji}</span>
                                            <span>${t(`mood_${diary.mood}`)}</span>
                                        </span>
                                    </td>
                                    <td class="px-8 py-6">
                                        ${diary.is_public ? `<span class="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[8px] font-black uppercase tracking-widest border border-accent-soft">Public</span>` : `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-muted text-[8px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">Private</span>`}
                                    </td>
                                    <td class="px-8 py-6 text-muted text-sm">${formatDiaryDate(diary.date)}</td>
                                    <td class="px-8 py-6 text-right">
                                        <button
                                            type="button"
                                            class="btn-secondary !py-2 !px-4 text-xs !border-rose-200 !text-rose-600 hover:!bg-rose-600 hover:!text-white active:scale-95 transition-all"
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
            ${filtered.length === 0 ? `
                <div class="py-20 text-center text-muted italic">
                    ${t('no_history_yet')}
                </div>
            ` : ''}
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
