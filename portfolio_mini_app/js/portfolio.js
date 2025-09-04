import { trackEvent } from './script.js';

let portfolioChartInstance = null;
let popupChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    trackEvent('page_view_portfolio');

    const investmentData = JSON.parse(localStorage.getItem('investmentData'));
    if (!investmentData) {
        document.querySelector('.container').innerHTML = '<h1>Данные о портфеле не найдены.</h1><p>Пожалуйста, соберите портфель заново.</p><a href="index.html">На главную</a>';
        return;
    }

    // --- Инициализация компонентов ---
    displayPortfolioData(investmentData);
    initializeAssetsToggle();
    initializeTabs();
    initializeSlider();
    initializeChart(investmentData);
    initializePopup();
    // --- ИНИЦИАЛИЗАЦИЯ КНОПКИ ПОДТВЕРЖДЕНИЯ ---
    initializeFinalConfirmation();

    // --- Обработчики кнопок в шапке ---
    const editBtn = document.getElementById('edit-portfolio-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            trackEvent('click_edit_portfolio');
            window.location.href = 'edit-portfolio.html';
        });
    }
    
    const restartBtn = document.getElementById('restart-btn');
    if(restartBtn) {
        restartBtn.addEventListener('click', () => {
            trackEvent('click_restart_portfolio');
            // Очищаем данные и переходим на главную
            localStorage.removeItem('investmentData');
            localStorage.removeItem('surveyData');
            window.location.href = 'index.html';
        });
    }
});

function displayPortfolioData(data) {
    document.getElementById('portfolio-amount').textContent = `${data.amount.toLocaleString('ru-RU')} ₽`;
    document.getElementById('portfolio-term').textContent = `${data.term} лет`;
    const strategies = { conservative: 'Консервативная', moderate: 'Умеренная', aggressive: 'Агрессивная' };
    document.getElementById('portfolio-strategy').textContent = strategies[data.riskProfile];
    
    const assets = getAssetsByStrategy(data.riskProfile);
    document.getElementById('assets-list').innerHTML = assets.map(asset => `
        <div class="asset-item">
            <span class="asset-name">${asset.name}</span>
            <span class="asset-percent">${asset.percent}%</span>
        </div>
    `).join('');
}

function getAssetsByStrategy(riskProfile) {
    switch (riskProfile) {
        case 'conservative': return [{ name: 'Облигации РФ', percent: 60 }, { name: 'Акции РФ', percent: 20 }, { name: 'Золото', percent: 15 }, { name: 'Денежные средства', percent: 5 }];
        case 'aggressive': return [{ name: 'Акции РФ', percent: 50 }, { name: 'Акции США', percent: 30 }, { name: 'Криптовалюта', percent: 15 }, { name: 'Венчурные фонды', percent: 5 }];
        default: return [{ name: 'Акции РФ', percent: 40 }, { name: 'Облигации РФ', percent: 35 }, { name: 'Акции США', percent: 20 }, { name: 'Золото', percent: 5 }];
    }
}

function initializeAssetsToggle() {
    const toggle = document.getElementById('assets-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => toggle.classList.toggle('expanded'));
    }
}

function initializeSlider() {
    const sliderWrapper = document.getElementById('slider-wrapper');
    if (!sliderWrapper) return;
    const similarPortfolios = [
        { title: 'Петр, 22 года', desc: 'Начинающий инвестор, умеренная стратегия.', returns: '+68%', riskProfile: 'moderate' },
        { title: 'Анна, 35 лет', desc: 'Опытный инвестор, агрессивный рост.', returns: '+102%', riskProfile: 'aggressive' },
        { title: 'Иван, 50 лет', desc: 'Консервативный подход, стабильный доход.', returns: '+15%', riskProfile: 'conservative' },
    ];
    sliderWrapper.innerHTML = `<div class="slider-track">${similarPortfolios.map((p, index) => `<div class="slide"><h4 class="slide-title">${p.title}</h4><p class="slide-desc">${p.desc}</p><p class="slide-return">${p.returns} годовых</p><button class="btn btn-secondary btn-expand-portfolio" data-index="${index}">Развернуть портфель</button></div>`).join('')}</div>`;
    
    document.querySelectorAll('.btn-expand-portfolio').forEach(btn => {
        btn.addEventListener('click', () => {
            const portfolioData = similarPortfolios[btn.dataset.index];
            showPortfolioPopup(portfolioData);
            trackEvent('click_expand_similar_portfolio', { title: portfolioData.title });
        });
    });

    const track = document.querySelector('.slider-track');
    let currentIndex = 0;
    const updateSlider = () => track && (track.style.transform = `translateX(-${currentIndex * 100}%)`);
    document.getElementById('slider-prev').addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + similarPortfolios.length) % similarPortfolios.length;
        updateSlider();
    });
    document.getElementById('slider-next').addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % similarPortfolios.length;
        updateSlider();
    });
}

function initializePopup() {
    const popup = document.getElementById('portfolio-popup');
    popup?.addEventListener('click', (e) => {
        if (e.target === popup || e.target.id === 'popup-close') {
            popup.classList.remove('active');
        }
    });
}

function initializeTabs() {
    const switcherBtns = document.querySelectorAll('.switcher-btn');
    const views = document.querySelectorAll('.view');

    switcherBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const viewToShow = btn.dataset.view;
            
            switcherBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            views.forEach(view => view.classList.toggle('active', view.id === `${viewToShow}-view`));
            
            trackEvent('switch_portfolio_view', { view: viewToShow });
        });
    });
}

// --- ИСПРАВЛЕННАЯ ФУНКЦИЯ ---
function initializeFinalConfirmation() {
    const confirmBtn = document.getElementById('confirm-portfolio-btn');
    if (!confirmBtn) return;

    confirmBtn.addEventListener('click', () => {
        // Отслеживаем клик и переходим на страницу подтверждения
        trackEvent('click_confirm_portfolio'); 
        window.location.href = 'confirm-portfolio.html';
    });
}


function showPortfolioPopup(data) {
    document.getElementById('popup-title').textContent = `Портфель: ${data.title}`;
    const assets = getAssetsByStrategy(data.riskProfile);
    document.getElementById('popup-assets').innerHTML = assets.map(asset => `<div class="asset-item"><span class="asset-name">${asset.name}</span><span class="asset-percent">${asset.percent}%</span></div>`).join('');
    const ctx = document.getElementById('popup-chart').getContext('2d');
    if (popupChartInstance) popupChartInstance.destroy();
    const chartData = {
        labels: Array.from({ length: 6 }, (_, i) => i),
        datasets: [{ data: Array.from({ length: 6 }, (_, i) => 100000 * Math.pow(1.15, i)), borderColor: '#dc2626', tension: 0.1 }]
    };
    popupChartInstance = new Chart(ctx, { type: 'line', data: chartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
    document.getElementById('portfolio-popup').classList.add('active');
}

function initializeChart(investmentData) {
    const ctx = document.getElementById('performance-chart')?.getContext('2d');
    if (!ctx) return;

    if (portfolioChartInstance) portfolioChartInstance.destroy();

    portfolioChartInstance = new Chart(ctx, {
        type: 'line',
        data: {},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                 y: { beginAtZero: false, ticks: { callback: value => (value / 1000) + 'k ₽' } },
                 x: { title: { display: true, text: 'Годы' } }
            },
            plugins: { legend: { display: true, position: 'bottom', labels: { color: '#aaaaaa' } } }
        }
    });

    document.querySelectorAll('.chart-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.chart-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.dataset.mode;
            updateChart(mode, investmentData);
            trackEvent('switch_chart_mode', { mode });
        });
    });

    updateChart('future', investmentData);
}

function updateChart(mode, investmentData) {
    const chartData = generateChartData(mode, investmentData);
    if(portfolioChartInstance) {
        portfolioChartInstance.data = chartData.data;
        portfolioChartInstance.options.scales.x.title.text = chartData.xTitle;
        portfolioChartInstance.update();
    }
}

function generateChartData(mode, investmentData) {
    const { amount, term, riskProfile } = investmentData;
    const multipliers = {
        conservative: { min: 1.05, avg: 1.08, max: 1.12 },
        moderate: { min: 1.07, avg: 1.15, max: 1.22 },
        aggressive: { min: 1.10, avg: 1.25, max: 1.40 },
    };
    const risk = multipliers[riskProfile];

    if (mode === 'future') {
        const labels = Array.from({ length: term + 1 }, (_, i) => i);
        return {
            data: {
                labels,
                datasets: [
                    { label: 'Макс. доход', data: labels.map(y => amount * Math.pow(risk.max, y)), borderColor: '#28a745', tension: 0.1 },
                    { label: 'Сред. доход', data: labels.map(y => amount * Math.pow(risk.avg, y)), borderColor: '#f8f9fa', tension: 0.1 },
                    { label: 'Мин. доход', data: labels.map(y => amount * Math.pow(risk.min, y)), borderColor: '#dc2626', tension: 0.1 }
                ]
            }, xTitle: 'Годы (прогноз)'
        };
    } else {
        const historyYears = mode === '1y' ? 1 : 5;
        const historyLabels = Array.from({ length: historyYears + 1 }, (_, i) => `-${historyYears - i}г`).slice(0, -1);
        historyLabels.push('Сейчас');
        const futureLabels = Array.from({ length: term }, (_, i) => i + 1);
        
        const historicalData = Array.from({ length: historyYears + 1 }, (_, i) => amount / Math.pow(risk.avg, historyYears - i) * (1 + (Math.random() - 0.5) * 0.1) );
        historicalData[historyYears] = amount;

        const forecastYears = Array.from({ length: term + 1 }, (_, i) => i);

        const pad = (arr) => Array(historyYears).fill(null).concat(arr);
        
        return {
            data: {
                labels: historyLabels.concat(futureLabels),
                datasets: [
                    { data: historicalData.concat(Array(term).fill(null)), borderColor: '#f8f9fa', tension: 0.1, label: 'Ист. доход' },
                    { data: pad(forecastYears.map(y => amount * Math.pow(risk.max, y))), borderColor: '#28a745', tension: 0.1, borderDash: [5, 5], label: 'Макс. прогноз' },
                    { data: pad(forecastYears.map(y => amount * Math.pow(risk.avg, y))), borderColor: '#f8f9fa', tension: 0.1, borderDash: [5, 5], label: 'Сред. прогноз' },
                    { data: pad(forecastYears.map(y => amount * Math.pow(risk.min, y))), borderColor: '#dc2626', tension: 0.1, borderDash: [5, 5], label: 'Мин. прогноз' }
                ]
            }, xTitle: `История за ${historyYears} ${historyYears > 1 ? 'лет' : 'год'} и прогноз на ${term} лет`
        };
    }
}

