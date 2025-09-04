import { trackEvent } from './script.js';

// Ждем, пока вся страница загрузится
document.addEventListener('DOMContentLoaded', () => {
    // Находим наши кнопки по ID
    const autoSelectionBtn = document.getElementById('auto-selection-btn');
    const demoPortfolioBtn = document.getElementById('demo-portfolio-btn');

    // Добавляем обработчик клика для кнопки "Автоподбор"
    if (autoSelectionBtn) {
        autoSelectionBtn.addEventListener('click', () => {
            // Отслеживаем событие
            trackEvent('click_auto_selection');
            // Переходим на страницу автоподбора
            window.location.href = 'auto-selection.html';
        });
    }

    // Добавляем обработчик клика для кнопки "Демопортфель"
    if (demoPortfolioBtn) {
        demoPortfolioBtn.addEventListener('click', () => {
            // Отслеживаем событие
            trackEvent('click_demo_portfolio');
            // Открываем внешнюю ссылку через API Telegram
            Telegram.WebApp.openLink('https://v0-investment-constructor-ui.vercel.app/');
        });
    }
});
