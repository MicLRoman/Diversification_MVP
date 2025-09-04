import { trackEvent } from './script.js';

// --- Глобальное состояние ---
let originalInvestmentData = null; // Исходные данные для сброса
let currentInvestmentData = null;  // Текущие, редактируемые данные
let portfolioChartInstance = null;
const tg = window.Telegram.WebApp;
let riskSliderInteracted = false; // Флаг для отслеживания первого взаимодействия со слайдером

// --- База данных активов для замены ---
const ASSET_DATABASE = {
    'Акции РФ': ['Сбербанк', 'Газпром', 'Лукойл', 'Яндекс', 'Роснефть'],
    'Облигации РФ': ['ОФЗ 26238', 'ОФЗ 26240', 'ОФЗ 26242', 'ОФЗ 26243'],
    'Акции США': ['Apple', 'Microsoft', 'Amazon', 'Google', 'NVIDIA'],
    'Золото': ['Золотой фонд', 'Физическое золото'],
    'Денежные средства': ['Рубли', 'Доллары'],
    'Криптовалюта': ['Bitcoin', 'Ethereum', 'Solana'],
    'Венчурные фонды': ['Фонд А', 'Фонд Б']
};


// --- Инициализация при загрузке страницы ---
document.addEventListener('DOMContentLoaded', () => {
    trackEvent('page_view_edit_portfolio');

    // Загружаем данные из localStorage
    const storedData = localStorage.getItem('investmentData');
    if (!storedData) {
        handleDataError();
        return;
    }

    originalInvestmentData = JSON.parse(storedData);
    // Глубокое копирование, чтобы изменения не влияли на оригинал
    currentInvestmentData = JSON.parse(JSON.stringify(originalInvestmentData)); 
    
    // Инициализация компонентов
    initializeUI();
    initializeChart();
    setupEventListeners();
    
    // Показываем обучалку при первом заходе
    if (!localStorage.getItem('hasSeenEditTutorial')) {
        showTutorial();
    }
});

// --- Функции инициализации ---

function initializeUI() {
    // Устанавливаем значения в карточке
    document.getElementById('portfolio-amount').textContent = currentInvestmentData.amount.toLocaleString('ru-RU');
    document.getElementById('portfolio-term').textContent = currentInvestmentData.term;
    
    // Устанавливаем значение слайдера и обновляем UI
    const riskValue = riskProfileToSliderValue(currentInvestmentData.riskProfile);
    document.getElementById('risk-slider').value = riskValue;

    // Генерируем активы и обновляем заголовок/лейбл
    regenerateAssets(); 
    updateRiskUI();
}

function initializeChart() {
    const ctx = document.getElementById('performance-chart')?.getContext('2d');
    if (!ctx) return;

    portfolioChartInstance = new Chart(ctx, {
        type: 'line',
        data: {},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: false, ticks: { callback: value => (value / 1000) + 'k ₽' }, grid: { color: 'rgba(255, 255, 255, 0.1)' }, },
                x: { title: { display: true, text: 'Годы (прогноз)' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
            },
            plugins: { legend: { display: false } }
        }
    });

    updateChart();
}


function setupEventListeners() {
    document.getElementById('risk-slider').addEventListener('input', handleRiskSliderChange);
    document.getElementById('reset-btn').addEventListener('click', handleReset);
    document.getElementById('save-btn').addEventListener('click', handleSave);

    // Закрытие обучалки
    document.getElementById('tutorial-popup').addEventListener('click', (e) => {
        if (e.target.id === 'tutorial-popup' || e.target.id === 'popup-close' || e.target.id === 'start-tutorial-btn') {
            hideTutorial();
        }
    });

    // Закрытие окна замены активов
    const replacePopup = document.getElementById('replace-asset-popup');
    replacePopup.addEventListener('click', (e) => {
        if (e.target === replacePopup || e.target.id === 'close-replace-popup') {
            replacePopup.classList.remove('active');
        }
    });
}

// --- Обработчики событий ---

function handleRiskSliderChange(event) {
    if (!riskSliderInteracted) {
        trackEvent('risk_slider_used');
        riskSliderInteracted = true; // Устанавливаем флаг после первого срабатывания
    }
    updateRiskUI();
    regenerateAssets();
    updateChart();
}

function handleReset() {
    trackEvent('click_reset_portfolio_edit');
    // Восстанавливаем изначальные данные
    currentInvestmentData = JSON.parse(JSON.stringify(originalInvestmentData));
    initializeUI();
    updateChart();
    tg.HapticFeedback.impactOccurred('light');
}

function handleSave() {
    trackEvent('click_save_portfolio_edit', currentInvestmentData);
    
    // Сохраняем измененные данные в localStorage
    localStorage.setItem('investmentData', JSON.stringify(currentInvestmentData));

    // Отправляем данные в ТГ-бота для сообщения
    tg.sendData(JSON.stringify(currentInvestmentData));

    // Возвращаемся на страницу просмотра портфеля
    tg.HapticFeedback.notificationOccurred('success');
    window.location.href = 'portfolio.html';
}

function handleReplaceAssetClick(assetIndex, assetCategory) {
    const popup = document.getElementById('replace-asset-popup');
    const optionsContainer = document.getElementById('replacement-options');
    const currentAssetName = currentInvestmentData.assets[assetIndex].name;

    document.getElementById('replace-popup-title').textContent = `Заменить "${currentAssetName}"`;
    optionsContainer.innerHTML = '';

    const availableAssets = ASSET_DATABASE[assetCategory] || [];
    
    availableAssets.forEach(newName => {
        const button = document.createElement('button');
        button.textContent = newName;
        button.className = 'replacement-option-btn';
        if (newName === currentAssetName) {
            button.classList.add('current');
            button.disabled = true;
        } else {
            button.onclick = () => {
                // Обновляем имя в стейте
                currentInvestmentData.assets[assetIndex].name = newName;
                trackEvent('asset_replaced', { from: currentAssetName, to: newName });
                // Перерисовываем список активов
                renderAssets();
                // Закрываем попап
                popup.classList.remove('active');
                tg.HapticFeedback.impactOccurred('light');
            };
        }
        optionsContainer.appendChild(button);
    });

    popup.classList.add('active');
}


// --- Логика обновления UI ---

function updateRiskUI() {
    const sliderValue = document.getElementById('risk-slider').value;
    const { riskProfile, label } = sliderValueToRiskProfile(sliderValue);
    
    currentInvestmentData.riskProfile = riskProfile;
    document.getElementById('risk-level-label').textContent = label;
    document.getElementById('portfolio-strategy-title').textContent = `${label} портфель`;
}

function renderAssets() {
    const assetsListContainer = document.getElementById('assets-list');
    assetsListContainer.innerHTML = ''; // Очищаем список

    currentInvestmentData.assets.forEach((asset, index) => {
        const assetDiv = document.createElement('div');
        assetDiv.className = 'asset-item';
        assetDiv.innerHTML = `
            <div class="asset-info">
                <span class="asset-name">${asset.name}</span>
                <span class="asset-percent">${asset.percent}%</span>
            </div>
            <button class="replace-btn" data-index="${index}" data-category="${asset.category}">Заменить</button>
        `;
        assetsListContainer.appendChild(assetDiv);
    });

    // Добавляем обработчики на новые кнопки
    document.querySelectorAll('.replace-btn').forEach(button => {
        button.addEventListener('click', () => {
            handleReplaceAssetClick(parseInt(button.dataset.index), button.dataset.category);
        });
    });
}

// --- Логика генерации данных ---

function regenerateAssets() {
    const assetsConfig = getAssetsByStrategy(currentInvestmentData.riskProfile);
    
    currentInvestmentData.assets = assetsConfig.map(assetConfig => {
        // Пытаемся сохранить текущий выбранный актив, если он есть в новой категории
        const existingAsset = (currentInvestmentData.assets || []).find(a => a.category === assetConfig.category);
        const name = existingAsset ? existingAsset.name : (ASSET_DATABASE[assetConfig.category] || ['N/A'])[0];
        
        return {
            name: name,
            percent: assetConfig.percent,
            category: assetConfig.category
        };
    });
    
    renderAssets();
}


function getAssetsByStrategy(riskProfile) {
    // В отличие от portfolio.js, здесь мы также храним 'category'
    switch (riskProfile) {
        case 'conservative': return [
            { category: 'Облигации РФ', percent: 60 }, 
            { category: 'Акции РФ', percent: 20 }, 
            { category: 'Золото', percent: 15 }, 
            { category: 'Денежные средства', percent: 5 }
        ];
        case 'aggressive': return [
            { category: 'Акции РФ', percent: 50 }, 
            { category: 'Акции США', percent: 30 }, 
            { category: 'Криптовалюта', percent: 15 }, 
            { category: 'Венчурные фонды', percent: 5 }
        ];
        default: return [ // moderate
            { category: 'Акции РФ', percent: 40 }, 
            { category: 'Облигации РФ', percent: 35 }, 
            { category: 'Акции США', percent: 20 }, 
            { category: 'Золото', percent: 5 }
        ];
    }
}


// --- Логика графика ---

function updateChart() {
    if (!portfolioChartInstance) return;

    const chartData = generateChartData();
    portfolioChartInstance.data = chartData;
    portfolioChartInstance.update();
}

function generateChartData() {
    const { amount, term, riskProfile } = currentInvestmentData;
    const multipliers = {
        conservative: { min: 1.05, avg: 1.08, max: 1.12 },
        moderate: { min: 1.07, avg: 1.15, max: 1.22 },
        aggressive: { min: 1.10, avg: 1.25, max: 1.40 },
    };
    const risk = multipliers[riskProfile];
    const labels = Array.from({ length: term + 1 }, (_, i) => i);

    return {
        labels,
        datasets: [
            { label: 'Макс. доход', data: labels.map(y => amount * Math.pow(risk.max, y)), borderColor: '#28a745', tension: 0.2, fill: false },
            { label: 'Сред. доход', data: labels.map(y => amount * Math.pow(risk.avg, y)), borderColor: '#f8f9fa', tension: 0.2, fill: false },
            { label: 'Мин. доход', data: labels.map(y => amount * Math.pow(risk.min, y)), borderColor: '#dc2626', tension: 0.2, fill: false }
        ]
    };
}


// --- Вспомогательные функции ---

function handleDataError() {
    document.body.innerHTML = '<div class="container" style="text-align: center;"><h1>Ошибка</h1><p>Данные о портфеле не найдены. Пожалуйста, соберите портфель заново.</p><a href="index.html" class="btn btn-main">На главную</a></div>';
}

function riskProfileToSliderValue(profile) {
    if (profile === 'conservative') return 15;
    if (profile === 'aggressive') return 85;
    return 50; // moderate
}

function sliderValueToRiskProfile(value) {
    if (value <= 33) return { riskProfile: 'conservative', label: 'Консервативный' };
    if (value >= 67) return { riskProfile: 'aggressive', label: 'Агрессивный' };
    return { riskProfile: 'moderate', label: 'Умеренный' };
}

function showTutorial() {
    document.getElementById('tutorial-popup').classList.add('active');
    // Добавляем подсветку для элементов
    document.getElementById('risk-slider-section').classList.add('highlight');
    document.getElementById('portfolio-details').classList.add('highlight');
}

function hideTutorial() {
    document.getElementById('tutorial-popup').classList.remove('active');
    // Убираем подсветку
    document.getElementById('risk-slider-section').classList.remove('highlight');
    document.getElementById('portfolio-details').classList.remove('highlight');
    localStorage.setItem('hasSeenEditTutorial', 'true');
}

