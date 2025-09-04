# portfolio_bot/data/database.py
import sqlite3
import os

# Определяем путь к папке для данных
DATA_DIR = "data"
# Определяем полный путь к файлу базы данных
DB_PATH = os.path.join(DATA_DIR, "portfolio_bot.db")

def init_db():
    """Инициализирует базу данных и создает таблицы, если их нет."""
    # Создаем папку data, если она не существует
    os.makedirs(DATA_DIR, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        # Создаем таблицу пользователей
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY
            )
        ''')
        # Можно добавить другие таблицы, например, для портфелей
        # cursor.execute(...)
        conn.commit()

def add_user_if_not_exists(user_id: int):
    """Добавляет нового пользователя в БД, если его там еще нет."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,))
        if cursor.fetchone() is None:
            cursor.execute("INSERT INTO users (user_id) VALUES (?)", (user_id,))
            conn.commit()
            print(f"Новый пользователь добавлен: {user_id}")

def get_users_count() -> int:
    """Возвращает общее количество пользователей в БД."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(user_id) FROM users")
        count = cursor.fetchone()[0]
        return count

