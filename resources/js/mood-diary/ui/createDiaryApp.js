import { authStore } from '../stores/authStore.js';
import { authApi } from '../api/authApi.js';
import { diaryApi } from '../api/diaryApi.js';
import { photoApi } from '../api/photoApi.js';
import { clone, escapeHtml, formatDiaryDate, moodInfo, truncate, toInputDate } from '../utils.js';
import { mockDiaries, mockUsers, moodSummary, mostActiveDay } from '../data/mockData.js';
import { renderAdminUsersTable, bindAdminUsersTable } from '../components/adminUsersTable.js';
import { renderAdminDiariesTable, bindAdminDiariesTable } from '../components/adminDiariesTable.js';
import { renderMoodChart, initMoodChart } from '../components/moodChart.js';
import { settingsStore } from '../stores/settingsStore.js';
import { t } from '../i18n.js';

function stateful(arr) {
    return Array.isArray(arr) ? clone(arr) : [];
}

function moodLabel(mood) {
    return t(`mood_${mood}`);
}

function skeletonListView() {
    return `
        <section class="space-y-12 py-12 fade-in">
            <header class="flex flex-wrap items-end justify-between gap-6 border-b border-accent-soft pb-10">
                <div class="space-y-4">
                    <div class="skeleton skeleton-title w-64"></div>
                    <div class="skeleton skeleton-text w-96"></div>
                </div>
            </header>
            <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                ${Array(6).fill(0).map(() => `<div class="skeleton skeleton-card"></div>`).join('')}
            </div>
        </section>
    `;
}

function skeletonDetailView() {
    return `
        <section class="mx-auto max-w-5xl py-12 fade-in">
            <div class="card-base space-y-12">
                <div class="skeleton skeleton-text w-32"></div>
                <div class="flex flex-col lg:flex-row gap-16">
                    <div class="lg:w-1/3 flex flex-col items-center space-y-6">
                        <div class="skeleton w-32 h-32 rounded-[40px]"></div>
                        <div class="skeleton skeleton-title w-48"></div>
                    </div>
                    <div class="lg:w-2/3 space-y-6">
                        <div class="skeleton h-64 w-full"></div>
                        <div class="skeleton h-12 w-32"></div>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function skeletonAdminView() {
    return `
        <section class="space-y-12 py-12 fade-in">
            <div class="skeleton skeleton-title w-80"></div>
            <div class="grid gap-8 md:grid-cols-3">
                ${Array(3).fill(0).map(() => `<div class="skeleton h-32 rounded-[40px]"></div>`).join('')}
            </div>
            <div class="skeleton h-[400px] w-full rounded-[40px]"></div>
        </section>
    `;
}

function createCard(diary, state, { guest = false } = {}) {
    const mood = moodInfo(diary.mood);
    const isAdmin = state.auth.currentUser?.role === 'admin';
    return `
        <article class="group card-base flex flex-col justify-between overflow-hidden p-0">
            ${diary.image_url ? `
                <div class="h-48 w-full overflow-hidden">
                    <img src="${escapeHtml(diary.image_url)}" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Diary photo">
                </div>
            ` : ''}
            <div class="p-8 space-y-5">
                <div class="flex items-center justify-between">
                    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent-soft)] dark:bg-slate-800/50 text-3xl group-hover:scale-110 transition-transform">${mood.emoji}</div>
                    <span class="text-xs font-black uppercase tracking-widest text-muted">${formatDiaryDate(diary.date)}</span>
                </div>
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <h3 class="text-2xl font-black text-main truncate">${escapeHtml(diary.title)}</h3>
                    </div>
                    ${diary.user && (!state.auth.currentUser || String(diary.user_id) !== String(state.auth.currentUser.id)) ? `
                        <p class="text-[10px] font-bold text-accent uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <span class="w-1 h-1 rounded-full bg-accent"></span> Author: ${escapeHtml(diary.user?.name || 'User')}
                        </p>
                    ` : ''}
                    <p class="mt-1 text-base leading-relaxed text-sub clamp-2">${escapeHtml(truncate(diary.content, 100))}</p>
                </div>
            </div>
            <div class="m-8 mt-0 flex items-center justify-between gap-3 pt-6 border-t border-[var(--color-border-main)]">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-muted">${guest ? t('public_preview') : t('editable_entry')}</span>
                    ${!guest && diary.is_public ? `<span class="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[8px] font-black uppercase tracking-widest border border-accent-soft">Public</span>` : ''}
                    ${!guest && !diary.is_public ? `<span class="px-2 py-0.5 rounded-md bg-[var(--color-accent-subtle)] text-muted text-[8px] font-black uppercase tracking-widest border border-[var(--color-accent-soft)]">Private</span>` : ''}
                </div>
                <div class="flex gap-2">
                    <button type="button" class="rounded-full bg-[var(--color-text-primary)] px-5 py-2.5 text-xs font-black text-white dark:bg-white dark:text-slate-900 transition hover:scale-105 active:scale-95 active:brightness-90" data-open-diary="${escapeHtml(diary.id)}">${t('read')}</button>
                    ${!guest && (isAdmin || String(diary.user_id) === String(state.auth.currentUser?.id)) ? `
                        <button type="button" class="rounded-full bg-[var(--color-accent-subtle)] px-5 py-2.5 text-xs font-black text-sub border border-[var(--color-accent-soft)] dark:bg-slate-800 dark:text-slate-400 transition hover:bg-[var(--color-accent-soft)] active:scale-95" data-edit-diary="${escapeHtml(diary.id)}">${t('edit')}</button>
                    ` : ''}
                </div>
            </div>
        </article>
    `;
}

function historyView(state) {
    const isAuth = state.auth.isAuthenticated;
    const userId = state.auth.currentUser?.id;
    // Filter: ONLY show diaries belonging to the current user in history回顧
    const myDiaries = isAuth ? state.diaries.filter(d => String(d.user_id) === String(userId)) : [];
    const sortedDiaries = [...myDiaries].sort((a, b) => new Date(b.date) - new Date(a.date));
    return `
        <section class="space-y-12 py-12 fade-in artistic-view-container">
            <div class="view-blob view-blob-primary"></div>
            
            <header class="flex flex-wrap items-end justify-between gap-6 border-b border-accent-soft pb-10 relative z-10">
                <div>
                    <h2 class="text-5xl font-black tracking-tight text-main">${t('history')}</h2>
                    <p class="mt-4 text-xl text-sub font-medium">${t('mood_history')}</p>
                </div>
                ${!isAuth ? `
                    <div class="px-6 py-4 bg-accent/5 border border-accent-soft rounded-3xl flex items-center gap-4">
                        <span class="text-sm font-bold text-accent">${t('login_to_save_permanently')}</span>
                        <button class="btn-primary !py-2 !px-6 text-xs" data-open-auth="register">${t('register_now')}</button>
                    </div>
                ` : ''}
            </header>
            
            <div class="space-y-8 relative z-10">
                ${!isAuth ? `
                    <div class="py-32 text-center card-base border-dashed space-y-6">
                        <div class="text-6xl">🔒</div>
                        <h3 class="text-2xl font-black text-main">${t('login_to_save_permanently')}</h3>
                        <p class="text-sub">${t('auth_register_sub')}</p>
                        <div class="flex justify-center gap-4 pt-4">
                            <button class="btn-primary px-8 py-3" data-open-auth="login">${t('login_now')}</button>
                            <button class="btn-secondary px-8 py-3" data-open-auth="register">${t('register_now')}</button>
                        </div>
                    </div>
                ` : (sortedDiaries.length === 0 ? `
                    <div class="py-32 text-center card-base border-dashed">
                        <p class="text-sub">${t('no_history_yet')}</p>
                    </div>
                ` : sortedDiaries.map(diary => {
                    const mood = moodInfo(diary.mood);
                    return `
                        <div class="flex items-start gap-8 group">
                            <div class="flex flex-col items-center gap-2 pt-2">
                                <div class="text-4xl filter group-hover:scale-125 transition-transform cursor-pointer" title="${moodLabel(diary.mood)}">${mood.emoji}</div>
                                <div class="w-1 h-full bg-[var(--color-accent-soft)] dark:bg-slate-800 rounded-full min-h-[60px]"></div>
                            </div>
                            <div class="flex-1 card-base p-6 hover:border-accent transition-all cursor-pointer" data-open-diary="${diary.id}">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs font-black text-muted uppercase tracking-widest">${formatDiaryDate(diary.date)}</span>
                                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/5 text-accent text-xs font-black border border-accent-soft">
                                        ${mood.emoji} ${moodLabel(diary.mood)}
                                    </span>
                                </div>
                                <h4 class="text-xl font-black text-main group-hover:text-accent transition-colors">${escapeHtml(diary.title)}</h4>
                            </div>
                        </div>
                    `;
                }).join(''))}
            </div>
        </section>
    `;
}

function homeView(state) {
    // Priority: Newest 4 real public diaries
    const displayDiaries = state.diaries.filter(d => d.is_public).slice(0, 4);
    
    return `
        <div class="relative py-12 artistic-view-container overflow-visible">
            <div class="view-blob view-blob-primary !opacity-20 !w-[800px] !h-[800px] top-[-200px] left-[-200px]"></div>
            <div class="view-blob view-blob-secondary !opacity-20 !w-[600px] !h-[600px] bottom-[-100px] right-[-100px]"></div>

            <!-- Hero Section -->
            <section class="text-center space-y-12 relative z-10 fade-in py-24">
                <div class="inline-flex rounded-full bg-accent/10 border border-accent-soft px-8 py-3">
                    <span class="text-xs font-black uppercase tracking-[0.5em] text-accent">${t('home_tag')}</span>
                </div>
                <h1 class="text-7xl font-black tracking-tight md:text-9xl hero-title leading-[0.9] text-main">
                    ${t('home_title')}
                </h1>
                <p class="mx-auto max-w-3xl text-2xl leading-relaxed text-sub font-medium">
                    ${t('home_desc')}
                </p>
                <div class="flex flex-wrap justify-center gap-6 pt-8">
                    <button type="button" class="btn-primary px-12 py-6 text-xl shadow-[0_20px_50px_rgba(180,83,9,0.3)]" data-open-auth="register">
                        ${t('create_account')}
                    </button>
                    <button type="button" class="btn-secondary text-xl" data-guest-login>
                        ${t('continue_as_guest')}
                    </button>
                    <button type="button" class="text-sm font-black text-muted hover:text-accent transition px-4 py-8" data-nav="list">
                        ${t('browse_public')}
                    </button>
                </div>
                
                <!-- Floating Emojis Decor -->
                <div class="absolute top-20 left-10 text-6xl animate-bounce opacity-20 hidden lg:block" style="animation-duration: 3s">🙂</div>
                <div class="absolute top-40 right-20 text-5xl animate-bounce opacity-20 hidden lg:block" style="animation-duration: 4s; animation-delay: 1s">😢</div>
                <div class="absolute bottom-10 left-1/4 text-4xl animate-bounce opacity-20 hidden lg:block" style="animation-duration: 5s; animation-delay: 2s">😐</div>
            </section>

            <!-- How It Works: Step-by-Step -->
            <section class="mt-40 relative z-10 space-y-20">
                <div class="text-center space-y-4">
                    <h2 class="text-4xl font-black text-main">${t('home_step_title')}</h2>
                    <div class="w-24 h-1.5 bg-accent mx-auto rounded-full"></div>
                </div>
                
                <div class="grid gap-12 md:grid-cols-3">
                    <div class="group card-base text-center space-y-6 hover:border-accent transition-all relative overflow-hidden">
                        <div class="absolute top-4 right-6 text-7xl font-black text-accent/10 pointer-events-none select-none">01</div>
                        <div class="relative z-10 w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center text-4xl mx-auto group-hover:scale-110 transition-transform">✍️</div>
                        <h3 class="relative z-10 text-2xl font-black text-main">${t('home_step_1_title')}</h3>
                        <p class="relative z-10 text-sub leading-relaxed">${t('home_step_1_desc')}</p>
                    </div>
                    <div class="group card-base text-center space-y-6 hover:border-accent transition-all relative overflow-hidden">
                        <div class="absolute top-4 right-6 text-7xl font-black text-accent/10 pointer-events-none select-none">02</div>
                        <div class="relative z-10 w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center text-4xl mx-auto group-hover:scale-110 transition-transform">📊</div>
                        <h3 class="relative z-10 text-2xl font-black text-main">${t('home_step_2_title')}</h3>
                        <p class="relative z-10 text-sub leading-relaxed">${t('home_step_2_desc')}</p>
                    </div>
                    <div class="group card-base text-center space-y-6 hover:border-accent transition-all relative overflow-hidden">
                        <div class="absolute top-4 right-6 text-7xl font-black text-accent/10 pointer-events-none select-none">03</div>
                        <div class="relative z-10 w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center text-4xl mx-auto group-hover:scale-110 transition-transform">🌱</div>
                        <h3 class="relative z-10 text-2xl font-black text-main">${t('home_step_3_title')}</h3>
                        <p class="relative z-10 text-sub leading-relaxed">${t('home_step_3_desc')}</p>
                    </div>
                </div>
            </section>

            <!-- Feature Showcase: Deep Dive -->
            <section class="mt-60 space-y-32">
                <div class="flex flex-col lg:flex-row items-center gap-20">
                    <div class="lg:w-1/2 space-y-8">
                        <span class="text-xs font-black text-accent uppercase tracking-widest px-4 py-1 bg-accent/10 rounded-full">${t('home_feature_1_tag')}</span>
                        <h2 class="text-6xl font-black text-main leading-tight">${t('home_feature_1_title')}</h2>
                        <p class="text-xl text-sub leading-relaxed">${t('home_feature_1_desc')}</p>
                        <div class="grid grid-cols-2 gap-6 pt-4">
                            <div class="space-y-2">
                                <div class="text-accent text-2xl">🔒</div>
                                <h4 class="font-black text-main">${t('home_feature_1_point_1_title')}</h4>
                                <p class="text-sm text-muted">${t('home_feature_1_point_1_desc')}</p>
                            </div>
                            <div class="space-y-2">
                                <div class="text-accent text-2xl">🛡️</div>
                                <h4 class="font-black text-main">${t('home_feature_1_point_2_title')}</h4>
                                <p class="text-sm text-muted">${t('home_feature_1_point_2_desc')}</p>
                            </div>
                        </div>
                    </div>
                    <div class="lg:w-1/2 w-full relative">
                        <div class="absolute -inset-4 bg-accent/20 blur-3xl rounded-full"></div>
                        <div class="aspect-square card-base relative z-10 flex items-center justify-center border-dashed">
                             <div class="text-center space-y-6">
                                <div class="text-8xl animate-pulse">🔒</div>
                                <p class="text-accent font-black tracking-widest">ENCRYPTED DATA</p>
                             </div>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col lg:flex-row-reverse items-center gap-20">
                    <div class="lg:w-1/2 space-y-8">
                        <span class="text-xs font-black text-accent uppercase tracking-widest px-4 py-1 bg-accent/10 rounded-full">${t('home_feature_2_tag')}</span>
                        <h2 class="text-6xl font-black text-main leading-tight">${t('home_feature_2_title')}</h2>
                        <p class="text-xl text-sub leading-relaxed">${t('home_feature_2_desc')}</p>
                        <ul class="space-y-4 pt-4">
                            <li class="flex items-center gap-3 text-lg font-bold text-main">
                                <span class="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</span> ${t('home_feature_2_point_1')}
                            </li>
                            <li class="flex items-center gap-3 text-lg font-bold text-main">
                                <span class="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</span> ${t('home_feature_2_point_2')}
                            </li>
                        </ul>
                    </div>
                    <div class="lg:w-1/2 w-full">
                        <div class="aspect-video card-base bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center group overflow-hidden p-0 border-none shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Visual Preview">
                        </div>
                    </div>
                </div>
            </section>

            <!-- Testimonials -->
            <section class="mt-60 space-y-16 py-20 bg-accent/5 rounded-[60px] border border-accent-soft px-12">
                <div class="text-center space-y-4">
                    <h2 class="text-4xl font-black text-main">${t('home_testimonial_title')}</h2>
                    <div class="flex justify-center gap-2 text-2xl">⭐⭐⭐⭐⭐</div>
                </div>
                <div class="grid gap-12 md:grid-cols-2">
                    <div class="space-y-6">
                        <p class="text-2xl text-sub italic leading-relaxed font-medium">${t('home_testimonial_1_quote')}</p>
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-accent-soft"></div>
                            <div>
                                <p class="font-black text-main text-lg">${t('home_testimonial_1_name')}</p>
                                <p class="text-sm text-muted font-bold">${t('home_testimonial_1_role')}</p>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-6">
                        <p class="text-2xl text-sub italic leading-relaxed font-medium">${t('home_testimonial_2_quote')}</p>
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-accent-soft"></div>
                            <div>
                                <p class="font-black text-main text-lg">${t('home_testimonial_2_name')}</p>
                                <p class="text-sm text-muted font-bold">${t('home_testimonial_2_role')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Public Previews -->
            <section id="public-diary-preview" class="mt-60 space-y-16">
                <div class="flex flex-wrap items-end justify-between border-b border-accent-soft pb-10 gap-6">
                    <div>
                        <h2 class="text-5xl font-black tracking-tight text-main">${t('public_diary_previews')}</h2>
                        <p class="text-xl text-sub mt-4">${t('public_section_hint')}</p>
                    </div>
                    <button class="nav-link !text-lg !text-accent border-b-2 border-accent active" data-nav="list">
                        ${t('section_cta_hint')} →
                    </button>
                </div>
                <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-4 pt-4">
                    ${displayDiaries.map((diary) => createCard(diary, state, { guest: true })).join('')}
                </div>
            </section>

            <!-- Final CTA -->
            <section class="mt-60 text-center space-y-12 py-32 relative">
                <div class="absolute inset-0 bg-accent/5 rounded-[80px] -z-10 rotate-1"></div>
                <h2 class="text-6xl font-black text-main leading-tight">
                    ${t('home_cta_title')}
                </h2>
                <div class="flex flex-wrap justify-center gap-8 pt-8">
                    <button type="button" class="btn-primary px-16 py-8 text-2xl shadow-2xl" data-open-auth="register">
                        ${t('sign_in_to_save')}
                    </button>
                    <button type="button" class="btn-secondary px-16 py-8 text-2xl" data-guest-login>
                        ${t('continue_as_guest')}
                    </button>
                </div>
                <p class="text-muted font-bold mt-12">${t('home_cta_sub')}</p>
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
                    <p class="text-lg text-sub">${isLogin ? t('no_account_yet') : t('already_have_account')} <button type="button" class="font-black text-accent hover:brightness-110 transition underline decoration-2 underline-offset-8" data-toggle-auth-mode>${isLogin ? t('register_now') : t('login_now')}</button></p>
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

                <div class="relative py-10">
                    <div class="absolute inset-0 flex items-center">
                        <div class="w-full border-t border-[var(--color-border-main)]"></div>
                    </div>
                    <div class="relative flex justify-center text-[10px] font-black uppercase tracking-[0.4em]">
                        <span class="bg-[var(--color-bg-secondary)] px-6 text-muted">OR</span>
                    </div>
                </div>

                <button type="button" class="w-full btn-secondary py-5 text-xl" data-guest-login>
                    ${t('continue_as_guest')}
                </button>
            </div>
        </section>
    `;
}

function listView(state) {
    const isAuth = state.auth.isAuthenticated;
    const role = state.auth.currentUser?.role || 'guest';
    const isGuest = role === 'guest';

    return `
        <section class="space-y-12 py-12 fade-in artistic-view-container">
            <div class="view-blob view-blob-secondary"></div>

            <header class="flex flex-wrap items-end justify-between gap-6 border-b border-accent-soft pb-10 relative z-10">
                <div>
                    <h2 class="text-5xl font-black tracking-tight text-main">${t('dashboard_title')}</h2>
                    <p class="mt-4 text-xl text-sub font-medium">${isAuth && !isGuest ? t('dashboard_desc') : (isGuest ? t('guest_browsing_desc') : t('login_to_save_permanently'))}</p>
                </div>
                <div class="flex gap-4">
                    ${isAuth && !isGuest ? `
                        <button type="button" class="btn-primary text-base" data-nav="form">${t('new_diary')}</button>
                        <button type="button" class="btn-secondary !py-3 !px-6 text-base" data-refresh-api>${t('refresh_api')}</button>
                    ` : `
                        <div class="px-6 py-4 bg-accent/5 border border-accent-soft rounded-3xl flex items-center gap-4">
                            <span class="text-sm font-bold text-accent">${isGuest ? t('login_to_save_permanently') : t('login_to_save_permanently')}</span>
                            <button class="btn-primary !py-2 !px-6 text-xs" data-open-auth="login">${t('login_now')}</button>
                        </div>
                    `}
                </div>
            </header>

            <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3 relative z-10" data-diary-grid>
                ${state.diaries.map((diary) => createCard(diary, state, { guest: !isAuth })).join('')}
            </div>
            
            ${state.diaries.length === 0 ? `
                <div class="py-32 text-center space-y-6 card-base border-dashed relative z-10">
                    <div class="text-6xl">📝</div>
                    <h3 class="text-2xl font-black text-main">${isGuest ? t('login_to_save_permanently') : t('no_history_yet')}</h3>
                    <p class="text-sub">${isGuest ? t('auth_register_sub') : t('featured_default_desc')}</p>
                    ${isGuest ? `<button class="btn-primary !py-3 !px-10 mt-4 mx-auto block" data-open-auth="register">${t('register_now')}</button>` : ''}
                </div>
            ` : ''}
        </section>
    `;
}

function detailView(state, { guest = false } = {}) {
    const diary = state.diaries.find((item) => String(item.id) === String(state.selectedDiaryId));
    if (!diary) return '';
    const mood = moodInfo(diary.mood);
    const isAdmin = state.auth.currentUser?.role === 'admin';
    return `
        <section class="mx-auto max-w-5xl py-12 fade-in artistic-view-container">
            <div class="view-blob view-blob-primary"></div>
            <div class="view-blob view-blob-secondary"></div>
            
            <div class="card-base space-y-12 relative z-10 overflow-hidden">
                <!-- Top Navigation/Info -->
                <div class="flex items-center justify-between pb-8 border-b border-slate-100 dark:border-slate-800">
                    <button type="button" class="group flex items-center gap-2 text-base font-black text-muted hover:text-accent transition" data-back-list>
                        <span class="transition-transform group-hover:-translate-x-1">←</span> ${t('back_to_list')}
                    </button>
                    <div class="flex items-center gap-3">
                        ${diary.is_public ? `<span class="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-widest border border-accent-soft">Public Entry</span>` : `<span class="px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] text-muted text-[10px] font-black uppercase tracking-widest border border-[var(--color-accent-soft)]">Private Entry</span>`}
                        <div class="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                        <span class="text-xs font-black uppercase tracking-widest text-muted">${formatDiaryDate(diary.date)}</span>
                    </div>
                </div>

                <!-- Main Content Body -->
                <div class="flex flex-col lg:flex-row gap-16">
                    <div class="lg:w-1/3 flex flex-col items-center text-center space-y-6">
                        <div class="detail-mood-wrapper">
                            ${mood.emoji}
                        </div>
                        <div>
                            <p class="text-sm font-black uppercase tracking-[0.3em] text-accent mb-2">${moodLabel(diary.mood)}</p>
                            <h1 class="text-4xl font-black text-main leading-tight">${escapeHtml(diary.title)}</h1>
                        </div>
                    </div>
                    
                    <div class="lg:w-2/3 space-y-8">
                        <div class="text-2xl leading-relaxed text-sub whitespace-pre-line font-medium border-l-8 border-accent-soft pl-10 py-4 italic bg-accent-subtle/30 rounded-r-3xl">
                            ${escapeHtml(diary.content)}
                        </div>
                        
                        ${diary.image_url ? `
                            <div class="rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 rotate-1 hover:rotate-0 transition-transform duration-500">
                                <img src="${escapeHtml(diary.image_url)}" class="w-full h-auto" alt="Diary photo">
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Footer Actions -->
                ${!guest && (isAdmin || String(diary.user_id) === String(state.auth.currentUser?.id)) ? `
                <div class="flex justify-end gap-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" class="btn-primary text-base px-10" data-edit-diary="${diary.id}">${t('edit')}</button>
                    <button type="button" class="btn-secondary !text-rose-600 !border-rose-100 hover:!bg-rose-50 px-10" data-delete-diary="${diary.id}">${t('delete')}</button>
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
                            <div class="relative group aspect-video rounded-3xl overflow-hidden bg-[var(--color-accent-subtle)] dark:bg-white/5 border-2 border-dashed border-[var(--color-accent-soft)] dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-accent transition-colors" data-photo-placeholder>
                                <div class="photo-preview w-full h-full flex items-center justify-center">
                                    ${diary?.image_url ? `<img src="${diary.image_url}" class="w-full h-full object-cover">` : `<span class="text-4xl">📸</span>`}
                                </div>
                                <input type="file" accept="image/*" hidden data-photo-file-input>
                                <input type="hidden" name="image_url" value="${diary?.image_url || ''}">
                            </div>
                            <div class="flex flex-col justify-center space-y-4">
                                <p class="text-sm text-sub">${t('photo_upload_hint')}</p>
                                <input class="input-base text-sm" placeholder="${t('image_url_placeholder')}" value="${escapeHtml(diary?.image_url || '')}" data-photo-url-input>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-black uppercase tracking-widest text-muted">${t('content_label')}</label>
                        <textarea name="content" rows="12" class="input-base text-lg font-medium leading-relaxed" placeholder="${t('content_placeholder')}" required>${escapeHtml(diary?.content || '')}</textarea>
                    </div>

                    <!-- Visibility Toggle -->
                    <div class="p-8 bg-[var(--color-accent-subtle)] dark:bg-white/5 rounded-[32px] border border-[var(--color-accent-soft)] dark:border-white/10 flex items-center justify-between group hover:border-accent/30 transition-colors">
                        <div class="flex items-center gap-5">
                            <div class="w-14 h-14 bg-[var(--color-accent-subtle)] dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-[var(--color-accent-soft)] dark:border-slate-700">
                                <span id="visibility-icon" class="transition-transform group-hover:scale-110">${diary?.is_public ? '🌍' : '🔒'}</span>
                            </div>
                            <div>
                                <h4 class="text-xl font-black text-main">${t('visibility_settings')}</h4>
                                <p class="text-sm text-muted">${t('current_status')} <span id="visibility-text" class="font-bold text-accent">${diary?.is_public ? t('status_public') : t('status_private')}</span></p>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="is_public" value="1" class="sr-only" ${diary?.is_public ? 'checked' : ''}>
                            <div class="custom-toggle">
                                <div class="toggle-knob">
                                    <span class="opacity-0 group-hover:opacity-100 transition-opacity">✨</span>
                                </div>
                            </div>
                        </label>
                    </div>

                    <div class="grid gap-8 sm:grid-cols-2">
                        <div class="space-y-2">
                            <label class="text-sm font-black uppercase tracking-widest text-muted">${t('date_label')}</label>
                            <input name="date" type="date" class="input-base text-lg font-bold" value="${diary?.date || toInputDate()}" required>
                        </div>
                        <div class="space-y-2">
                            <label class="text-sm font-black uppercase tracking-widest text-muted">${t('mood_label')}</label>
                            <select name="mood" class="input-base text-lg font-bold appearance-none cursor-pointer" required>
                                <option value="">${t('select_mood')}</option>
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
                    <div class="pt-6 border-t border-[var(--color-border-main)] space-y-6">
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
        <section class="space-y-12 py-12 fade-in artistic-view-container">
            <div class="view-blob view-blob-primary"></div>
            <div class="view-blob view-blob-secondary"></div>
            
            <header class="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-accent-soft pb-10">
                <div>
                    <h2 class="text-5xl font-black text-main tracking-tight flex items-center gap-4">
                        <span class="p-4 bg-accent/10 rounded-3xl">🛠️</span>
                        ${t('admin_dashboard_label')}
                    </h2>
                    <p class="mt-4 text-xl text-sub font-medium">系統管理主控台 — 監控、維護與管理全站內容</p>
                </div>
                <div class="flex gap-4">
                    <button type="button" class="btn-primary text-base px-8" data-refresh-api>同步最新數據</button>
                </div>
            </header>

            <div class="grid gap-8 md:grid-cols-3 relative z-10">
                <div class="card-base !p-8 flex items-center gap-6 group hover:border-accent transition-all">
                    <div class="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">👥</div>
                    <div>
                        <p class="text-xs font-black uppercase tracking-widest text-muted">${t('users')}</p>
                        <p class="text-4xl font-black text-main mt-1">${state.users.length}</p>
                    </div>
                </div>
                <div class="card-base !p-8 flex items-center gap-6 group hover:border-accent transition-all">
                    <div class="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">📖</div>
                    <div>
                        <p class="text-xs font-black uppercase tracking-widest text-muted">${t('diaries')}</p>
                        <p class="text-4xl font-black text-main mt-1">${state.diaries.length}</p>
                    </div>
                </div>
                <div class="card-base !p-8 flex items-center gap-6 group hover:border-emerald-500/30 transition-all">
                    <div class="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center text-3xl animate-pulse">🟢</div>
                    <div>
                        <p class="text-xs font-black uppercase tracking-widest text-muted">${t('system_health')}</p>
                        <p class="text-xl font-black text-emerald-600 mt-1 uppercase">${t('operational')}</p>
                    </div>
                </div>
            </div>

            <div class="grid gap-8 lg:grid-cols-2 relative z-10">
                ${renderMoodChart(moodSummary(state.diaries))}
                <div class="card-base !p-8 flex flex-col justify-center text-center space-y-4">
                    <div class="text-5xl">💡</div>
                    <h3 class="text-2xl font-black text-main">${t('admin_tips')}</h3>
                    <p class="text-sub">${t('admin_tips_desc')}</p>
                </div>
            </div>
            
            <div class="space-y-12 relative z-10">
                <div class="flex items-center gap-4 mb-4">
                    <div class="h-1 w-12 bg-accent rounded-full"></div>
                    <h4 class="text-sm font-black uppercase tracking-[0.4em] text-accent">${t('data_management_center')}</h4>
                </div>
                ${renderAdminUsersTable(state.users)}
                ${renderAdminDiariesTable(state.diaries, state.adminMoodFilter)}
            </div>
        </section>
    `;
}

export function createDiaryApp(root) {
    console.log('[App] Initializing createDiaryApp');
    const initialAuth = authStore.getState();
    const state = {
        view: initialAuth.isAuthenticated 
            ? (initialAuth.currentUser?.role === 'admin' ? 'admin' : 'list')
            : 'home',
        diaries: stateful([]),
        users: stateful([]),
        selectedDiaryId: null,
        editingDiaryId: null,
        authMode: 'login',
        auth: initialAuth,
        settings: settingsStore.getState(),
        loading: false,
        error: '',
        adminMoodFilter: 'all',
        modal: null, // { title, message, actionText, onAction, icon }
    };

    function setState(patch) {
        console.log('[App] setState patch:', patch);
        Object.assign(state, patch);
        render();
    }

    function showModal(title, message, actionText, onAction, icon = '🔒') {
        console.log('[App] showModal:', { title, message });
        setState({ modal: { title, message, actionText, onAction, icon } });
    }

    settingsStore.subscribe((s) => {
        console.log('[Settings] Store update:', s);
        document.documentElement.classList.toggle('dark', s.theme === 'dark');
        setState({ settings: s });
    });

    function renderModal() {
        if (!state.modal) return '';
        const { title, message, actionText, icon } = state.modal;
        return `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-art-blob"></div>
                    <div class="relative z-10">
                        <div class="modal-icon-container">
                            <span class="text-5xl">${icon}</span>
                        </div>
                        <div class="space-y-4">
                            <h3 class="text-3xl font-black text-main leading-tight">${title}</h3>
                            <p class="text-lg text-sub leading-relaxed font-medium">${message}</p>
                        </div>
                        <div class="flex flex-col gap-4 pt-10">
                            <button class="btn-primary w-full" data-modal-action>${actionText}</button>
                            <button class="text-sm font-black text-muted hover:text-accent transition uppercase tracking-widest" data-modal-close>${t('back_to_list')}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function render() {
        console.log('[App] Rendering. View:', state.view, 'State:', state);
        const isDark = state.settings.theme === 'dark';
        const isAuth = state.auth.isAuthenticated;
        const role = state.auth.currentUser?.role || 'guest';
        const isGuest = role === 'guest';
        const isAdmin = role === 'admin';

        console.log('[App] Auth Context:', { isAuth, role, isGuest, isAdmin });

        let content = '';
        if (state.loading) {
            console.log('[App] Rendering Loading State');
            if (state.view === 'admin') content = skeletonAdminView();
            else if (state.view === 'detail') content = skeletonDetailView();
            else content = skeletonListView();
        } else if (state.view === 'auth' && !isAuth) {
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
                <!-- Atmospheric Background -->
                <div class="app-env-bg">
                    <div class="env-sun"></div>
                    <div class="env-moon"></div>
                    <div class="env-stars"></div>
                    <div class="env-cloud cloud-1"></div>
                    <div class="env-cloud cloud-2"></div>
                    <div class="env-cloud cloud-3"></div>
                </div>

                <header class="app-navbar">
                    <div class="nav-inner">
                        <div class="flex items-center gap-10">
                            <button class="brand text-main" data-nav="home">MOOD DIARY</button>
                            <nav class="hidden md:flex gap-8">
                                <button class="nav-link ${state.view === 'list' ? 'active' : ''}" data-nav="list">${t('diaries')}</button>
                                <button class="nav-link ${state.view === 'history' ? 'active' : ''}" data-nav="history">${t('history')}</button>
                                ${isAuth && !isGuest ? `<button class="nav-link ${state.view === 'profile' ? 'active' : ''}" data-nav="profile">${t('profile')}</button>` : ''}
                                ${isAdmin ? `<button class="nav-link ${state.view === 'admin' ? 'active' : ''}" data-nav="admin">${t('admin')}</button>` : ''}
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
                                    <button class="text-xs font-black uppercase tracking-widest text-sub hover:text-accent transition" data-open-auth="login">${t('login')}</button>
                                    <button class="btn-primary text-xs py-2.5 px-6 shadow-none" data-open-auth="register">${t('register')}</button>
                                    <button class="hidden lg:block text-xs font-black uppercase tracking-widest text-sub hover:text-accent transition" data-guest-login>${t('continue_as_guest')}</button>
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
        
        if (state.view === 'admin' && !state.loading) {
            initMoodChart(moodSummary(state.diaries));
        }
        wireEvents();
    }

    async function fetchDiaries() {
        console.log('[API] Fetching Diaries. Auth:', state.auth.isAuthenticated);
        setState({ loading: true });
        try {
            const list = await diaryApi.list();
            console.log('[API] Fetched Success:', list.length, 'items');
            const combined = list.length > 0 ? list : [...mockDiaries];
            setState({ diaries: stateful(combined), loading: false });
        } catch (err) {
            console.error('[API] Fetch Failed:', err);
            setState({ diaries: stateful(mockDiaries), loading: false });
        }
    }

    async function fetchUsers() {
        if (state.auth.currentUser?.role !== 'admin') return;
        console.log('[API] Fetching Users for Admin');
        try {
            const list = await authApi.listUsers();
            console.log('[API] Fetched Users raw:', list);
            const userArray = Array.isArray(list) ? list : (list?.data ? list.data : []);
            console.log('[API] Extracted Users array length:', userArray.length);
            
            // Explicitly set through setState to ensure reactivity across all flows
            setState({ users: stateful(userArray) });
        } catch (err) {
            console.error('[API] Fetch Users Failed:', err);
        }
    }

    function wireEvents() {
        console.log('[Events] Wiring events for current view:', state.view);

        root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', async () => {
            const target = b.dataset.nav;
            console.log('[Nav] Clicked:', target);
            if (target === 'form' && !state.auth.isAuthenticated) {
                showModal(t('authentication'), t('login_required_to_create'), t('login_now'), () => {
                    setState({ view: 'auth', authMode: 'login', modal: null });
                });
                return;
            }
            // clear any existing form/auth error when navigating
            state.error = '';
            const targetView = target === 'home' ? (state.auth.isAuthenticated ? 'list' : 'home') : target;
            
            if (targetView === 'list' || targetView === 'admin' || targetView === 'history') {
                setState({ view: targetView, loading: true });
                if (targetView === 'admin') {
                    await Promise.all([fetchDiaries(), fetchUsers()]);
                } else {
                    await fetchDiaries();
                }
            } else {
                setState({ view: targetView, editingDiaryId: null, loading: false });
            }
        }));

        root.querySelector('[data-modal-action]')?.addEventListener('click', () => {
            console.log('[Modal] Action clicked');
            state.modal?.onAction?.();
        });

        root.querySelector('[data-modal-close]')?.addEventListener('click', () => {
            console.log('[Modal] Close clicked');
            setState({ modal: null });
        });

        root.querySelectorAll('[data-open-auth]').forEach(b => {
            b.addEventListener('click', () => {
                console.log('[Auth] Open auth mode:', b.dataset.openAuth);
                setState({ view: 'auth', authMode: b.dataset.openAuth, error: '' });
            });
        });

        root.querySelectorAll('[data-toggle-auth-mode]').forEach(b => b.addEventListener('click', () => {
            const nextMode = state.authMode === 'login' ? 'register' : 'login';
            console.log('[Auth] Toggle mode to:', nextMode);
            setState({ authMode: nextMode, error: '' });
        }));

        root.querySelectorAll('[data-logout]').forEach(b => b.addEventListener('click', () => {
            console.log('[Auth] Logout clicked');
            authStore.clearSession();
            setState({ view: 'home' });
        }));

        root.querySelectorAll('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
            console.log('[Settings] Theme toggle');
            settingsStore.toggleTheme();
        }));

        root.querySelector('[data-lang-select]')?.addEventListener('change', e => {
            console.log('[Settings] Lang change:', e.target.value);
            settingsStore.setLang(e.target.value);
        });

        root.querySelectorAll('[data-back-list]').forEach(b => b.addEventListener('click', () => {
            console.log('[Nav] Back to list');
            setState({ view: 'list', error: '' });
        }));

        root.querySelectorAll('[data-open-diary]').forEach(b => {
            b.addEventListener('click', () => {
                console.log('[Nav] Open diary ID:', b.dataset.openDiary);
                setState({ selectedDiaryId: b.dataset.openDiary, view: 'detail' });
            });
        });

        root.querySelectorAll('[data-refresh-api]').forEach(b => b.addEventListener('click', async () => {
            console.log('[API] Manual refresh requested');
            if (state.view === 'admin' || state.auth.currentUser?.role === 'admin') {
                await Promise.all([fetchDiaries(), fetchUsers()]);
            } else {
                await fetchDiaries();
            }
            setState({ editingDiaryId: null });
        }));

        root.querySelectorAll('[data-edit-diary]').forEach(b => {
            b.addEventListener('click', () => {
                console.log('[Nav] Edit diary ID:', b.dataset.editDiary);
                setState({ error: '', editingDiaryId: b.dataset.editDiary, view: 'form' });
            });
        });

        async function performDelete(id, targetRow = null) {
            console.log('[Diary] Attempt delete ID:', id);
            showModal(t('delete_confirm'), t('delete_confirm_msg'), t('delete'), async () => {
                if (targetRow) targetRow.classList.add('row-fade-out');
                setState({ modal: null });
                
                setTimeout(async () => {
                    try {
                        await diaryApi.remove(id);
                        console.log('[Diary] Delete success ID:', id);
                        state.diaries = state.diaries.filter(d => String(d.id) !== String(id));
                        if (state.view === 'detail' && String(state.selectedDiaryId) === String(id)) {
                            state.view = 'list';
                        }
                        render();
                    } catch (err) {
                        console.error('[Diary] Delete failed:', err);
                        if (targetRow) targetRow.classList.remove('row-fade-out');
                        setState({ error: err?.formattedError?.message || t('delete_failed') });
                    }
                }, targetRow ? 500 : 0);
            }, '🗑️');
        }

        if (state.view === 'admin') {
            bindAdminUsersTable(root, (id) => {
                console.log('[Admin] Suspend user ID:', id);
                const row = root.querySelector(`[data-suspend-user="${id}"]`)?.closest('tr');
                if (row) {
                    showModal(t('suspend_confirm_title'), t('suspend_confirm_msg').replace('{id}', id), t('ok'), () => {
                        row.classList.add('row-fade-out');
                        setState({ modal: null });
                        setTimeout(async () => {
                            try {
                                await authApi.deleteUser(id);
                                console.log('[Admin] User deleted ID:', id);
                                state.users = state.users.filter(u => String(u.id) !== String(id));
                                render();
                            } catch (err) {
                                console.error('[Admin] Delete user failed:', err);
                                row.classList.remove('row-fade-out');
                                setState({ error: err?.formattedError?.message || '刪除使用者失敗' });
                            }
                        }, 500);
                    }, '🚫');
                }
            });
            bindAdminDiariesTable(root, async (id) => {
                const row = root.querySelector(`[data-delete-diary="${id}"]`)?.closest('tr');
                performDelete(id, row);
            }, (id) => {
                console.log('[Admin] Edit diary ID:', id);
                setState({ error: '', editingDiaryId: id, view: 'form' });
            });

            root.querySelector('[data-mood-filter]')?.addEventListener('change', (e) => {
                console.log('[Admin] Mood filter changed to:', e.target.value);
                setState({ adminMoodFilter: e.target.value });
            });
        } else {
            root.querySelectorAll('[data-delete-diary]').forEach(b => {
                b.addEventListener('click', () => performDelete(b.dataset.deleteDiary));
            });
        }
        
        root.querySelectorAll('[data-jump-preview]').forEach(b => {
            b.addEventListener('click', () => {
                root.querySelector('#public-diary-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        root.querySelectorAll('[data-guest-login]').forEach(b => {
            b.addEventListener('click', async () => {
                console.log('[Auth] Guest login requested');
                setState({ loading: true, error: '' });
                try {
                    const res = await authApi.guestLogin();
                    console.log('[Auth] Guest Login Success:', res);
                    authStore.setSession({ token: res.access_token, currentUser: res.user });
                    setState({ view: 'list', loading: false });
                } catch (err) {
                    console.error('[Auth] Guest Login Error:', err);
                    setState({ error: '訪客登入失敗，請稍後再試。', loading: false });
                }
            });
        });

        const photoPlaceholder = root.querySelector('[data-photo-placeholder]');
        const photoFileInput = root.querySelector('[data-photo-file-input]');
        const photoUrlInput = root.querySelector('[data-photo-url-input]');
        const photoUrlHidden = root.querySelector('input[name="image_url"]');

        if (photoPlaceholder && photoFileInput) {
            photoPlaceholder.addEventListener('click', () => {
                console.log('[Form] Photo placeholder clicked');
                photoFileInput.click();
            });
        }

        if (photoFileInput) {
            photoFileInput.addEventListener('change', async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                console.log('[Form] Photo selected:', file.name);

                try {
                    const { url } = await photoApi.uploadPhoto(file);
                    console.log('[Form] Photo uploaded:', url);
                    
                    let normalizedUrl = url || '';
                    try {
                        const resolved = new URL(normalizedUrl, window.location.origin);
                        if ((resolved.hostname === 'localhost' || resolved.hostname === '127.0.0.1') && !resolved.port && window.location.port) {
                            resolved.port = window.location.port;
                        }
                        normalizedUrl = resolved.toString();
                    } catch (e) {}

                    if (photoUrlHidden) photoUrlHidden.value = normalizedUrl;
                    if (photoUrlInput) photoUrlInput.value = normalizedUrl;
                    const preview = photoPlaceholder?.querySelector('.photo-preview');
                    if (preview) {
                        preview.innerHTML = `<img src="${normalizedUrl}" class="w-full h-full object-cover">`;
                    }
                    event.target.value = '';
                } catch (uploadError) {
                    console.error('[Form] Photo upload error:', uploadError);
                    if (uploadError.response) {
                        console.log('[Form] Photo upload response data:', JSON.stringify(uploadError.response.data, null, 2));
                        const details = uploadError.response.data.errors ? Object.values(uploadError.response.data.errors).flat().join(' ') : uploadError.response.data.message;
                        setState({ error: `圖片上傳失敗：${details}` });
                    } else {
                        setState({ error: '圖片上傳失敗，請檢查網路連線或檔案格式。' });
                    }
                }
            });
        }

        if (photoUrlInput && photoUrlHidden) {
            photoUrlInput.addEventListener('input', () => {
                const value = photoUrlInput.value.trim();
                console.log('[Form] Photo URL manual input:', value);
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

        root.querySelector('input[name="is_public"]')?.addEventListener('change', (e) => {
            console.log('[Form] Visibility toggle:', e.target.checked);
            const icon = root.querySelector('#visibility-icon');
            const text = root.querySelector('#visibility-text');
            if (icon) icon.textContent = e.target.checked ? '🌍' : '🔒';
            if (text) text.textContent = e.target.checked ? '公開發佈' : '私人日記';
        });
    }

    async function handleAuthSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        console.log('[Form] Auth submit. Mode:', state.authMode, 'Data:', { ...data, password: '***' });
        try {
            if (state.authMode === 'register') {
                await authApi.register(data);
                console.log('[Auth] Register Success');
                showModal(t('success'), '帳號已成功建立，請重新登入以開始使用。', t('login_now'), () => {
                    setState({ authMode: 'login', error: '', modal: null });
                }, '🎉');
            } else {
                const res = await authApi.login(data);
                console.log('[Auth] Login Success:', res);
                authStore.setSession({ token: res.access_token, currentUser: res.user });
                setState({ view: res.user.role === 'admin' ? 'admin' : 'list' });
            }
        } catch (err) {
            console.error('[Auth] Error:', err.response?.data);
            const errors = err.response?.data?.errors;
            const detailMsg = errors ? Object.values(errors).flat().join(' ') : '';
            setState({ error: detailMsg || err?.formattedError?.message || '認證失敗。' });
        }
    }

    async function handleDiarySubmit(e) {
        e.preventDefault();
        console.log('[Form] handleDiarySubmit started');
        try {
            const fd = new FormData(e.target);
            const isPublic = fd.get('is_public') === '1';
            console.log('[Form] Diary submit. isPublic:', isPublic, 'Data preview:', Object.fromEntries(fd));

            const submitAction = async () => {
                console.log('[Form] Executing diary submission action');
                try {
                    let res;
                    if (state.editingDiaryId) {
                        console.log('[API] Updating diary ID:', state.editingDiaryId);
                        res = await diaryApi.update(state.editingDiaryId, fd);
                        state.diaries = state.diaries.map(d => String(d.id) === String(state.editingDiaryId) ? res : d);
                    } else {
                        console.log('[API] Creating new diary');
                        res = await diaryApi.create(fd);
                        state.diaries.unshift(res);
                    }
                    console.log('[Diary] Success. Result:', res);
                    setState({ view: 'list', error: '', editingDiaryId: null });
                } catch (err) {
                    console.error('[Diary] Submission error (Full):', err);
                    const responseData = err.response?.data;
                    console.log('[Diary] Response data (Stringified):', JSON.stringify(responseData, null, 2));
                    
                    const msg = responseData?.message || err?.formattedError?.message || '儲存失敗。';
                    const errors = responseData?.errors;
                    let detailMsg = '';
                    
                    if (errors) {
                        detailMsg = Object.entries(errors)
                            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
                            .join(' | ');
                    }
                    
                    const finalMsg = detailMsg ? `${msg} (${detailMsg})` : msg;
                    console.error('[Diary] Final error message:', finalMsg);
                    setState({ error: finalMsg });
                }
            };

            if (isPublic) {
                showModal(
                    t('public_disclaimer_title'),
                    t('public_disclaimer_msg'),
                    t('confirm_publish'),
                    () => {
                        setState({ modal: null });
                        submitAction();
                    },
                    '🌍'
                );
            } else {
                submitAction();
            }
        } catch (fatalError) {
            console.error('[Form] Fatal error in handleDiarySubmit:', fatalError);
            setState({ error: '系統發生錯誤，請查看控制台日誌。' });
        }
    }

    async function handleProfileSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        console.log('[Form] Profile update submit:', data);
        try {
            const updatedUser = { ...state.auth.currentUser, ...data };
            authStore.setSession({ token: state.auth.token, currentUser: updatedUser });
            showModal(t('success'), t('profile_updated'), t('ok'), () => {
                setState({ view: 'list', modal: null });
            }, '✨');
        } catch (err) {
            console.error('[Profile] Update error:', err);
            setState({ error: '個人資料更新失敗' });
        }
    }

    authStore.subscribe(async (a) => {
        console.log('[Auth] Store updated. IsAuthenticated:', a.isAuthenticated);
        const prevAuth = state.auth?.isAuthenticated;
        state.auth = a;
        if (!prevAuth && state.auth.isAuthenticated) {
            console.log('[Auth] User just logged in, fetching diaries');
            await fetchDiaries();
        }
        render();
    });

    render();
    console.log('[App] Initial data fetch');
    fetchDiaries();
    
    if (state.auth.isAuthenticated) {
        if (state.auth.currentUser?.role === 'admin') {
            fetchUsers();
        }
        authApi.getUser().then(user => {
            console.log('[Auth] Profile refresh success:', user.email);
            authStore.setSession({ token: state.auth.token, currentUser: user });
        }).catch(err => {
            console.error('[Auth] Profile refresh failed, clearing session:', err);
            authStore.clearSession();
        });
    }
}
