import { authStore } from '../stores/authStore.js';
import { authApi } from '../api/authApi.js';
import { diaryApi } from '../api/diaryApi.js';
import { photoApi } from '../api/photoApi.js';
import { clone, escapeHtml, formatDiaryDate, moodInfo, truncate, toInputDate } from '../utils.js';
import { mockDiaries, mockUsers, moodSummary, mostActiveDay } from '../data/mockData.js';
import { renderAdminUsersTable, bindAdminUsersTable } from '../components/adminUsersTable.js';
import { renderAdminDiariesTable, bindAdminDiariesTable } from '../components/adminDiariesTable.js';
import { renderMoodChart } from '../components/moodChart.js';
import { settingsStore } from '../stores/settingsStore.js';
import { t } from '../i18n.js';

function stateful(arr) {
    return Array.isArray(arr) ? clone(arr) : [];
}

function moodLabel(mood) {
    return t(`mood_${mood}`);
}

function createCard(diary, { guest = false } = {}) {
    const mood = moodInfo(diary.mood);
    return `
        <article class="group card-base flex flex-col justify-between overflow-hidden p-0">
            ${diary.image_url ? `
                <div class="h-48 w-full overflow-hidden">
                    <img src="${escapeHtml(diary.image_url)}" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Diary photo">
                </div>
            ` : ''}
            <div class="p-8 space-y-5">
                <div class="flex items-center justify-between">
                    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-3xl group-hover:scale-110 transition-transform">${mood.emoji}</div>
                    <span class="text-xs font-black uppercase tracking-widest text-muted">${formatDiaryDate(diary.date)}</span>
                </div>
                <div>
                    <h3 class="text-2xl font-black text-main truncate">${escapeHtml(diary.title)}</h3>
                    <p class="mt-3 text-base leading-relaxed text-sub clamp-2">${escapeHtml(truncate(diary.content, 100))}</p>
                </div>
            </div>
            <div class="m-8 mt-0 flex items-center justify-between gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-muted">${guest ? t('public_preview') : t('editable_entry')}</span>
                <div class="flex gap-2">
                    <button type="button" class="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-black text-white dark:bg-white dark:text-slate-900 transition hover:scale-105" data-open-diary="${escapeHtml(diary.id)}">${t('read')}</button>
                    ${guest ? '' : `
                        <button type="button" class="rounded-full bg-slate-100 px-5 py-2.5 text-xs font-black text-sub dark:bg-slate-800 dark:text-slate-400 transition hover:bg-slate-200" data-edit-diary="${escapeHtml(diary.id)}">${t('edit')}</button>
                    `}
                </div>
            </div>
        </article>
    `;
}

function historyView(state) {
    const sortedDiaries = [...state.diaries].sort((a, b) => new Date(b.date) - new Date(a.date));
    return `
        <section class="space-y-12 py-12 fade-in">
            <header class="flex flex-wrap items-end justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-10">
                <div>
                    <h2 class="text-5xl font-black tracking-tight text-main">${t('history')}</h2>
                    <p class="mt-4 text-xl text-sub font-medium">${t('mood_history')}</p>
                </div>
            </header>
            
            <div class="space-y-8">
                ${sortedDiaries.length === 0 ? `
                    <div class="py-32 text-center card-base border-dashed">
                        <p class="text-sub">${t('no_history_yet')}</p>
                    </div>
                ` : sortedDiaries.map(diary => {
                    const mood = moodInfo(diary.mood);
                    return `
                        <div class="flex items-start gap-8 group">
                            <div class="flex flex-col items-center gap-2 pt-2">
                                <div class="text-4xl filter group-hover:scale-125 transition-transform cursor-pointer" title="${moodLabel(diary.mood)}">${mood.emoji}</div>
                                <div class="w-1 h-full bg-slate-100 dark:bg-slate-800 rounded-full min-h-[40px]"></div>
                            </div>
                            <div class="flex-1 card-base p-6 hover:border-accent/30 cursor-pointer" data-open-diary="${diary.id}">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs font-black text-muted uppercase tracking-widest">${formatDiaryDate(diary.date)}</span>
                                    <span class="text-xs font-bold px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-sub">${moodLabel(diary.mood)}</span>
                                </div>
                                <h4 class="text-xl font-black text-main">${escapeHtml(diary.title)}</h4>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </section>
    `;
}

function homeView(state) {
    // Always show the original three mock previews here (do not reflect user's edited/deleted posts)
    const previewDiaries = mockDiaries.slice(0, 3);
    return `
        <div class="relative py-12 overflow-hidden">
            <div class="hero-glow"></div>
            
            <!-- Hero Section -->
            <section class="text-center space-y-10 relative z-10 fade-in py-16">
                <div class="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 px-6 py-2">
                    <span class="text-xs font-black uppercase tracking-[0.4em] text-muted">${t('home_tag')}</span>
                </div>
                <h1 class="text-7xl font-black tracking-tight md:text-9xl hero-title leading-tight">
                    ${t('home_title')}
                </h1>
                <p class="mx-auto max-w-2xl text-2xl leading-relaxed text-sub font-medium">${t('home_desc')}</p>
                <div class="flex flex-wrap justify-center gap-6 pt-6">
                    <button type="button" class="btn-primary px-10 py-5 text-lg" data-open-auth="register">
                        ${t('create_account')}
                    </button>
                    <button type="button" class="rounded-full border-2 border-slate-200 dark:border-slate-800 px-10 py-5 text-lg font-black transition hover:bg-slate-50 dark:hover:bg-slate-800 text-main" data-guest-login>
                        ${t('continue_as_guest')}
                    </button>
                    <button type="button" class="text-sm font-black text-muted hover:text-main transition px-4 py-5" data-jump-preview>
                        ${t('browse_public')}
                    </button>
                </div>
            </section>

            <!-- Stats/Trust Section -->
            <section class="mt-32 grid gap-8 md:grid-cols-3 fade-in" style="animation-delay: 0.2s">
                <div class="card-base text-center space-y-5">
                    <div class="text-5xl">🛡️</div>
                    <h3 class="text-2xl font-black text-main">${t('auth_benefit_1')}</h3>
                    <p class="text-base text-sub leading-relaxed">我們採用業界領先的加密技術，確保您的每一篇日記都只有您自己能看見。隱私是我們的核心價值。</p>
                </div>
                <div class="card-base text-center space-y-5">
                    <div class="text-5xl">📱</div>
                    <h3 class="text-2xl font-black text-main">${t('auth_benefit_2')}</h3>
                    <p class="text-base text-sub leading-relaxed">無論是手機、平板還是電腦，您的紀錄都會即時同步。隨時隨地，捕捉當下的每一分情緒。</p>
                </div>
                <div class="card-base text-center space-y-5">
                    <div class="text-5xl">📊</div>
                    <h3 class="text-2xl font-black text-main">情緒趨勢分析</h3>
                    <p class="text-base text-sub leading-relaxed">透過精緻的視覺化圖表，您可以回顧長期的情緒波動，更深入地了解自己的內心世界與成長歷程。</p>
                </div>
            </section>

            <!-- Feature Showcase -->
            <section class="mt-40 space-y-20 fade-in" style="animation-delay: 0.3s">
                <div class="flex flex-col lg:flex-row items-center gap-16">
                    <div class="lg:w-1/2 space-y-6">
                        <h2 class="text-5xl font-black text-main leading-tight">誠實的面對自己，<br>找回內心的平靜</h2>
                        <p class="text-xl text-sub leading-relaxed">日記不只是文字的紀錄，更是一種自我療癒的過程。在 Mood Diary 中，您可以放下所有偽裝，誠實地寫下當下的感受。</p>
                        <ul class="space-y-4 pt-4">
                            <li class="flex items-center gap-3 text-lg font-bold text-main">
                                <span class="text-amber-500">✔</span> 多種心情圖像選擇
                            </li>
                            <li class="flex items-center gap-3 text-lg font-bold text-main">
                                <span class="text-amber-500">✔</span> 支援圖片與文字混排
                            </li>
                            <li class="flex items-center gap-3 text-lg font-bold text-main">
                                <span class="text-amber-500">✔</span> 精美的排版介面
                            </li>
                        </ul>
                    </div>
                    <div class="lg:w-1/2 w-full">
                        <div class="aspect-video card-base bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                            <span class="text-slate-400 font-bold uppercase tracking-widest text-xl">App Interface Preview</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Testimonials -->
            <section class="mt-40 space-y-12 fade-in" style="animation-delay: 0.4s">
                <div class="text-center">
                    <h2 class="text-4xl font-black text-main">聽聽使用者怎麼說</h2>
                    <p class="text-lg text-sub mt-4">超過 10,000 名使用者在這裡找到了抒發情緒的空間</p>
                </div>
                <div class="grid gap-8 md:grid-cols-2">
                    <div class="card-base space-y-4 italic">
                        <p class="text-lg text-sub">"這是我用過介面最美的心情日記。它讓我開始期待每天晚上的紀錄時光，真的很有幫助。"</p>
                        <p class="text-sm font-black text-main">— 林小姐，自由接案者</p>
                    </div>
                    <div class="card-base space-y-4 italic">
                        <p class="text-lg text-sub">"深色模式真的做得很有質感，晚上寫日記時眼睛很舒服。切換語系也很方便。"</p>
                        <p class="text-sm font-black text-main">— 王先生，工程師</p>
                    </div>
                </div>
            </section>

            <!-- Public Previews -->
            <section id="public-diary-preview" class="mt-40 space-y-12 fade-in" style="animation-delay: 0.5s">
                <div class="flex flex-wrap items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-8 gap-4">
                    <div>
                        <h2 class="text-4xl font-black tracking-tight text-main">${t('public_diary_previews')}</h2>
                        <p class="text-xl text-sub mt-2">${t('public_section_hint')}</p>
                    </div>
                    <button class="text-lg font-black text-muted hover:text-main transition border-b-2 border-transparent hover:border-main pb-1" data-jump-preview>
                        ${t('section_cta_hint')} →
                    </button>
                </div>
                <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4 pt-4">
                    ${previewDiaries.map((diary) => createCard(diary, { guest: true })).join('')}
                </div>
            </section>

            <!-- Final CTA -->
            <section class="mt-40 text-center space-y-8 fade-in" style="animation-delay: 0.6s">
                <h2 class="text-5xl font-black text-main">${t('ready_to_start')}</h2>
                <div class="flex flex-wrap justify-center gap-6">
                    <button type="button" class="btn-primary px-12 py-6 text-xl" data-open-auth="register">
                        ${t('sign_in_to_save')}
                    </button>
                    <button type="button" class="rounded-full border-2 border-slate-200 dark:border-slate-800 px-12 py-6 text-xl font-black transition hover:bg-slate-50 dark:hover:bg-slate-800 text-main" data-guest-login>
                        ${t('continue_as_guest')}
                    </button>
                </div>
            </section>
        </div>
    `;
}

function authView(state) {
    const isLogin = state.authMode === 'login';
    return `
        <section class="mx-auto max-w-xl py-24 fade-in">
            <div class="card-base space-y-10">
                <div class="text-center space-y-4">
                    <h1 class="text-4xl font-black text-main">${isLogin ? t('login') : t('register')}</h1>
                    <p class="text-lg text-sub">${isLogin ? t('no_account_yet') : t('already_have_account')} <button type="button" class="font-black text-main underline decoration-2 underline-offset-8" data-toggle-auth-mode>${isLogin ? t('register_now') : t('login_now')}</button></p>
                </div>

                ${state.error ? `<div class="rounded-2xl bg-rose-50 px-6 py-4 text-base font-black text-rose-600 dark:bg-rose-900/20">${escapeHtml(state.error)}</div>` : ''}

                <form data-auth-form class="space-y-6">
                    ${!isLogin ? `
                    <div class="space-y-2">
                        <label class="text-sm font-black uppercase tracking-widest text-muted">${t('name')}</label>
                        <input name="username" class="input-base text-lg font-medium" placeholder="Your Name" required>
                    </div>
                    ` : ''}
                    <div class="space-y-2">
                        <label class="text-sm font-black uppercase tracking-widest text-muted">${t('email')}</label>
                        <input name="email" type="email" class="input-base text-lg font-medium" placeholder="email@example.com" required>
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-black uppercase tracking-widest text-muted">${t('password')}</label>
                        <input name="password" type="password" class="input-base text-lg font-medium" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="w-full btn-primary py-5 text-xl mt-4">
                        ${isLogin ? t('sign_in') : t('create_account')}
                    </button>
                </form>

                <div class="relative py-4">
                    <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                    <div class="relative flex justify-center text-xs uppercase"><span class="bg-white dark:bg-slate-900 px-4 text-muted font-black tracking-widest">OR</span></div>
                </div>

                <button type="button" class="w-full rounded-full border-2 border-slate-200 dark:border-slate-800 py-5 text-xl font-black text-main transition hover:bg-slate-50 dark:hover:bg-slate-800" data-guest-login>
                    ${t('continue_as_guest')}
                </button>
            </div>
        </section>
    `;
}

function listView(state) {
    return `
        <section class="space-y-12 py-12 fade-in">
            <header class="flex flex-wrap items-end justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-10">
                <div>
                    <h2 class="text-5xl font-black tracking-tight text-main">${t('dashboard_title')}</h2>
                    <p class="mt-4 text-xl text-sub font-medium">${t('dashboard_desc')}</p>
                </div>
                <div class="flex gap-4">
                    <button type="button" class="btn-primary text-base" data-nav="form">${t('new_diary')}</button>
                    <button type="button" class="rounded-full border-2 border-slate-200 dark:border-slate-800 px-6 py-3 text-base font-black text-main transition hover:bg-slate-50 dark:hover:bg-slate-800" data-refresh-api>${t('refresh_api')}</button>
                </div>
            </header>

            <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3" data-diary-grid>
                ${state.diaries.map((diary) => createCard(diary)).join('')}
            </div>
            
            ${state.diaries.length === 0 ? `
                <div class="py-32 text-center space-y-6 card-base border-dashed">
                    <div class="text-6xl">📝</div>
                    <h3 class="text-2xl font-black text-main">還沒有日記紀錄</h3>
                    <p class="text-sub">點擊右上方按鈕，開始紀錄您的第一篇心情日記吧！</p>
                </div>
            ` : ''}
        </section>
    `;
}

function detailView(state, { guest = false } = {}) {
    const diary = state.diaries.find((item) => String(item.id) === String(state.selectedDiaryId));
    if (!diary) return '';
    const mood = moodInfo(diary.mood);
    return `
        <section class="mx-auto max-w-4xl py-12 fade-in">
            <div class="card-base space-y-10">
                <div class="flex items-center justify-between">
                    <button type="button" class="text-base font-black text-muted hover:text-main transition" data-back-list>← ${t('back_to_list')}</button>
                    <div class="flex items-center gap-4">
                        <span class="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-black uppercase tracking-widest text-muted">${formatDiaryDate(diary.date)}</span>
                    </div>
                </div>
                <div class="space-y-8">
                    <div class="flex items-center gap-6">
                        <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 dark:bg-slate-800/50 text-5xl shadow-inner">${mood.emoji}</div>
                        <div>
                            <h1 class="text-5xl font-black text-main leading-tight">${escapeHtml(diary.title)}</h1>
                            <p class="text-base font-bold text-muted mt-2">${moodLabel(diary.mood)}</p>
                        </div>
                    </div>
                    <div class="text-xl leading-relaxed text-sub whitespace-pre-line font-medium border-l-4 border-slate-100 dark:border-slate-800 pl-8 py-2">${escapeHtml(diary.content)}</div>
                </div>
                ${!guest ? `
                <div class="flex gap-4 pt-10 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" class="btn-primary text-base px-8" data-edit-diary="${diary.id}">${t('edit')}</button>
                    <button type="button" class="rounded-full bg-rose-50 px-8 py-3 text-base font-black text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 hover:bg-rose-100 transition" data-delete-diary="${diary.id}">${t('delete')}</button>
                </div>
                ` : ''}
            </div>
        </section>
    `;
}

function formView(state) {
    const diary = state.editingDiaryId ? state.diaries.find((item) => String(item.id) === String(state.editingDiaryId)) : null;
    const errorHtml = state.error ? `<div class="rounded-2xl bg-rose-50 px-6 py-4 text-base font-black text-rose-600 dark:bg-rose-900/20">${escapeHtml(state.error)}</div>` : '';
    return `
        <section class="mx-auto max-w-3xl py-12 fade-in">
            <div class="card-base space-y-10">
                ${errorHtml}
                <div class="flex items-center justify-between">
                    <h2 class="text-3xl font-black text-main">${diary ? t('edit') : t('new_diary')}</h2>
                    <button type="button" class="text-base font-black text-muted hover:text-main transition" data-back-list>${t('back_to_list')}</button>
                </div>
                <form data-diary-form class="space-y-8">
                    <div class="space-y-2">
                        <label class="text-sm font-black uppercase tracking-widest text-muted">${t('title_label')}</label>
                        <input name="title" class="input-base text-2xl font-black" placeholder="日記標題..." value="${escapeHtml(diary?.title || '')}" required>
                    </div>
                    
                    <div class="space-y-4">
                        <label class="text-sm font-black uppercase tracking-widest text-muted">${t('upload_photo')}</label>
                        <div class="grid gap-6 sm:grid-cols-2">
                            <div class="relative group aspect-video rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-accent transition-colors" data-photo-placeholder>
                                <div class="photo-preview w-full h-full flex items-center justify-center">
                                    ${diary?.image_url ? `<img src="${diary.image_url}" class="w-full h-full object-cover">` : `<span class="text-4xl">📸</span>`}
                                </div>
                                <input type="file" accept="image/*" hidden data-photo-file-input>
                                <input type="hidden" name="image_url" value="${diary?.image_url || ''}">
                            </div>
                            <div class="flex flex-col justify-center space-y-4">
                                <p class="text-sm text-sub">點擊區域上傳照片或貼上圖片 URL，系統會自動儲存連結。</p>
                                <input class="input-base text-sm" placeholder="輸入圖片 URL..." value="${diary?.image_url || ''}" data-photo-url-input>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-black uppercase tracking-widest text-muted">${t('content_label')}</label>
                        <textarea name="content" rows="12" class="input-base text-lg font-medium leading-relaxed" placeholder="寫下此時此刻的想法..." required>${escapeHtml(diary?.content || '')}</textarea>
                    </div>
                    <div class="grid gap-8 sm:grid-cols-2">
                        <div class="space-y-2">
                            <label class="text-sm font-black uppercase tracking-widest text-muted">${t('date_label')}</label>
                            <input name="date" type="date" class="input-base text-lg font-bold" value="${diary?.date || toInputDate()}" required>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-black uppercase tracking-widest text-muted">${t('mood_label')}</label>
                            <select name="mood" class="input-base text-lg font-bold appearance-none cursor-pointer" required>
                                <option value="">-- 選擇心情 --</option>
                                <option value="happy" ${diary?.mood === 'happy' ? 'selected' : ''}>${t('mood_happy')} 🙂</option>
                                <option value="neutral" ${diary?.mood === 'neutral' ? 'selected' : ''}>${t('mood_neutral')} 😐</option>
                                <option value="sad" ${diary?.mood === 'sad' ? 'selected' : ''}>${t('mood_sad')} 😢</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="w-full btn-primary py-5 text-xl mt-6">
                        ${diary ? t('save_changes') : t('create_diary')}
                    </button>
                </form>
            </div>
        </section>
    `;
}

function profileView(state) {
    const user = state.auth.currentUser;
    return `
        <section class="mx-auto max-w-2xl py-12 fade-in">
            <div class="card-base space-y-10">
                <div class="text-center space-y-4">
                    <h2 class="text-4xl font-black text-main">${t('profile')}</h2>
                    <p class="text-sub">${t('dashboard_desc')}</p>
                </div>
                <form data-profile-form class="space-y-6">
                    <div class="space-y-2">
                        <label class="text-sm font-black uppercase tracking-widest text-muted">${t('name')}</label>
                        <input name="name" class="input-base text-lg font-medium" value="${escapeHtml(user?.name || '')}" required>
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-black uppercase tracking-widest text-muted">${t('email')}</label>
                        <input name="email" type="email" class="input-base text-lg font-medium" value="${escapeHtml(user?.email || '')}" required>
                    </div>
                    <div class="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6">
                        <h3 class="text-xl font-black text-main">${t('change_password')}</h3>
                        <div class="space-y-2">
                            <label class="text-sm font-black uppercase tracking-widest text-muted">${t('new_password')}</label>
                            <input name="password" type="password" class="input-base text-lg font-medium" placeholder="••••••••">
                        </div>
                    </div>
                    <button type="submit" class="w-full btn-primary py-5 text-xl mt-4">
                        ${t('save_profile')}
                    </button>
                </form>
            </div>
        </section>
    `;
}

function adminView(state) {
    return `
        <section class="space-y-12 py-12 fade-in">
            <h2 class="text-5xl font-black text-main tracking-tight">${t('admin_dashboard_label')}</h2>
            <div class="grid gap-8 md:grid-cols-3">
                <div class="card-base text-center space-y-4">
                    <p class="text-sm font-black uppercase tracking-widest text-muted">${t('users')}</p>
                    <p class="text-6xl font-black text-main">${state.users.length}</p>
                </div>
                <div class="card-base text-center space-y-4">
                    <p class="text-sm font-black uppercase tracking-widest text-muted">${t('diaries')}</p>
                    <p class="text-6xl font-black text-main">${state.diaries.length}</p>
                </div>
                <div class="card-base text-center space-y-4 bg-amber-500/10 border-amber-500/20">
                    <p class="text-sm font-black uppercase tracking-widest text-amber-600">系統狀態</p>
                    <p class="text-xl font-black text-amber-700 mt-4">運作正常 🟢</p>
                </div>
            </div>
            
            <div class="space-y-8">
                ${renderAdminUsersTable(state.users)}
                ${renderAdminDiariesTable(state.diaries, 'all')}
            </div>
        </section>
    `;
}

export function createDiaryApp(root) {
    const state = {
        view: 'list',
        diaries: stateful([]),
        users: stateful(mockUsers),
        selectedDiaryId: null,
        editingDiaryId: null,
        authMode: 'login',
        auth: authStore.getState(),
        settings: settingsStore.getState(),
        loading: false,
        error: '',
        modal: null, // { title, message, actionText, onAction }
    };

    function setState(patch) {
        Object.assign(state, patch);
        render();
    }

    function showModal(title, message, actionText, onAction) {
        setState({ modal: { title, message, actionText, onAction } });
    }

    settingsStore.subscribe((s) => {
        document.documentElement.classList.toggle('dark', s.theme === 'dark');
        setState({ settings: s });
    });

    function renderModal() {
        if (!state.modal) return '';
        const { title, message, actionText } = state.modal;
        return `
            <div class="modal-overlay">
                <div class="modal-content space-y-8">
                    <div class="text-6xl">🔒</div>
                    <div class="space-y-4">
                        <h3 class="text-3xl font-black text-main">${title}</h3>
                        <p class="text-lg text-sub leading-relaxed">${message}</p>
                    </div>
                    <div class="flex flex-col gap-4 pt-4">
                        <button class="btn-primary w-full" data-modal-action>${actionText}</button>
                        <button class="text-sm font-black text-muted hover:text-main transition" data-modal-close>${t('back_to_list')}</button>
                    </div>
                </div>
            </div>
        `;
    }

    function render() {
        console.log('Rendering App, current state:', state);
        const isDark = state.settings.theme === 'dark';
        const isAuth = state.auth.isAuthenticated;
        const role = state.auth.currentUser?.role || 'guest';
        const isGuest = role === 'guest';
        const isAdmin = role === 'admin';

        console.log('Auth Status:', { isAuth, role, isGuest, isAdmin, currentView: state.view });

        let content = '';
        if (state.view === 'auth' && !isAuth) {
            console.log('Rendering Auth View');
            content = authView(state);
        } else if (state.view === 'form' && isAuth && !isGuest) content = formView(state);
        else if (state.view === 'detail') content = detailView(state, !isAuth || isGuest);
        else if (state.view === 'profile' && isAuth && !isGuest) content = profileView(state);
        else if (state.view === 'admin' && isAdmin) content = adminView(state);
        else if (state.view === 'history') content = historyView(state);
        else if (state.view === 'list') content = listView(state);
        else if (state.view === 'home') content = homeView(state);
        else content = isAuth ? listView(state) : homeView(state);

        root.innerHTML = `
            <div class="app-shell min-h-screen">
                <header class="app-navbar">
                    <div class="nav-inner">
                        <div class="flex items-center gap-10">
                            <button class="brand text-main" data-nav="home">MOOD DIARY</button>
                            <nav class="hidden md:flex gap-8">
                                <button class="text-sm font-black tracking-widest uppercase transition ${state.view === 'list' ? 'text-main border-b-2 border-main' : 'text-muted hover:text-main'}" data-nav="list">${t('diaries')}</button>
                                <button class="text-sm font-black tracking-widest uppercase transition ${state.view === 'history' ? 'text-main border-b-2 border-main' : 'text-muted hover:text-main'}" data-nav="history">${t('history')}</button>
                                ${isAuth && !isGuest ? `<button class="text-sm font-black tracking-widest uppercase transition ${state.view === 'profile' ? 'text-main border-b-2 border-main' : 'text-muted hover:text-main'}" data-nav="profile">${t('profile')}</button>` : ''}
                                ${isAdmin ? `<button class="text-sm font-black tracking-widest uppercase transition ${state.view === 'admin' ? 'text-main border-b-2 border-main' : 'text-muted hover:text-main'}" data-nav="admin">${t('admin')}</button>` : ''}
                                ${isAuth ? `<span class="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-muted self-center">${isAdmin ? t('admin_features') : (isGuest ? t('guest_browsing') : t('user_features'))}</span>` : ''}
                            </nav>
                        </div>
                        <div class="flex items-center gap-6">
                            <select data-lang-select class="bg-transparent text-xs font-black outline-none cursor-pointer text-sub">
                                <option value="zh-TW" ${state.settings.lang === 'zh-TW' ? 'selected' : ''}>繁體中文</option>
                                <option value="en" ${state.settings.lang === 'en' ? 'selected' : ''}>English</option>
                            </select>
                            <button data-theme-toggle class="text-2xl transition hover:scale-110">${isDark ? '☀️' : '🌙'}</button>
                            ${isAuth ? `
                                <div class="flex items-center gap-4">
                                    <div class="hidden sm:flex flex-col items-end">
                                        <span class="text-xs font-black text-main uppercase tracking-widest">${state.auth.currentUser?.name}</span>
                                        <span class="text-[10px] font-bold text-muted">${state.auth.currentUser?.email}</span>
                                    </div>
                                    <button class="text-xs font-black text-rose-600 uppercase tracking-widest hover:brightness-125 transition" data-logout>${t('logout')}</button>
                                </div>
                            ` : `
                                <div class="flex items-center gap-3">
                                    <button class="text-xs font-black uppercase tracking-widest text-sub hover:text-main transition" data-open-auth="login">${t('login')}</button>
                                    <button class="btn-primary text-xs py-2.5 px-6 shadow-none" data-open-auth="register">${t('register')}</button>
                                    <button class="hidden lg:block text-xs font-black uppercase tracking-widest text-main hover:brightness-125 transition" data-guest-login>${t('continue_as_guest')}</button>
                                </div>
                            `}
                        </div>
                    </div>
                </header>
                ${isGuest ? `
                    <div class="bg-amber-500/10 border-b border-amber-500/20 py-3 text-center">
                        <p class="text-xs font-black text-amber-700 uppercase tracking-widest">⚠️ ${t('guest_mode_notice')}</p>
                    </div>
                ` : ''}
                <main class="max-w-7xl mx-auto px-6">
                    ${content}
                </main>
                <footer class="py-20 mt-20 border-t border-slate-100 dark:border-slate-800">
                    <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div class="text-2xl font-black text-main">MOOD DIARY</div>
                        <div class="text-sm font-bold text-muted">© 2026 Mood Diary Inc. 保留所有權利。</div>
                        <div class="flex gap-6">
                            <a href="#" class="text-sm font-bold text-muted hover:text-main">隱私權政策</a>
                            <a href="#" class="text-sm font-bold text-muted hover:text-main">服務條款</a>
                            <a href="#" class="text-sm font-bold text-muted hover:text-main">聯絡我們</a>
                        </div>
                    </div>
                </footer>
                ${renderModal()}
            </div>
        `;
        wireEvents();
    }

    async function fetchDiaries() {
        if (!state.auth.isAuthenticated) return;
        setState({ loading: true });
        try {
            const list = await diaryApi.list();
            // API returns array of diaries
            setState({ diaries: stateful(list), loading: false });
        } catch (err) {
            setState({ loading: false });
            console.warn('Failed to fetch diaries from API', err);
        }
    }

    function wireEvents() {
        root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', () => {
            if (b.dataset.nav === 'form' && !state.auth.isAuthenticated) {
                showModal(t('authentication'), t('login_required_to_create'), t('login_now'), () => {
                    setState({ view: 'auth', authMode: 'login', modal: null });
                });
                return;
            }
            // clear any existing form/auth error when navigating
            state.error = '';
            state.view = b.dataset.nav === 'home' ? (state.auth.isAuthenticated ? 'list' : 'home') : b.dataset.nav;
            state.editingDiaryId = null;
            render();
        }));

        root.querySelector('[data-modal-action]')?.addEventListener('click', () => {
            state.modal?.onAction?.();
        });

        root.querySelector('[data-modal-close]')?.addEventListener('click', () => {
            setState({ modal: null });
        });
        root.querySelectorAll('[data-open-auth]').forEach(b => {
            b.addEventListener('click', () => {
                state.view = 'auth';
                state.authMode = b.dataset.openAuth;
                render();
            });
        });
        root.querySelectorAll('[data-toggle-auth-mode]').forEach(b => b.addEventListener('click', () => {
            state.authMode = state.authMode === 'login' ? 'register' : 'login';
            render();
        }));
        root.querySelectorAll('[data-logout]').forEach(b => b.addEventListener('click', () => {
            authStore.clearSession();
            state.view = 'home';
            render();
        }));
        root.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => settingsStore.toggleTheme()));
        root.querySelector('[data-lang-select]')?.addEventListener('change', e => settingsStore.setLang(e.target.value));
        root.querySelectorAll('[data-back-list]').forEach(b => b.addEventListener('click', () => {
            state.view = state.auth.isAuthenticated ? 'list' : 'home';
            render();
        }));
        root.querySelectorAll('[data-open-diary]').forEach(b => {
            b.addEventListener('click', () => {
                state.selectedDiaryId = b.dataset.openDiary;
                state.view = 'detail';
                render();
            });
        });
        root.querySelectorAll('[data-refresh-api]').forEach(b => b.addEventListener('click', async () => {
            await fetchDiaries();
            state.view = 'list';
            state.editingDiaryId = null;
            render();
        }));
        root.querySelectorAll('[data-edit-diary]').forEach(b => {
            b.addEventListener('click', () => {
                state.error = '';
                state.editingDiaryId = b.dataset.editDiary;
                state.view = 'form';
                render();
            });
        });
        root.querySelectorAll('[data-delete-diary]').forEach(b => {
            b.addEventListener('click', async () => {
                if (!confirm(t('delete_confirm'))) return;
                try {
                    await diaryApi.remove(b.dataset.deleteDiary);
                    state.diaries = state.diaries.filter(d => String(d.id) !== String(b.dataset.deleteDiary));
                    state.view = 'list';
                    render();
                } catch (err) {
                    state.error = err?.formattedError?.message || err?.response?.data?.message || '刪除失敗';
                    render();
                }
            });
        });
        
        root.querySelectorAll('[data-jump-preview]').forEach(b => {
            b.addEventListener('click', () => {
                root.querySelector('#public-diary-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        root.querySelectorAll('[data-guest-login]').forEach(b => {
            b.addEventListener('click', async () => {
                state.view = 'list';
                state.error = '';
                render();
            });
        });

        const photoPlaceholder = root.querySelector('[data-photo-placeholder]');
        const photoFileInput = root.querySelector('[data-photo-file-input]');
        const photoUrlInput = root.querySelector('[data-photo-url-input]');
        const photoUrlHidden = root.querySelector('input[name="image_url"]');

        if (photoPlaceholder && photoFileInput) {
            photoPlaceholder.addEventListener('click', () => photoFileInput.click());
        }

        if (photoFileInput) {
            photoFileInput.addEventListener('change', async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                    return;
                }

                try {
                    const { url } = await photoApi.uploadPhoto(file);
                    // Normalize returned URL: if it's relative, resolve against current origin; if hostname is localhost and missing port, attach current port
                    let normalizedUrl = url || '';
                    try {
                        const resolved = new URL(normalizedUrl, window.location.origin);
                        if ((resolved.hostname === 'localhost' || resolved.hostname === '127.0.0.1') && !resolved.port && window.location.port) {
                            resolved.port = window.location.port;
                        }
                        normalizedUrl = resolved.toString();
                    } catch (e) {
                        // fallback: leave as-is
                    }

                    if (photoUrlHidden) {
                        photoUrlHidden.value = normalizedUrl;
                    }
                    if (photoUrlInput) {
                        photoUrlInput.value = normalizedUrl;
                    }
                    const preview = photoPlaceholder?.querySelector('.photo-preview');
                    if (preview) {
                        preview.innerHTML = `<img src="${normalizedUrl}" class="w-full h-full object-cover">`;
                    }
                    event.target.value = '';
                } catch (uploadError) {
                    state.error = '圖片上傳失敗，請使用 jpg、png、gif 或 webp 格式，且大小不超過 2MB。';
                    render();
                }
            });
        }

        if (photoUrlInput && photoUrlHidden) {
            photoUrlInput.addEventListener('input', () => {
                const value = photoUrlInput.value.trim();
                photoUrlHidden.value = value;
                const preview = photoPlaceholder?.querySelector('.photo-preview');
                if (preview) {
                    preview.innerHTML = value ? `<img src="${escapeHtml(value)}" class="w-full h-full object-cover">` : `<span class="text-4xl">📸</span>`;
                }
            });
        }

        const authForm = root.querySelector('[data-auth-form]');
        if (authForm) authForm.addEventListener('submit', handleAuthSubmit);

        const diaryForm = root.querySelector('[data-diary-form]');
        if (diaryForm) diaryForm.addEventListener('submit', handleDiarySubmit);

        const profileForm = root.querySelector('[data-profile-form]');
        if (profileForm) profileForm.addEventListener('submit', handleProfileSubmit);

        if (state.view === 'admin') {
            bindAdminUsersTable(root, (id) => alert(`Suspend user ${id} (Mock)`));
            bindAdminDiariesTable(root, (id) => {
                if (confirm(t('delete_confirm'))) {
                    state.diaries = state.diaries.filter(d => String(d.id) !== String(id));
                    render();
                }
            });
        }
    }

    async function handleAuthSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        try {
            const res = state.authMode === 'register' ? await authApi.register(data) : await authApi.login(data);
            authStore.setSession({ token: res.access_token, currentUser: res.user });
            state.view = 'list';
            render();
        } catch (err) {
            state.error = err?.formattedError?.message || err?.response?.data?.message || '認證失敗。請檢查您的帳號密碼。';
            render();
        }
    }

    async function handleDiarySubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = fd; // pass FormData directly to API
        try {
            if (state.editingDiaryId) {
                const res = await diaryApi.update(state.editingDiaryId, data);
                // update local state using returned diary object
                state.diaries = state.diaries.map(d => String(d.id) === String(state.editingDiaryId) ? res : d);
            } else {
                const res = await diaryApi.create(data);
                state.diaries.unshift(res);
            }
            state.view = 'list';
            render();
        } catch (err) {
            // Prefer formatted backend message (validation errors etc.)
            const msg = err?.formattedError?.message || err?.response?.data?.message || '儲存失敗。';
            // If there are validation details, include them
            const details = err?.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : null;
            state.error = details ? `${msg} ${details}` : msg;
            render();
        }
    }

    async function handleProfileSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        try {
            // Mock API call for profile update
            console.log('Update profile', data);
            alert(t('profile_updated'));
            const updatedUser = { ...state.auth.currentUser, ...data };
            authStore.setSession({ token: state.auth.token, currentUser: updatedUser });
            state.view = 'list';
            render();
        } catch (err) {
                    state.error = uploadError?.formattedError?.message || uploadError?.response?.data?.message || '圖片上傳失敗，請使用 jpg、png、gif 或 webp 格式，且大小不超過 2MB。';
        }
    }

    authStore.subscribe(async (a) => {
        const prevAuth = state.auth?.isAuthenticated;
        state.auth = a;
        // If user just became authenticated, fetch diaries from API
        if (!prevAuth && state.auth.isAuthenticated) {
            await fetchDiaries();
        }
        render();
    });

    render();
    // If already authenticated on load, fetch server diaries
    if (state.auth.isAuthenticated) {
        fetchDiaries();
    }
}
