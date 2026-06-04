import { escapeHtml, formatDiaryDate } from '../utils.js';
import { t } from '../i18n.js';

export function renderAdminUsersTable(users, onSuspend) {
    return `
        <section class="rounded-[28px] border border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(148,163,184,0.16)]">
            <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">${t('users')}</p>
                    <h3 class="mt-2 text-xl font-black text-slate-900">${t('user_management')}</h3>
                </div>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">${users.length} ${t('users')}</span>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full text-left text-sm">
                    <thead class="bg-slate-50 text-xs uppercase tracking-[0.25em] text-slate-500">
                        <tr>
                            <th class="px-4 py-4">${t('user_id')}</th>
                            <th class="px-4 py-4">${t('name')}</th>
                            <th class="px-4 py-4">${t('email')}</th>
                            <th class="px-4 py-4">${t('created_at')}</th>
                            <th class="px-4 py-4">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map((user) => `
                            <tr class="border-b border-slate-100 last:border-0">
                                <td class="px-4 py-4 font-semibold text-slate-900">#${escapeHtml(user.id)}</td>
                                <td class="px-4 py-4 text-slate-700">${escapeHtml(user.name)}</td>
                                <td class="px-4 py-4 text-slate-600">${escapeHtml(user.email)}</td>
                                <td class="px-4 py-4 text-slate-500">${formatDiaryDate(user.created_at)}</td>
                                <td class="px-4 py-4">
                                    <button
                                        type="button"
                                        class="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800"
                                        data-suspend-user="${escapeHtml(user.id)}"
                                    >
                                        ${t('suspend')}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

export function bindAdminUsersTable(root, onSuspend) {
    root.querySelectorAll('[data-suspend-user]').forEach((button) => {
        button.addEventListener('click', () => {
            onSuspend?.(button.dataset.suspendUser);
        });
    });
}
