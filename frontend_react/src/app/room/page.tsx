"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function Room() {
  const searchParams = useSearchParams();
  const roomKey = searchParams.get("roomKey");
  const router = useRouter();

  const [socket, setSocket] = useState(null);
  const [userName, setUserName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [selectedVote, setSelectedVote] = useState(""); // Локально выбранная карта
  const [selfId, setSelfId] = useState("");

  // Состояние комнаты, полученное от сервера.
  const [roomState, setRoomState] = useState({
    leader: "",
    leaderId: "",
    voteStarted: false,
    voteFinished: false,
    cards: [],
    participants: [], // Каждый объект: { id, name, voted, vote }
  });

  // При загрузке пытаемся получить сохранённое имя из localStorage.
  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName && storedName.trim() !== "") {
      setUserName(storedName);
      setNameSubmitted(true);
    }
  }, []);

  useEffect(() => {
    if (!roomKey || !nameSubmitted) return;

    const ws = new WebSocket(
      `ws://localhost:8080/ws?roomKey=${roomKey}&username=${userName}`
    );
    setSocket(ws);

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "init") {
          // Сохраняем свой уникальный идентификатор, полученный от сервера.
          setSelfId(data.selfId);
          return;
        }
        if (data.type === "state") {
          setRoomState({
            leader: data.leader,
            leaderId: data.leaderId,
            voteStarted: data.voteStarted,
            voteFinished: data.voteFinished,
            cards: data.cards,
            participants: data.participants,
          });
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      // Здесь можно добавить логику авто-подключения.
    };

    return () => {
      ws.close();
    };
  }, [roomKey, nameSubmitted, userName]);

  // Отправка команды на сервер.
  const sendCommand = (command, value = "") => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ command, value }));
    }
  };

  // Обработка отправки имени пользователя.
  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (userName.trim() !== "") {
      localStorage.setItem("userName", userName);
      setNameSubmitted(true);
    }
  };

  // Обработка клика по карте.
  const handleCardClick = (card) => {
    setSelectedVote(card);
    sendCommand("vote", card);
  };

  // Если голосование завершено, вычисляем среднюю оценку среди участников (без учета ведущего).
  let averageVote = null;
  if (roomState.voteFinished) {
    const nonLeaderVotes = roomState.participants.filter(
      (p) =>
        p.id !== roomState.leaderId &&
        p.vote &&
        !isNaN(Number(p.vote))
    );
    const total = nonLeaderVotes.reduce(
      (sum, p) => sum + Number(p.vote),
      0
    );
    averageVote =
      nonLeaderVotes.length > 0
        ? (total / nonLeaderVotes.length).toFixed(2)
        : "0";
  }

  if (!nameSubmitted) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Комната: {roomKey}</h1>
        <form onSubmit={handleNameSubmit}>
          <input
            type="text"
            placeholder="Введите ваше имя"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{ padding: "10px", width: "300px" }}
          />
          <button type="submit" style={{ padding: "10px 20px", marginLeft: "10px" }}>
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Комната: {roomKey}</h1>
      <h2>
        Вы: {userName}{" "}
        {selfId && (
          <span style={{ fontSize: "0.8em", color: "#888" }}>
            ({selfId})
          </span>
        )}
      </h2>
      <h3>
        Ведущий: {roomState.leader ? roomState.leader : "Отсутствует"}
      </h3>

      {/* Отображаем список участников – ведущего исключаем из результатов голосования */}
      <div style={{ marginBottom: "20px" }}>
        <strong>Участники:</strong>
        <ul>
          {roomState.participants.map((p) => (
            <li key={p.id}>
              {p.id === selfId ? `${p.name} (You)` : p.name}{" "}
              {!roomState.voteFinished && p.voted && p.id !== roomState.leaderId && " (голосовал)"}
              {roomState.voteFinished && p.id !== roomState.leaderId && `: ${p.vote}`}
            </li>
          ))}
        </ul>
      </div>

      {/* Рендерим интерфейс в зависимости от статуса голосования */}
      {!roomState.voteStarted ? (
        <div>
          <p>Ожидание начала голосования...</p>
          {roomState.leader === "" && (
            <button
              onClick={() => sendCommand("becomeLeader")}
              style={{ padding: "10px 20px", marginRight: "10px" }}
            >
              Стать ведущим
            </button>
          )}
          {roomState.leader === userName && (
            <>
              <button
                onClick={() => sendCommand("startVote")}
                style={{ padding: "10px 20px", marginRight: "10px" }}
              >
                Начать голосование
              </button>
              <button
                onClick={() => sendCommand("leaveLeader")}
                style={{ padding: "10px 20px" }}
              >
                Покинуть роль ведущего
              </button>
            </>
          )}
        </div>
      ) : roomState.voteStarted && !roomState.voteFinished ? (
        <div>
          <p>Голосование идет...</p>
          {roomState.leader === userName ? (
            // Для ведущего – кнопка завершения голосования.
            <button
              onClick={() => sendCommand("finishVote")}
              style={{ padding: "10px 20px" }}
            >
              Завершить голосование
            </button>
          ) : (
            // Для участников – набор карт для выбора.
            <div style={{ display: "flex", gap: "10px" }}>
              {roomState.cards.map((card) => (
                <div
                  key={card}
                  onClick={() => handleCardClick(card)}
                  style={{
                    border: "1px solid #ccc",
                    padding: "20px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedVote === card ? "#c8e6c9" : "transparent",
                  }}
                >
                  {card}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h3>Голосование завершено!</h3>
          <p>Результаты:</p>
          <ul>
            {roomState.participants.map((p) => {
              if (p.id === roomState.leaderId) return null;
              return (
                <li key={p.id}>
                  {p.id === selfId ? `${p.name} (You)` : p.name}: {p.vote}
                </li>
              );
            })}
          </ul>
          {averageVote !== null && (
            <p>
              Средняя оценка: <strong>{averageVote}</strong>
            </p>
          )}
          {roomState.leader === userName && (
            <button
              onClick={() => sendCommand("restartVote")}
              style={{ padding: "10px 20px", marginTop: "10px" }}
            >
              Начать голосование заново
            </button>
          )}
        </div>
      )}
    </div>
  );
}
