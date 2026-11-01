package storage

import (
	"context"
	"io"

	"github.com/jalusw/swantara/apps/service/internal/config"
)

// StorageService selects and wraps the configured storage backend.
type StorageService struct {
	store Store
}

func NewStorageService(cfg *config.Config) (StorageService, error) {
	switch cfg.StorageProvider {
	case "s3", "rustfs":
		store, err := NewS3Store(context.Background(), S3Config{
			Endpoint:     cfg.StorageEndpoint,
			Bucket:       cfg.StorageBucket,
			AccessKey:    cfg.StorageAccessKey,
			SecretKey:    cfg.StorageSecretKey,
			Region:       cfg.StorageRegion,
			UsePathStyle: cfg.StorageUsePathStyle,
		})
		if err != nil {
			return StorageService{}, err
		}
		return StorageService{store: store}, nil
	default:
		return StorageService{store: NewLocalStore(cfg.StoragePath)}, nil
	}
}

func NewStorage(cfg *config.Config) (StorageService, error) {
	return NewStorageService(cfg)
}

func NewService(cfg *config.Config) (StorageService, error) {
	return NewStorageService(cfg)
}

func NewStorageStore(cfg *config.Config) (StorageService, error) {
	return NewStorageService(cfg)
}

func (s StorageService) Store() Store {
	return s.store
}

func (s StorageService) Save(ctx context.Context, id string, reader io.Reader) error {
	return s.store.Save(ctx, id, reader)
}

func (s StorageService) Open(ctx context.Context, id string) (io.ReadCloser, error) {
	return s.store.Open(ctx, id)
}

func (s StorageService) Delete(ctx context.Context, id string) error {
	return s.store.Delete(ctx, id)
}
