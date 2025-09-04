import { trackEvent } from './script.js';

document.addEventListener('DOMContentLoaded', () => {
    trackEvent('page_view_confirm_portfolio');

    const investmentData = JSON.parse(localStorage.getItem('investmentData'));
    if (!investmentData) {
        document.querySelector('.main-content').innerHTML = '<h1>Данные о портфеле не найдены.</h1><p>Пожалуйста, вернитесь и соберите портфель заново.</p><a href="index.html" class="btn btn-main">На главную</a>';
        return;
    }

    // Расчет и отображение доходности
    const multipliers = {
        conservative: { min: 1.05, avg: 1.08, max: 1.12 },
        moderate: { min: 1.07, avg: 1.15, max: 1.22 },
        aggressive: { min: 1.10, avg: 1.25, max: 1.40 },
    };
    const risk = multipliers[investmentData.riskProfile];
    const term = investmentData.term;
    const amount = investmentData.amount;

    const maxTotal = amount * Math.pow(risk.max, term);
    const avgTotal = amount * Math.pow(risk.avg, term);
    const minTotal = amount * Math.pow(risk.min, term);

    document.getElementById('final-max-profit').textContent = `+${(maxTotal - amount).toLocaleString('ru-RU')} ₽`;
    document.getElementById('final-avg-profit').textContent = `+${(avgTotal - amount).toLocaleString('ru-RU')} ₽`;
    document.getElementById('final-min-profit').textContent = `+${(minTotal - amount).toLocaleString('ru-RU')} ₽`;

    // Обработчик финальной кнопки
    const convertBtn = document.getElementById('convert-to-real-btn');
    const hedgeCheckbox = document.getElementById('hedge-risk-checkbox');
    if (convertBtn && hedgeCheckbox) {
        convertBtn.addEventListener('click', () => {
            
            // === ИЗМЕНЕНИЕ: Получаем данные опроса из localStorage ===
            const surveyData = JSON.parse(localStorage.getItem('surveyData')) || {};

            // Отправляем полное событие конверсии
            trackEvent('click_convert_to_real', {
                // Основные данные портфеля
                hedge_risk_selected: hedgeCheckbox.checked,
                amount: investmentData.amount,
                term: investmentData.term,
                riskProfile: investmentData.riskProfile,
                // Данные опроса
                user_age: surveyData.age,
                user_experience: surveyData.experience,
                user_activities: surveyData.activities
            });

            // Очищаем данные, чтобы не мешать следующей сессии
            localStorage.removeItem('surveyData');
            
            window.location.href = 'final.html';
        });
    }
});

