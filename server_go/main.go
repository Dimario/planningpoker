// main.go

package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

// Глобальная переменная hub, доступная во всём файле.
var hub *Hub

// Работа с базой данных (таблица rooms)
var db *sql.DB

type CreateRoomResponse struct {
	RoomKey string `json:"roomKey"`
}

type JoinRoomRequest struct {
	RoomKey string `json:"roomKey"`
}

// RoomState хранит состояние комнаты.
type RoomState struct {
	Leader       string            `json:"leader"`       // Имя ведущего (если назначен)
	LeaderId     string            `json:"leaderId"`     // Уникальный ID ведущего
	VoteStarted  bool              `json:"voteStarted"`  // Голосование запущено
	VoteFinished bool              `json:"voteFinished"` // Голосование завершено
	Cards        []string          `json:"cards"`        // Набор карт (например, ["1", "2", "3", "5", "8", "13", "21"])
	Votes        map[string]string `json:"votes"`        // Голос каждого участника (ключ – имя)
}

// ParticipantInfo передаётся клиентам и содержит информацию об участнике.
type ParticipantInfo struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Voted bool   `json:"voted"`          // true, если участник уже проголосовал
	Vote  string `json:"vote,omitempty"` // Если голосование завершено, показываем значение
}

// Client представляет WebSocket-соединение от пользователя.
type Client struct {
	hub     *Hub
	conn    *websocket.Conn
	send    chan []byte
	roomKey string
	name    string
	id      string // Уникальный идентификатор клиента
}

// Hub управляет подключениями и состоянием комнат.
type Hub struct {
	rooms      map[string]map[*Client]bool // Клиенты по комнатам
	roomStates map[string]*RoomState         // Состояние каждой комнаты
	register   chan *Client                  // Канал регистрации нового клиента
	unregister chan *Client                  // Канал отключения клиента
	mu         sync.Mutex                    // Мьютекс для защиты общего состояния
}

// newHub инициализирует новый Hub.
func newHub() *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		roomStates: make(map[string]*RoomState),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// generateClientID генерирует уникальный идентификатор для клиента.
func generateClientID() string {
	letters := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	length := 8
	id := make([]rune, length)
	for i := range id {
		id[i] = letters[rand.Intn(len(letters))]
	}
	return string(id)
}

// broadcastState рассылает текущее состояние комнаты всем клиентам.
func (h *Hub) broadcastState(roomKey string) {
	h.mu.Lock()
	state, exists := h.roomStates[roomKey]
	if !exists {
		state = &RoomState{
			Leader:       "",
			LeaderId:     "",
			VoteStarted:  false,
			VoteFinished: false,
			Cards:        []string{},
			Votes:        make(map[string]string),
		}
		h.roomStates[roomKey] = state
	}
	// Собираем информацию об участниках.
	participants := []ParticipantInfo{}
	clients := h.rooms[roomKey]
	for client := range clients {
		info := ParticipantInfo{
			ID:   client.id,
			Name: client.name,
		}
		if state.Votes != nil {
			if vote, ok := state.Votes[client.name]; ok && vote != "" {
				info.Voted = true
				if state.VoteFinished {
					info.Vote = vote
				}
			}
		}
		participants = append(participants, info)
	}
	// Формируем JSON-сообщение о состоянии комнаты.
	message, err := json.Marshal(map[string]interface{}{
		"type":         "state",
		"leader":       state.Leader,
		"leaderId":     state.LeaderId,
		"voteStarted":  state.VoteStarted,
		"voteFinished": state.VoteFinished,
		"cards":        state.Cards,
		"participants": participants,
	})
	h.mu.Unlock()
	if err != nil {
		log.Println("Error marshaling state:", err)
		return
	}
	for client := range clients {
		select {
		case client.send <- message:
		default:
			close(client.send)
			h.mu.Lock()
			delete(h.rooms[roomKey], client)
			h.mu.Unlock()
		}
	}
}

// run обрабатывает регистрацию и отключение клиентов.
func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.rooms[client.roomKey] == nil {
				h.rooms[client.roomKey] = make(map[*Client]bool)
			}
			h.rooms[client.roomKey][client] = true
			if h.roomStates[client.roomKey] == nil {
				h.roomStates[client.roomKey] = &RoomState{
					Leader:       "",
					LeaderId:     "",
					VoteStarted:  false,
					VoteFinished: false,
					Cards:        []string{},
					Votes:        make(map[string]string),
				}
			}
			h.mu.Unlock()
			log.Printf("Client '%s' (id=%s) connected to room %s", client.name, client.id, client.roomKey)
			h.broadcastState(client.roomKey)
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.rooms[client.roomKey][client]; ok {
				delete(h.rooms[client.roomKey], client)
				close(client.send)
				log.Printf("Client '%s' (id=%s) disconnected from room %s", client.name, client.id, client.roomKey)
				// Если отключился ведущий, сбрасываем голосование.
				if state, exists := h.roomStates[client.roomKey]; exists {
					if state.Leader == client.name {
						state.Leader = ""
						state.LeaderId = ""
						state.VoteStarted = false
						state.VoteFinished = false
						state.Cards = []string{}
						state.Votes = make(map[string]string)
					}
				}
			}
			h.mu.Unlock()
			h.broadcastState(client.roomKey)
		}
	}
}

// ClientMessage представляет команду от клиента.
type ClientMessage struct {
	Command string `json:"command"`
	Value   string `json:"value,omitempty"` // Используется для команды "vote"
}

// readPump читает сообщения от клиента.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		var cmd ClientMessage
		if err := json.Unmarshal(message, &cmd); err == nil {
			c.handleCommand(cmd)
		}
	}
}

// handleCommand обрабатывает команду от клиента.
func (c *Client) handleCommand(cmd ClientMessage) {
	c.hub.mu.Lock()
	state := c.hub.roomStates[c.roomKey]
	switch cmd.Command {
	case "becomeLeader":
		if state.Leader == "" {
			state.Leader = c.name
			state.LeaderId = c.id
			log.Printf("Client '%s' (id=%s) became leader in room %s", c.name, c.id, c.roomKey)
		}
	case "leaveLeader":
		if state.Leader == c.name {
			state.Leader = ""
			state.LeaderId = ""
			log.Printf("Client '%s' (id=%s) left leadership in room %s", c.name, c.id, c.roomKey)
		}
	case "startVote":
		if state.Leader == c.name && !state.VoteStarted {
			state.VoteStarted = true
			state.VoteFinished = false
			state.Cards = []string{"1", "2", "3", "5", "8", "13", "21"}
			state.Votes = make(map[string]string)
			log.Printf("Voting started by leader '%s' (id=%s) in room %s", c.name, c.id, c.roomKey)
		}
	case "vote":
		if state.VoteStarted && !state.VoteFinished {
			if state.Votes == nil {
				state.Votes = make(map[string]string)
			}
			state.Votes[c.name] = cmd.Value
			log.Printf("Client '%s' (id=%s) voted with %s in room %s", c.name, c.id, cmd.Value, c.roomKey)
		}
	case "finishVote":
		if state.Leader == c.name && state.VoteStarted && !state.VoteFinished {
			state.VoteFinished = true
			log.Printf("Voting finished in room %s by leader '%s' (id=%s)", c.roomKey, c.name, c.id)
		}
	case "restartVote":
		// Новая команда для перезапуска голосования после завершения.
		if state.Leader == c.name && state.VoteFinished {
			state.VoteStarted = true
			state.VoteFinished = false
			state.Votes = make(map[string]string)
			state.Cards = []string{"1", "2", "3", "5", "8", "13", "21"}
			log.Printf("Voting restarted by leader '%s' (id=%s) in room %s", c.name, c.id, c.roomKey)
		}
	default:
		log.Printf("Unknown command from client '%s' (id=%s): %s", c.name, c.id, cmd.Command)
	}
	c.hub.mu.Unlock()
	c.hub.broadcastState(c.roomKey)
}

// writePump отправляет сообщения клиенту.
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// upgrader обновляет HTTP-соединение до WebSocket.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// handleWebsocket обрабатывает входящие WebSocket-соединения.
// Ожидаются параметры roomKey и username.
func handleWebsocket(w http.ResponseWriter, r *http.Request) {
	roomKey := r.URL.Query().Get("roomKey")
	if roomKey == "" {
		http.Error(w, "roomKey parameter is required", http.StatusBadRequest)
		return
	}
	userName := r.URL.Query().Get("username")
	if userName == "" {
		http.Error(w, "username parameter is required", http.StatusBadRequest)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	// Создаем клиента с уникальным идентификатором.
	client := &Client{
		hub:     hub,
		conn:    conn,
		send:    make(chan []byte, 256),
		roomKey: roomKey,
		name:    userName,
		id:      generateClientID(),
	}
	client.hub.register <- client

	// Отправляем клиенту сообщение "init" с его идентификатором.
	initMsg, err := json.Marshal(map[string]interface{}{
		"type":   "init",
		"selfId": client.id,
	})
	if err == nil {
		client.send <- initMsg
	}

	go client.writePump()
	client.readPump()
}

// handleCreateRoom и handleJoinRoom остаются без изменений.
func handleCreateRoom(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	roomKey := generateRoomKey()
	createdAt := time.Now()
	insertSQL := `INSERT INTO rooms (room_key, created_at) VALUES (?, ?)`
	_, err := db.Exec(insertSQL, roomKey, createdAt)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error creating room: %v", err), http.StatusInternalServerError)
		return
	}
	response := CreateRoomResponse{
		RoomKey: roomKey,
	}
	json.NewEncoder(w).Encode(response)
}

func handleJoinRoom(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var joinRequest JoinRoomRequest
	err := json.NewDecoder(r.Body).Decode(&joinRequest)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}
	querySQL := `SELECT id FROM rooms WHERE room_key = ? LIMIT 1`
	row := db.QueryRow(querySQL, joinRequest.RoomKey)
	var roomID int
	err = row.Scan(&roomID)
	if err != nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}
	w.Write([]byte(`{"message": "Room joined successfully"}`))
}

// generateRoomKey создает случайный ключ из 6 символов.
func generateRoomKey() string {
	letters := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	keyLength := 6
	key := make([]rune, keyLength)
	for i := range key {
		key[i] = letters[rand.Intn(len(letters))]
	}
	return string(key)
}

// corsMiddleware добавляет заголовки для CORS.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	rand.Seed(time.Now().UnixNano())

	var err error
	db, err = sql.Open("sqlite3", "./planning_poker.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	createTableSQL := `CREATE TABLE IF NOT EXISTS rooms (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		room_key TEXT NOT NULL,
		created_at DATETIME NOT NULL
	);`
	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatal(err)
	}

	hub = newHub()
	go hub.run()

	router := mux.NewRouter()
	router.HandleFunc("/room/create", handleCreateRoom).Methods("POST", "OPTIONS")
	router.HandleFunc("/room/join", handleJoinRoom).Methods("POST", "OPTIONS")
	router.HandleFunc("/ws", handleWebsocket).Methods("GET", "OPTIONS")

	handler := corsMiddleware(router)
	log.Println("Starting server on :8080")
	err = http.ListenAndServe(":8080", handler)
	if err != nil {
		log.Fatal(err)
	}
}
