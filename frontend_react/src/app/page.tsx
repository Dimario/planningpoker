'use client'

import { useRouter } from 'next/navigation';
import { useState } from 'react';           // Импортируем хук для работы с состоянием в React

// Главная страница приложения Planning Poker
export default function Home() {
  // Состояние для хранения введённого ключа комнаты
  const [roomKey, setRoomKey] = useState('');
  // Состояние для отображения возможных ошибок
  const [error, setError] = useState(null);
  // Хук для маршрутизации (перехода на другую страницу)
  const router = useRouter();

  // Функция для обработки создания новой комнаты
  const handleCreateRoom = async () => {
    try {
      // Отправляем POST-запрос на эндпоинт создания комнаты на бэкенде
      const response = await fetch('http://localhost:8080/room/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      // Если запрос завершился неуспешно, генерируем ошибку
      if (!response.ok) {
        throw new Error('Не удалось создать комнату');
      }
      // Парсим ответ сервера (ожидаем JSON с ключом комнаты)
      const data = await response.json();
      // Перенаправляем пользователя на страницу комнаты, передавая ключ комнаты через URL
      router.push(`/room?roomKey=${data.roomKey}`);
    } catch (err) {
      // Если произошла ошибка, обновляем состояние error для отображения сообщения
      setError(err.message);
    }
  };

  // Функция для обработки присоединения к существующей комнате
  const handleJoinRoom = async (e) => {
    e.preventDefault(); // Предотвращаем перезагрузку страницы при отправке формы
    try {
      // Отправляем POST-запрос на эндпоинт проверки существования комнаты
      const response = await fetch('http://localhost:8080/room/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Передаём ключ комнаты, введённый пользователем
        body: JSON.stringify({ roomKey })
      });
      // Если сервер вернул ошибку, выбрасываем исключение
      if (!response.ok) {
        throw new Error('Комната не найдена');
      }
      // Если всё прошло успешно, перенаправляем пользователя на страницу комнаты
      router.push(`/room?roomKey=${roomKey}`);
    } catch (err) {
      // Обновляем состояние error для отображения сообщения об ошибке
      setError(err.message);
    }
  };

  // Возвращаем JSX разметку главной страницы
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1>Planning Poker</h1>
      {/* Если есть ошибка, отображаем её */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {/* Кнопка для создания комнаты */}
      <button onClick={handleCreateRoom} style={{ margin: '10px', padding: '10px 20px' }}>
        Создать комнату
      </button>
      {/* Форма для ввода ключа и присоединения к существующей комнате */}
      <form onSubmit={handleJoinRoom} style={{ margin: '10px' }}>
        <input
          type="text"
          placeholder="Введите ключ комнаты"
          value={roomKey}
          // Обновляем состояние при вводе текста
          onChange={(e) => setRoomKey(e.target.value)}
          style={{ padding: '10px', width: '200px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', marginLeft: '10px' }}>
          Присоединиться
        </button>
      </form>
    </div>
  );
}
