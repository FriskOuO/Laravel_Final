import { MOOD_META } from '../constants.js';
import { t } from '../i18n.js';

export function renderMoodChart(summary) {
    // This function now only provides the container; the actual chart is initialized after rendering
    return `
        <section class="card-base !p-8 shadow-xl">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h3 class="text-2xl font-black text-main">${t('mood_chart')}</h3>
                    <p class="text-sm text-muted">全站使用者的情緒分布概況</p>
                </div>
                <div class="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-2xl">📊</div>
            </div>
            <div class="relative aspect-square max-h-[300px] mx-auto">
                <canvas id="moodPieChart"></canvas>
            </div>
            <div id="chart-legend" class="mt-8 grid grid-cols-3 gap-4">
                <!-- Legend items will be injected here or managed by Chart.js -->
            </div>
        </section>
    `;
}

export function initMoodChart(summary) {
    const ctx = document.getElementById('moodPieChart');
    if (!ctx) return;

    const data = {
        labels: [t('mood_happy'), t('mood_neutral'), t('mood_sad')],
        datasets: [{
            data: [summary.happy || 0, summary.neutral || 0, summary.sad || 0],
            backgroundColor: [
                '#fbbf24', // Amber-400
                '#38bdf8', // Sky-400
                '#fb7185'  // Rose-400
            ],
            borderWidth: 0,
            hoverOffset: 20
        }]
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 30 // 增加內邊距，防止 hoverOffset 彈出時卡到邊框
            },
            plugins: {
                legend: { display: false }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 2000,
                easing: 'easeOutQuart'
            }
        }
    });
}