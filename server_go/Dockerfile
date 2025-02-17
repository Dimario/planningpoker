# Этап 1: Сборка Go-приложения
FROM golang:1.20 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -o planning_poker .

# Этап 2: Создание минимального образа для запуска
# Используем образ с более новой glibc (например, Debian Bookworm)
FROM debian:bookworm-slim

# Устанавливаем необходимые библиотеки, в том числе SQLite runtime
RUN apt-get update && apt-get install -y libsqlite3-0 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/planning_poker .

EXPOSE 8080
CMD ["./planning_poker"]
