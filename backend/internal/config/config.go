package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

// Config 全局配置，从环境变量 / .env 文件读取
type Config struct {
	Port           string
	GinMode        string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	DBSSLMode      string
	DeepSeekKey    string
	AllowedOrigins string
}

// Load 加载配置，优先读取 .env 文件，再读取环境变量
func Load() (*Config, error) {
	// .env 不存在不报错，继续读取系统环境变量
	_ = godotenv.Load()

	cfg := &Config{
		Port:           getEnv("PORT", "8080"),
		GinMode:        getEnv("GIN_MODE", "debug"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "postgres"),
		DBPassword:     getEnv("DB_PASSWORD", "postgres"),
		DBName:         getEnv("DB_NAME", "cooling_chamber"),
		DBSSLMode:      getEnv("DB_SSLMODE", "disable"),
		DeepSeekKey:    getEnv("DEEPSEEK_KEY", ""),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:5173"),
	}

	return cfg, nil
}

// DSN 返回 PostgreSQL 连接字符串
func (c *Config) DSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode)
}

// getEnv 读取环境变量，不存在则返回默认值
func getEnv(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
