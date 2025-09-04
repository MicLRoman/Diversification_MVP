import { trackEvent } from './script.js';

// --- Глобальные переменные и состояние ---
let currentStep = 1;
const investmentData = {
    amount: 50000,
    term: 5,
    riskProfile: 'moderate',
};
let chartInstance = null; // Для хранения экземпляра графика

// --- DOM-элементы ---
const backBtn = document.getElementById('back-btn');
const confirmAmountBtn = document.getElementById('confirm-amount-btn');
const confirmTermBtn = document.getElementById('confirm-term-btn');
const unknownTermBtn = document.getElementById('unknown-term-btn');
const confirmRiskBtn = document.getElementById('confirm-risk-btn');

const amountInput = document.getElementById('amount');
const termSlider = document.getElementById('term');
const termValueSpan = document.getElementById('term-value');
const riskButtons = document.querySelectorAll('.risk-btn');

const steps = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3'),
];

const chartCanvas = document.getElementById('investment-chart');
const chartLegend = document.getElementById('chart-legend');

// --- Инициализация при загрузке ---
document.addEventListener('DOMContentLoaded', () => {
    trackEvent('page_view_auto_selection');

    if (confirmAmountBtn) confirmAmountBtn.addEventListener('click', handleConfirmAmount);
    if (confirmTermBtn) confirmTermBtn.addEventListener('click', handleConfirmTerm);
    if (unknownTermBtn) unknownTermBtn.addEventListener('click', handleUnknownTerm);
    if (confirmRiskBtn) confirmRiskBtn.addEventListener('click', handleConfirmRisk);
    if (backBtn) backBtn.addEventListener('click', handleGoBack);
    if (termSlider) termSlider.addEventListener('input', handleTermChange);

    riskButtons.forEach(button => {
        button.addEventListener('click', () => handleRiskSelect(button.dataset.risk));
    });

    initializeChart();
});

// --- Обработчики событий ---

function handleConfirmAmount() {
    const amountValue = parseInt(amountInput.value, 10);

    if (isNaN(amountValue) || amountValue < 1000) {
        Telegram.WebApp.showAlert('Пожалуйста, введите сумму не менее 1000 ₽.');
        return;
    }

    investmentData.amount = amountValue;
    trackEvent('confirm_amount', { amount: investmentData.amount });

    currentStep = 2;
    updateStepVisibility();
    updateChart();
}

function handleTermChange() {
    const term = termSlider.value;
    investmentData.term = parseInt(term, 10);
    if (termValueSpan) termValueSpan.textContent = term;
    updateChart();
}

function handleConfirmTerm() {
    trackEvent('confirm_term', { term: investmentData.term });
    currentStep = 3;
    updateStepVisibility();
    updateChart();
}

function handleUnknownTerm() {
    investmentData.term = 5;
    termSlider.value = 5;
    if (termValueSpan) termValueSpan.textContent = '5';
    trackEvent('confirm_term_unknown');
    
    currentStep = 3;
    updateStepVisibility();
    updateChart();
}

function handleRiskSelect(risk) {
    investmentData.riskProfile = risk;
    riskButtons.forEach(button => {
        button.classList.toggle('selected', button.dataset.risk === risk);
    });
    trackEvent('select_risk', { risk: investmentData.riskProfile });
    updateChart();
}

function handleConfirmRisk() {
    trackEvent('confirm_risk_and_build');
    
    localStorage.setItem('investmentData', JSON.stringify(investmentData));
    window.location.href = 'loading.html';
}


function handleGoBack() {
    if (currentStep > 1) {
        currentStep--;
        updateStepVisibility();
        updateChart();
        trackEvent('click_back_in_funnel', { from_step: currentStep + 1 });
    }
}

// --- Управление UI ---

function updateStepVisibility() {
    steps.forEach((step, index) => {
        if (step) step.classList.toggle('active', index + 1 === currentStep);
    });
    if (backBtn) backBtn.disabled = currentStep === 1;
}

// --- Логика графика с Chart.js ---

function initializeChart() {
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
        Chart.defaults.color = '#aaaaaa';
        Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
        
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,
                animation: { duration: 400, easing: 'easeInOutQuad' },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: value => (value / 1000) + 'k ₽'
                        }
                    },
                    x: {
                        title: { display: true, text: 'Годы' }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
        updateChart();
    };
    document.head.appendChild(script);
}

function updateChart() {
    if (!chartInstance) return;

    let datasets = [];
    let labels = Array.from({ length: 11 }, (_, i) => i);
    
    const multipliers = {
        conservative: { min: 1.05, avg: 1.08, max: 1.12 },
        moderate: { min: 1.07, avg: 1.15, max: 1.22 },
        aggressive: { min: 1.10, avg: 1.25, max: 1.40 },
    };

    if (currentStep < 3) {
        if(chartLegend) chartLegend.classList.remove('visible');
        datasets.push({
            label: 'Сумма',
            data: Array(11).fill(investmentData.amount),
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: 2,
            pointRadius: 0
        });
        delete chartInstance.options.scales.y.max;
        chartInstance.options.scales.x.max = (currentStep === 1) ? 10 : investmentData.term;
    } else {
        if(chartLegend) chartLegend.classList.add('visible');
        const yMaxAggressive = investmentData.amount * Math.pow(multipliers.aggressive.max, investmentData.term);
        chartInstance.options.scales.y.max = Math.ceil(yMaxAggressive * 1.1);

        const riskProfile = multipliers[investmentData.riskProfile];
        const forecastData = { max: [], avg: [], min: [] };
        
        labels = Array.from({ length: investmentData.term + 1 }, (_, i) => i);
        for (let year = 0; year <= investmentData.term; year++) {
            forecastData.max.push(investmentData.amount * Math.pow(riskProfile.max, year));
            forecastData.avg.push(investmentData.amount * Math.pow(riskProfile.avg, year));
            forecastData.min.push(investmentData.amount * Math.pow(riskProfile.min, year));
        }

        datasets = [
            { label: 'Макс. доход', data: forecastData.max, borderColor: '#28a745', tension: 0.1, fill: false },
            { label: 'Сред. доход', data: forecastData.avg, borderColor: '#f8f9fa', tension: 0.1, fill: false },
            { label: 'Мин. доход', data: forecastData.min, borderColor: '#dc3545', tension: 0.1, fill: false }
        ];
        
        chartInstance.options.scales.x.max = investmentData.term;
    }

    chartInstance.data.labels = labels;
    chartInstance.data.datasets = datasets;
    chartInstance.update();
}
