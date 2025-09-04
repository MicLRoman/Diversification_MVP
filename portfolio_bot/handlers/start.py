from telebot import TeleBot
# Исправленные абсолютные импорты
from portfolio_bot.keyboards.inline import create_main_menu_keyboard
from portfolio_bot.handlers.messages import MESSAGES

def register_start_handler(bot: TeleBot):
    @bot.message_handler(commands=['start'])
    def send_welcome(message):
        welcome_text = MESSAGES['welcome'].format(name=message.from_user.first_name)
        keyboard = create_main_menu_keyboard()
        bot.send_message(
            message.chat.id,
            text=welcome_text,
            reply_markup=keyboard,
            parse_mode='html'
        )

    @bot.callback_query_handler(func=lambda call: call.data == "back_to_main_menu")
    def back_to_main_menu_handler(call):
        welcome_text = MESSAGES['welcome'].format(name=call.from_user.first_name)
        keyboard = create_main_menu_keyboard()
        bot.edit_message_text(
            chat_id=call.message.chat.id,
            message_id=call.message.message_id,
            text=welcome_text,
            reply_markup=keyboard,
            parse_mode='html'
        )

