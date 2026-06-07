import { escapeHtml, formatDiaryDate } from '../utils.js';
import { t } from '../i18n.js';

export function renderAdminUsersTable(users) {
    return `
        <section class="card-base !p-0 overflow-hidden border-none shadow-xl">
            <div class="bg-accent/5 px-8 py-6 border-b border-accent-soft flex items-center justify-between">
                <div>
                    <h3 class="text-2xl font-black text-main flex items-center gap-3">
                        <span class="text-accent">👥</span> ${t('user_management')}
                    </h3>
                    <p class="text-sm text-muted mt-1">管理系統內的所有註冊使用者與其權限狀態</p>
                </div>
                <div class="px-4 py-2 bg-white dark:bg-slate-800 rounded-2xl border border-accent-soft shadow-sm">
                    <span class="text-xs font-black text-accent uppercase tracking-widest">${users.length} ${t('users')}</span>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full text-left">
                    <thead class="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase tracking-[0.2em] text-muted border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th class="px-8 py-5 font-black">${t('user_id')}</th>
                            <th class="px-8 py-5 font-black">${t('name')}</th>
                            <th class="px-8 py-5 font-black">${t('email')}</th>
                            <th class="px-8 py-5 font-black">${t('created_at')}</th>
                            <th class="px-8 py-5 font-black text-right">${t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 dark:divide-slate-800/50">
                        ${users.map((user) => `
                            <tr class="hover:bg-accent-subtle/30 transition-colors group">
                                <td class="px-8 py-6">
                                    <span class="text-xs font-black px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-muted">#${escapeHtml(user.id)}</span>
                                </td>
                                <td class="px-8 py-6">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center font-black text-xs">
                                            ${escapeHtml(user.name.charAt(0).toUpperCase())}
                                        </div>
                                        <span class="font-bold text-main">${escapeHtml(user.name)}</span>
                                    </div>
                                </td>
                                <td class="px-8 py-6 text-sub font-medium">${escapeHtml(user.email)}</td>
                                <td class="px-8 py-6 text-muted text-sm">${formatDiaryDate(user.created_at)}</td>
                                <td class="px-8 py-6 text-right">
                                    <button
                                        type="button"
                                        class="btn-secondary !py-2 !px-4 text-xs !border-amber-200 hover:!bg-amber-500 hover:!text-white active:scale-95 transition-all"
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
