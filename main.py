# -*- coding: utf-8 -*-
# Этот файл должен находиться в КОРНЕВОЙ папке проекта

import telebot
import firebase_admin
from firebase_admin import credentials, firestore
import json

# Теперь импортируем все из нашего пакета portfolio_bot
from portfolio_bot import config
from portfolio_bot.handlers.start import register_start_handler
from portfolio_bot.handlers.about import register_about_handler
from portfolio_bot.handlers.admin import register_admin_handlers

# --- Инициализация Firebase Admin SDK ---
db = None
try:
    cred = credentials.Certificate(config.FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase Admin SDK успешно инициализирован.")
except Exception as e:
    print(f"⚠️ Ошибка инициализации Firebase: {e}")
    print("-> Админские функции (например, /get_stats) будут недоступны.")

# --- Инициализация бота ---
bot = telebot.TeleBot(config.BOT_TOKEN)
print("Бот инициализирован...")

# --- Обработчик данных, полученных из Mini App ---
@bot.message_handler(content_types=['web_app_data'])
def handle_web_app_data(message):
    try:
        data_str = message.web_app_data.data
        print(f"Получены данные из Web App: {data_str}")
        portfolio_data = json.loads(data_str)

        strategy_map = {
            'conservative': 'Консервативная',
            'moderate': 'Умеренная',
            'aggressive': 'Агрессивная'
        }
        strategy_name = strategy_map.get(portfolio_data.get('riskProfile'), 'Не указана')
        
        amount = portfolio_data.get('amount', 0)
        term = portfolio_data.get('term', 'N/A')
        formatted_amount = f"{amount:,}".replace(',', ' ')

        response_text = (
            f"✅ *Ваш демо-портфель успешно сформирован!*\n\n"
            f"Сумма: *{formatted_amount} ₽*\n"
            f"Срок: *{term} лет*\n"
            f"Стратегия: *{strategy_name}*"
        )
        bot.send_message(message.chat.id, response_text, parse_mode='Markdown')
    except Exception as e:
        print(f"Ошибка обработки данных из Web App: {e}")
        bot.send_message(message.chat.id, "Произошла ошибка при обработке данных вашего портфеля.")

# --- Регистрация всех обработчиков ---
register_start_handler(bot)
register_about_handler(bot)
register_admin_handlers(bot, db, config.APP_ID, config.ADMIN_IDS)
print("Обработчики команд зарегистрированы.")

# --- Запуск бота ---
if __name__ == '__main__':
    print("Бот запущен и готов к работе!")
    # Запускать нужно именно этот файл: python main.py
    bot.polling(non_stop=True)
