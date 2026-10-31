package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

type Store interface {
	Save(ctx context.Context, id string, reader io.Reader) error
	Open(ctx context.Context, id string) (io.ReadCloser, error)
	Delete(ctx context.Context, id string) error
}

type LocalStore struct {
	root string
}

func NewLocalStore(root string) Store {
	return LocalStore{root: root}
}

func (s LocalStore) resolve(id string) (string, error) {
	if id == "" {
		return "", errors.New("storage: empty object id")
	}
	clean := filepath.Clean("/" + strings.TrimPrefix(filepath.ToSlash(id), "/"))
	clean = strings.TrimPrefix(clean, "/")
	if clean == "" || clean == "." || strings.HasPrefix(clean, "../") || clean == ".." {
		return "", fmt.Errorf("storage: invalid object id %q", id)
	}
	full := filepath.Join(s.root, filepath.FromSlash(clean))
	rel, err := filepath.Rel(s.root, full)
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) || filepath.IsAbs(rel) {
		return "", fmt.Errorf("storage: invalid object id %q", id)
	}
	return full, nil
}

func (s LocalStore) Save(ctx context.Context, id string, reader io.Reader) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if reader == nil {
		return errors.New("storage: nil reader")
	}
	full, err := s.resolve(id)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return err
	}
	f, err := os.Create(full)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(f, reader)
	closeErr := f.Close()
	if copyErr != nil {
		return copyErr
	}
	return closeErr
}

func (s LocalStore) Open(ctx context.Context, id string) (io.ReadCloser, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	full, err := s.resolve(id)
	if err != nil {
		return nil, err
	}
	f, err := os.Open(full)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("storage: object %q not found: %w", id, fs.ErrNotExist)
		}
		return nil, err
	}
	return f, nil
}

func (s LocalStore) Delete(ctx context.Context, id string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	full, err := s.resolve(id)
	if err != nil {
		return err
	}
	if err := os.Remove(full); err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	return nil
}
