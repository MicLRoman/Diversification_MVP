import { trackEvent } from './script.js';

document.addEventListener('DOMContentLoaded', () => {
    trackEvent('page_view_loading');

    const submitBtn = document.getElementById('submit-survey-btn');

    // --- Анимация спиннера (прогресс-бар убран) ---
    // (Здесь может быть логика, если нужно что-то подгружать с сервера)

    // --- Обработка отправки опроса ---
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmitSurvey);
    }
});

function handleSubmitSurvey() {
    // Собираем данные из формы
    const age = document.querySelector('input[name="age"]:checked');
    const experience = document.querySelector('input[name="experience"]:checked');
    const activities = document.querySelectorAll('input[name="activity"]:checked');

    // Проверяем, что все вопросы отвечены
    if (!age || !experience || activities.length === 0) {
        Telegram.WebApp.showAlert('Пожалуйста, ответьте на все вопросы, чтобы мы могли точнее подобрать портфель.');
        return;
    }

    const surveyData = {
        age: age.value,
        experience: experience.value,
        activities: Array.from(activities).map(cb => cb.value)
    };

    // Отправляем событие с данными опроса в Firebase
    trackEvent('submit_survey', surveyData);
    
    // Сохраняем данные опроса в localStorage
    localStorage.setItem('surveyData', JSON.stringify(surveyData));

    // Переходим на итоговую страницу портфеля
    window.location.href = 'portfolio.html';
}

