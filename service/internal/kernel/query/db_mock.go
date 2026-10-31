//go:build test

package query

import (
	"regexp"
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	softDeletePredicate    = regexp.MustCompile(`"[^"]+"\."deleted_at" IS NULL`)
	leadingSoftDelete      = regexp.MustCompile(` AND ` + softDeletePredicate.String())
	trailingSoftDelete     = regexp.MustCompile(softDeletePredicate.String() + ` AND `)
	standaloneSoftDelete   = regexp.MustCompile(` WHERE ` + softDeletePredicate.String())
	whereClauseTerminators = []string{" ORDER BY", " LIMIT", " GROUP BY", " FOR "}
)

type softDeleteMatcher struct{}

func (softDeleteMatcher) Match(expectedSQL, actualSQL string) error {
	return sqlmock.QueryMatcherRegexp.Match(expectedSQL, normalizeSQL(actualSQL))
}

func normalizeSQL(sql string) string {
	sql = leadingSoftDelete.ReplaceAllString(sql, "")
	sql = trailingSoftDelete.ReplaceAllString(sql, "")
	sql = standaloneSoftDelete.ReplaceAllString(sql, "")
	return stripRedundantWhereParens(sql)
}

func stripRedundantWhereParens(sql string) string {
	const marker = " WHERE ("
	offset := 0
	for {
		index := strings.Index(sql[offset:], marker)
		if index == -1 {
			return sql
		}
		index += offset
		open := index + len(" WHERE ")
		depth := 0
		closed := -1
		for i := open; i < len(sql); i++ {
			switch sql[i] {
			case '(':
				depth++
			case ')':
				depth--
				if depth == 0 {
					closed = i
				}
			}
			if closed != -1 {
				break
			}
		}
		if closed == -1 {
			return sql
		}
		rest := sql[closed+1:]
		if endsWhereClause(rest) {
			sql = sql[:open] + sql[open+1:closed] + rest
			offset = open
			continue
		}
		offset = closed + 1
	}
}

func endsWhereClause(rest string) bool {
	if rest == "" || rest == ";" {
		return true
	}
	for _, terminator := range whereClauseTerminators {
		if strings.HasPrefix(rest, terminator) {
			return true
		}
	}
	return false
}

func NewMockDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock) {
	t.Helper()
	mockDB, mock, _ := sqlmock.New(sqlmock.QueryMatcherOption(softDeleteMatcher{}))
	db, _ := gorm.Open(postgres.New(postgres.Config{Conn: mockDB}), &gorm.Config{})
	return db, mock
}

func AssertDBMockDone(t *testing.T, mock sqlmock.Sqlmock) {
	t.Helper()
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Error(err)
	}
}
