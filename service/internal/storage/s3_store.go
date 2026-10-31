package storage

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Config struct {
	Endpoint      string
	Bucket        string
	AccessKey     string
	SecretKey     string
	Region        string
	UsePathStyle  bool
}

type s3Store struct {
	client *s3.Client
	bucket string
}

func NewS3Store(ctx context.Context, cfg S3Config) (Store, error) {
	if cfg.Bucket == "" {
		return nil, fmt.Errorf("storage: s3 bucket is required")
	}
	if cfg.Region == "" {
		cfg.Region = "us-east-1"
	}
	awsCfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(cfg.Region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AccessKey, cfg.SecretKey, "")),
	)
	if err != nil {
		return nil, err
	}
	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		if cfg.Endpoint != "" {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
		}
		o.UsePathStyle = cfg.UsePathStyle
	})
	store := &s3Store{client: client, bucket: cfg.Bucket}
	if err := store.ensureBucket(ctx); err != nil {
		return nil, err
	}
	return store, nil
}

func NewRustFSStore(ctx context.Context, cfg S3Config) (Store, error) {
	return NewS3Store(ctx, cfg)
}

func NewRustFSStoreFromConfig(ctx context.Context, endpoint, bucket, accessKey, secretKey, region string, usePathStyle bool) (Store, error) {
	return NewS3Store(ctx, S3Config{
		Endpoint:     endpoint,
		Bucket:       bucket,
		AccessKey:    accessKey,
		SecretKey:    secretKey,
		Region:       region,
		UsePathStyle: usePathStyle,
	})
}

func (s *s3Store) ensureBucket(ctx context.Context) error {
	_, err := s.client.HeadBucket(ctx, &s3.HeadBucketInput{Bucket: aws.String(s.bucket)})
	if err == nil {
		return nil
	}
	if !strings.Contains(strings.ToLower(err.Error()), "not found") && !strings.Contains(err.Error(), "404") && !strings.Contains(strings.ToLower(err.Error()), "nosuchbucket") {
		// attempt create anyway
	}
	_, cerr := s.client.CreateBucket(ctx, &s3.CreateBucketInput{Bucket: aws.String(s.bucket)})
	if cerr != nil && !strings.Contains(strings.ToLower(cerr.Error()), "already") {
		return fmt.Errorf("storage: create bucket %q: %w", s.bucket, cerr)
	}
	return nil
}

func (s *s3Store) Save(ctx context.Context, id string, reader io.Reader) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	if reader == nil {
		return fmt.Errorf("storage: nil reader")
	}
	key := strings.TrimPrefix(id, "/")
	_, err := s.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(key),
		Body:        reader,
		ContentType: aws.String("application/octet-stream"),
	})
	if err != nil {
		return err
	}
	return nil
}

func (s *s3Store) Open(ctx context.Context, id string) (io.ReadCloser, error) {
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	key := strings.TrimPrefix(id, "/")
	out, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	return out.Body, nil
}

func (s *s3Store) Delete(ctx context.Context, id string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	key := strings.TrimPrefix(id, "/")
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	return err
}

func NewStore(ctx context.Context, cfg S3Config) (Store, error) {
	return NewS3Store(ctx, cfg)
}

func NewObjectStore(ctx context.Context, cfg S3Config) (Store, error) {
	return NewS3Store(ctx, cfg)
}

func NewRustFS(ctx context.Context, cfg S3Config) (Store, error) {
	return NewS3Store(ctx, cfg)
}
