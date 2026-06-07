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
                        <span class="text-sm font-bold text-accent">想要保存您的專屬心情軌跡嗎？</span>
                        <button class="btn-primary !py-2 !px-6 text-xs" data-open-auth="register">${t('register_now')}</button>
                    </div>
                ` : ''}
            </header>
            
            <div class="space-y-8 relative z-10">
                ${!isAuth ? `
                    <div class="py-32 text-center card-base border-dashed space-y-6">
                        <div class="text-6xl">🔒</div>
                        <h3 class="text-2xl font-black text-main">請先登入以查看您的歷史紀錄</h3>
                        <p class="text-sub">註冊或登入後，系統將會為您分析每一天的情緒起伏，陪伴您見證自我成長。</p>
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
    // Priority: Admin mock diaries (first 3) + Newest real public diaries
    const adminMocks = state.diaries.filter(d => d.user_id === 999).slice(0, 3);
    const otherPublic = state.diaries.filter(d => d.is_public && d.user_id !== 999).slice(0, 1);
    const displayDiaries = [...adminMocks, ...otherPublic];
    
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
                    ${t('home_desc')} 這裡不僅是文字的空間，更是您尋找內心平靜的數位避風港。
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
                    <h2 class="text-4xl font-black text-main">簡單三步，開啟您的內心探索</h2>
                    <div class="w-24 h-1.5 bg-accent mx-auto rounded-full"></div>
                </div>
                
                <div class="grid gap-12 md:grid-cols-3">
                    <div class="group card-base text-center space-y-6 hover:border-accent transition-all relative overflow-hidden">
                        <div class="absolute top-4 right-6 text-7xl font-black text-accent/10 pointer-events-none select-none">01</div>
                        <div class="relative z-10 w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center text-4xl mx-auto group-hover:scale-110 transition-transform">✍️</div>
                        <h3 class="relative z-10 text-2xl font-black text-main">捕捉當下</h3>
                        <p class="relative z-10 text-sub leading-relaxed">隨時隨地記錄您的想法與照片，捕捉那些稍縱即逝的情緒瞬間。</p>
                    </div>
                    <div class="group card-base text-center space-y-6 hover:border-accent transition-all relative overflow-hidden">
                        <div class="absolute top-4 right-6 text-7xl font-black text-accent/10 pointer-events-none select-none">02</div>
                        <div class="relative z-10 w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center text-4xl mx-auto group-hover:scale-110 transition-transform">📊</div>
                        <h3 class="relative z-10 text-2xl font-black text-main">分析趨勢</h3>
                        <p class="relative z-10 text-sub leading-relaxed">透過精美圖表，回顧一週、一月的情緒波動，發現更深層的自我。</p>
                    </div>
                    <div class="group card-base text-center space-y-6 hover:border-accent transition-all relative overflow-hidden">
                        <div class="absolute top-4 right-6 text-7xl font-black text-accent/10 pointer-events-none select-none">03</div>
                        <div class="relative z-10 w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center text-4xl mx-auto group-hover:scale-110 transition-transform">🌱</div>
                        <h3 class="relative z-10 text-2xl font-black text-main">持續成長</h3>
                        <p class="relative z-10 text-sub leading-relaxed">在反思中獲得平靜，讓 Mood Diary 陪伴您走向更健康的心靈生活。</p>
                    </div>
                </div>
            </section>

            <!-- Feature Showcase: Deep Dive -->
            <section class="mt-60 space-y-32">
                <div class="flex flex-col lg:flex-row items-center gap-20">
                    <div class="lg:w-1/2 space-y-8">
                        <span class="text-xs font-black text-accent uppercase tracking-widest px-4 py-1 bg-accent/10 rounded-full">極致隱私</span>
                        <h2 class="text-6xl font-black text-main leading-tight">您的祕密，<br>只有您知道。</h2>
                        <p class="text-xl text-sub leading-relaxed">我們深知日記的私密性。這就是為什麼我們採用業界最嚴格的加密標準，您的所有數據在傳輸與存儲過程中都受到完整保護。</p>
                        <div class="grid grid-cols-2 gap-6 pt-4">
                            <div class="space-y-2">
                                <div class="text-accent text-2xl">🔒</div>
                                <h4 class="font-black text-main">端對端傳輸</h4>
                                <p class="text-sm text-muted">確保連線絕對安全。</p>
                            </div>
                            <div class="space-y-2">
                                <div class="text-accent text-2xl">🛡️</div>
                                <h4 class="font-black text-main">隱私優先</h4>
                                <p class="text-sm text-muted">我們絕不讀取您的內容。</p>
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
                        <span class="text-xs font-black text-accent uppercase tracking-widest px-4 py-1 bg-accent/10 rounded-full">多媒體紀錄</span>
                        <h2 class="text-6xl font-black text-main leading-tight">不只是文字，<br>還有回憶。</h2>
                        <p class="text-xl text-sub leading-relaxed">有時候，一張照片勝過千言萬語。Mood Diary 支援圖片上傳，讓您能將當下的美景、食物或是笑容與文字一同封存。</p>
                        <ul class="space-y-4 pt-4">
                            <li class="flex items-center gap-3 text-lg font-bold text-main">
                                <span class="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</span> 無限制圖片上傳
                            </li>
                            <li class="flex items-center gap-3 text-lg font-bold text-main">
                                <span class="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs">✓</span> 雲端即時同步
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
                    <h2 class="text-4xl font-black text-main">聽聽使用者怎麼說</h2>
                    <div class="flex justify-center gap-2 text-2xl">⭐⭐⭐⭐⭐</div>
                </div>
                <div class="grid gap-12 md:grid-cols-2">
                    <div class="space-y-6">
                        <p class="text-2xl text-sub italic leading-relaxed font-medium">"這是我用過最純粹的日記 App。沒有社交干擾，只有我與自己的對話。介面真的美得讓人每天都想寫。"</p>
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-accent-soft"></div>
                            <div>
                                <p class="font-black text-main text-lg">李小姐</p>
                                <p class="text-sm text-muted font-bold">產品設計師</p>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-6">
                        <p class="text-2xl text-sub italic leading-relaxed font-medium">"原本以為自己沒辦法持續寫日記，但 Mood Diary 的操作非常簡單，視覺化圖表讓我很有成就感。"</p>
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-accent-soft"></div>
                            <div>
                                <p class="font-black text-main text-lg">張先生</p>
                                <p class="text-sm text-muted font-bold">大學教授</p>
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
                    每一種情緒都值得被記錄。<br>
                    <span class="text-accent">現在就開始您的旅程吧。</span>
                </h2>
                <div class="flex flex-wrap justify-center gap-8 pt-8">
                    <button type="button" class="btn-primary px-16 py-8 text-2xl shadow-2xl" data-open-auth="register">
                        ${t('sign_in_to_save')}
                    </button>
                    <button type="button" class="btn-secondary px-16 py-8 text-2xl" data-guest-login>
                        ${t('continue_as_guest')}
                    </button>
                </div>
                <p class="text-muted font-bold mt-12">已有超過 10,000+ 位使用者加入我們</p>
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
    return `
        <section class="space-y-12 py-12 fade-in artistic-view-container">
            <div class="view-blob view-blob-secondary"></div>

            <header class="flex flex-wrap items-end justify-between gap-6 border-b border-accent-soft pb-10 relative z-10">
                <div>
                    <h2 class="text-5xl font-black tracking-tight text-main">${t('dashboard_title')}</h2>
                    <p class="mt-4 text-xl text-sub font-medium">${isAuth ? t('dashboard_desc') : '正在以訪客模式體驗功能預覽'}</p>
                </div>
                <div class="flex gap-4">
                    ${isAuth ? `
                        <button type="button" class="btn-primary text-base" data-nav="form">${t('new_diary')}</button>
                        <button type="button" class="btn-secondary !py-3 !px-6 text-base" data-refresh-api>${t('refresh_api')}</button>
                    ` : `
                        <div class="px-6 py-4 bg-accent/5 border border-accent-soft rounded-3xl flex items-center gap-4">
                            <span class="text-sm font-bold text-accent">登入後即可開始紀錄您的生活</span>
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
                                <p class="text-sm text-sub">點擊區域上傳照片或貼上圖片 URL，系統會自動儲存連結。</p>
                                <input class="input-base text-sm" placeholder="輸入圖片 URL..." value="${diary?.image_url || ''}" data-photo-url-input>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <label class="text-sm font-black uppercase tracking-widest text-muted">${t('content_label')}</label>
                        <textarea name="content" rows="12" class="input-base text-lg font-medium leading-relaxed" placeholder="寫下此時此刻的想法..." required>${escapeHtml(diary?.content || '')}</textarea>
                    </div>

                    <!-- Visibility Toggle -->
                    <div class="p-8 bg-[var(--color-accent-subtle)] dark:bg-white/5 rounded-[32px] border border-[var(--color-accent-soft)] dark:border-white/10 flex items-center justify-between group hover:border-accent/30 transition-colors">
                        <div class="flex items-center gap-5">
                            <div class="w-14 h-14 bg-[var(--color-accent-subtle)] dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-[var(--color-accent-soft)] dark:border-slate-700">
                                <span id="visibility-icon" class="transition-transform group-hover:scale-110">${diary?.is_public ? '🌍' : '🔒'}</span>
                            </div>
                            <div>
                                <h4 class="text-xl font-black text-main">公開設定</h4>
                                <p class="text-sm text-muted">目前狀態：<span id="visibility-text" class="font-bold text-accent">${diary?.is_public ? '公開發佈' : '私人日記'}</span></p>
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
                        <p class="text-xs font-black uppercase tracking-widest text-muted">系統健康度</p>
                        <p class="text-xl font-black text-emerald-600 mt-1 uppercase">Operational</p>
                    </div>
                </div>
            </div>

            <div class="grid gap-8 lg:grid-cols-2 relative z-10">
                ${renderMoodChart(moodSummary(state.diaries))}
                <div class="card-base !p-8 flex flex-col justify-center text-center space-y-4">
                    <div class="text-5xl">💡</div>
                    <h3 class="text-2xl font-black text-main">管理小撇步</h3>
                    <p class="text-sub">定期查看情緒分佈，可以幫助您了解全站使用者的整體心理狀態，以便適時調整營運策略或推送溫馨內容。</p>
                </div>
            </div>
            
            <div class="space-y-12 relative z-10">
                <div class="flex items-center gap-4 mb-4">
                    <div class="h-1 w-12 bg-accent rounded-full"></div>
                    <h4 class="text-sm font-black uppercase tracking-[0.4em] text-accent">資料管理中心</h4>
                </div>
                ${renderAdminUsersTable(state.users)}
                ${renderAdminDiariesTable(state.diaries, 'all')}
            </div>
        </section>
    `;
}

export function createDiaryApp(root) {
    const initialAuth = authStore.getState();
    const state = {
        view: initialAuth.isAuthenticated 
            ? (initialAuth.currentUser?.role === 'admin' ? 'admin' : 'list')
            : 'home',
        diaries: stateful([]),
        users: stateful(mockUsers),
        selectedDiaryId: null,
        editingDiaryId: null,
        authMode: 'login',
        auth: initialAuth,
        settings: settingsStore.getState(),
        loading: false,
        error: '',
        modal: null, // { title, message, actionText, onAction, icon }
    };

    function setState(patch) {
        Object.assign(state, patch);
        render();
    }

    function showModal(title, message, actionText, onAction, icon = '🔒') {
        setState({ modal: { title, message, actionText, onAction, icon } });
    }

    settingsStore.subscribe((s) => {
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
        console.log('Rendering App, current state:', state);
        const isDark = state.settings.theme === 'dark';
        const isAuth = state.auth.isAuthenticated;
        const role = state.auth.currentUser?.role || 'guest';
        const isGuest = role === 'guest';
        const isAdmin = role === 'admin';

        console.log('Auth Status:', { isAuth, role, isGuest, isAdmin, currentView: state.view });

        let content = '';
        if (state.loading) {
            if (state.view === 'admin') content = skeletonAdminView();
            else if (state.view === 'detail') content = skeletonDetailView();
            else content = skeletonListView();
        } else if (state.view === 'auth' && !isAuth) {
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
        console.log('Fetching Diaries... Authenticated:', state.auth.isAuthenticated);
        setState({ loading: true });
        try {
            const list = await diaryApi.list();
            console.log('Fetched Diaries Success:', list.length, 'items');
            
            // Merge mockDiaries (Admin posts) with real API results to ensure persistence
            const combined = [...mockDiaries];
            list.forEach(diary => {
                if (!combined.some(m => String(m.id) === String(diary.id))) {
                    combined.push(diary);
                }
            });
            
            setState({ diaries: stateful(combined), loading: false });
        } catch (err) {
            console.error('Fetch Diaries Failed:', err);
            // Even if API fails, ensure mock data is available
            setState({ diaries: stateful(mockDiaries), loading: false });
            if (state.auth.isAuthenticated) {
                console.warn('Failed to fetch diaries from API', err);
            }
        }
    }

    function wireEvents() {
        root.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', async () => {
            if (b.dataset.nav === 'form' && !state.auth.isAuthenticated) {
                showModal(t('authentication'), t('login_required_to_create'), t('login_now'), () => {
                    setState({ view: 'auth', authMode: 'login', modal: null });
                });
                return;
            }
            // clear any existing form/auth error when navigating
            state.error = '';
            const targetView = b.dataset.nav === 'home' ? (state.auth.isAuthenticated ? 'list' : 'home') : b.dataset.nav;
            
            if (targetView === 'list' || targetView === 'admin' || targetView === 'history') {
                setState({ view: targetView, loading: true });
                await fetchDiaries();
            } else {
                setState({ view: targetView, editingDiaryId: null });
            }
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
            state.view = 'list';
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

        async function performDelete(id, targetRow = null) {
            showModal(t('delete_confirm'), '確定要永久刪除這篇日記嗎？此動作無法復原。', t('delete'), async () => {
                if (targetRow) {
                    targetRow.classList.add('row-fade-out');
                }
                
                // Close modal immediately to show the fade-out effect
                setState({ modal: null });
                
                setTimeout(async () => {
                    try {
                        await diaryApi.remove(id);
                        state.diaries = state.diaries.filter(d => String(d.id) !== String(id));
                        // If we were viewing the detail of the deleted diary, go back to list
                        if (state.view === 'detail' && String(state.selectedDiaryId) === String(id)) {
                            state.view = 'list';
                        }
                        render();
                    } catch (err) {
                        if (targetRow) targetRow.classList.remove('row-fade-out');
                        state.error = err?.formattedError?.message || '刪除失敗';
                        render();
                    }
                }, targetRow ? 500 : 0);
            }, '🗑️');
        }

        if (state.view === 'admin') {
            bindAdminUsersTable(root, (id) => {
                const row = root.querySelector(`[data-suspend-user="${id}"]`)?.closest('tr');
                if (row) {
                    showModal('停用確認', `確定要停用使用者 #${id} 嗎？`, '停用', () => {
                        row.classList.add('row-fade-out');
                        setTimeout(() => {
                             alert(`Suspend user ${id} (Mock)`);
                             setState({ modal: null });
                        }, 500);
                    }, '🚫');
                }
            });
            bindAdminDiariesTable(root, async (id) => {
                const row = root.querySelector(`[data-delete-diary="${id}"]`)?.closest('tr');
                performDelete(id, row);
            });
        } else {
            // Non-admin view (Detail view) delete binding
            root.querySelectorAll('[data-delete-diary]').forEach(b => {
                b.addEventListener('click', async () => {
                    performDelete(b.dataset.deleteDiary);
                });
            });
        }
        
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

        // Visibility toggle icon update
        root.querySelector('input[name="is_public"]')?.addEventListener('change', (e) => {
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
        console.log('Attempting Auth:', { mode: state.authMode, data }); // Debug
        try {
            const res = state.authMode === 'register' ? await authApi.register(data) : await authApi.login(data);
            console.log('Auth Success:', res);
            authStore.setSession({ token: res.access_token, currentUser: res.user });
            state.view = res.user.role === 'admin' ? 'admin' : 'list';
            render();
        } catch (err) {
            console.error('Auth Error Details:', err.response?.data);
            const errors = err.response?.data?.errors;
            const detailMsg = errors ? Object.values(errors).flat().join(' ') : '';
            state.error = detailMsg || err?.formattedError?.message || '認證失敗。';
            render();
        }
    }

    async function handleDiarySubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const isPublic = fd.get('is_public') === '1';

        const submitAction = async () => {
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
        };

        if (isPublic) {
            showModal(
                '公開發佈聲明',
                '在公開此日記前，請確認：<br>1. 內容符合網路通訊規定與法律。<br>2. 避免包含侮辱、歧視或仇恨性言論。<br>3. 您同意將此內容展示給大眾。<br><br>點擊「確認發佈」即代表您同意上述聲明。',
                '確認發佈',
                () => {
                    setState({ modal: null });
                    submitAction();
                },
                '🌍'
            );
        } else {
            submitAction();
        }
    }

    async function handleProfileSubmit(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd);
        try {
            // Mock API call for profile update
            console.log('Update profile', data);
            const updatedUser = { ...state.auth.currentUser, ...data };
            authStore.setSession({ token: state.auth.token, currentUser: updatedUser });
            showModal(t('success'), t('profile_updated'), t('ok'), () => {
                setState({ view: 'list', modal: null });
            }, '✨');
        } catch (err) {
            state.error = '個人資料更新失敗';
            render();
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
