package db

import (
	"context"
	"errors"
	"log/slog"
	"strings"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"gorm.io/gorm/logger"
)

const maxSQLLogLength = 500

type gormSlogLogger struct {
	config logger.Config
	level  logger.LogLevel
}

func newGormSlogLogger(slowThreshold time.Duration) *gormSlogLogger {
	return &gormSlogLogger{
		config: logger.Config{
			SlowThreshold:             slowThreshold,
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
		},
	}
}

func (l *gormSlogLogger) LogMode(level logger.LogLevel) logger.Interface {
	newLogger := *l
	newLogger.level = level
	newLogger.config.LogLevel = level
	return &newLogger
}

func (l *gormSlogLogger) Info(ctx context.Context, msg string, data ...any) {
	if l.config.LogLevel >= logger.Info {
		slog.Info(msg, data...)
	}
}

func (l *gormSlogLogger) Warn(ctx context.Context, msg string, data ...any) {
	if l.config.LogLevel >= logger.Warn {
		slog.Warn(msg, data...)
	}
}

func (l *gormSlogLogger) Error(ctx context.Context, msg string, data ...any) {
	if l.config.LogLevel >= logger.Error {
		slog.Error(msg, data...)
	}
}

func (l *gormSlogLogger) Trace(ctx context.Context, begin time.Time, fc func() (string, int64), err error) {
	if l.config.LogLevel <= logger.Silent {
		return
	}

	elapsed := time.Since(begin)
	sql, rows := fc()
	attrs := []any{
		"table", extractTable(sql),
		"duration", elapsed,
		"rows", rows,
	}
	if requestID := helper.RequestID(ctx); requestID != "" {
		attrs = append(attrs, "request_id", requestID)
	}
	if actorID := model.ActorID(ctx); actorID != 0 {
		attrs = append(attrs, "user_id", actorID)
	}

	redactedSQL := trimSQL(redactSQL(sql))

	switch {
	case err != nil && l.config.LogLevel >= logger.Error && !errors.Is(err, logger.ErrRecordNotFound):
		slog.Error("query_error", append(attrs, "sql", redactedSQL, "error", err)...)
	case elapsed > l.config.SlowThreshold && l.config.SlowThreshold != 0 && l.config.LogLevel >= logger.Warn:
		slog.Warn("slow_query", append(attrs, "sql", redactedSQL)...)
	default:
		slog.Debug("query", append(attrs, "sql", redactedSQL)...)
	}
}

// redactSQL replaces string and numeric literals with placeholders so query
// logs keep their shape without exposing values such as emails or tokens.
func redactSQL(sql string) string {
	var out strings.Builder
	out.Grow(len(sql))

	for i := 0; i < len(sql); {
		c := sql[i]
		switch {
		case c == '\'':
			out.WriteByte('\'')
			i++
			for i < len(sql) {
				if sql[i] == '\'' {
					if i+1 < len(sql) && sql[i+1] == '\'' {
						i += 2
						continue
					}
					break
				}
				i++
			}
			out.WriteString("?")
			if i < len(sql) {
				out.WriteByte('\'')
				i++
			}
		case c == '"':
			out.WriteByte('"')
			i++
			for i < len(sql) && sql[i] != '"' {
				out.WriteByte(sql[i])
				i++
			}
			if i < len(sql) {
				out.WriteByte('"')
				i++
			}
		case isSQLNumberStart(sql, i):
			out.WriteByte('?')
			i = skipSQLNumber(sql, i)
		default:
			out.WriteByte(c)
			i++
		}
	}

	return out.String()
}

func isSQLNumberStart(sql string, i int) bool {
	c := sql[i]
	if c >= '0' && c <= '9' {
		return !isSQLIdentifierByte(previousSQLByte(sql, i))
	}
	if c == '-' && i+1 < len(sql) && sql[i+1] >= '0' && sql[i+1] <= '9' {
		return !isSQLIdentifierByte(previousSQLByte(sql, i))
	}
	return false
}

func previousSQLByte(sql string, i int) byte {
	if i == 0 {
		return 0
	}
	return sql[i-1]
}

func isSQLIdentifierByte(c byte) bool {
	return c == '_' || c == '$' || c == '.' ||
		(c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')
}

func skipSQLNumber(sql string, i int) int {
	if sql[i] == '-' {
		i++
	}
	for i < len(sql) {
		c := sql[i]
		if (c >= '0' && c <= '9') || c == '.' || c == 'e' || c == 'E' || c == '+' || c == '-' {
			i++
			continue
		}
		break
	}
	return i
}

func trimSQL(sql string) string {
	sql = strings.Join(strings.Fields(sql), " ")
	if len(sql) > maxSQLLogLength {
		return sql[:maxSQLLogLength] + "..."
	}
	return sql
}

func extractTable(sql string) string {
	lower := strings.ToLower(sql)

	best := ""
	bestIndex := -1
	for _, marker := range []string{"update ", "into ", "from "} {
		if idx := strings.Index(lower, marker); idx >= 0 && (bestIndex < 0 || idx < bestIndex) {
			best = marker
			bestIndex = idx
		}
	}

	if bestIndex < 0 {
		return ""
	}

	table := strings.TrimSpace(lower[bestIndex+len(best):])
	table = strings.Split(table, " ")[0]
	table = strings.Trim(table, "`\"'")
	if dot := strings.LastIndexByte(table, '.'); dot >= 0 {
		return table[dot+1:]
	}
	return table
}
