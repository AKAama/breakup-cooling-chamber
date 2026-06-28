# ---------- Build stage ----------
FROM golang:1.25-alpine AS builder

WORKDIR /app

# 先拷依赖清单，利用 docker 缓存
COPY go.mod go.sum ./
RUN go mod download

# 拷源码
COPY . .

# 静态编译（CGO 关掉，方便 alpine 运行）
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/server ./cmd/server

# ---------- Runtime stage ----------
FROM alpine:3.20

# ca-certificates: 调 DeepSeek HTTPS 需要；tzdata: 时区正确
RUN apk add --no-cache ca-certificates tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

WORKDIR /app
COPY --from=builder /out/server .
# migrations 当前由程序 RunMigrations 自动执行，但保留以备手动初始化
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080
CMD ["./server"]
