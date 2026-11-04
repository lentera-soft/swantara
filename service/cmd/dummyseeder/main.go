package main

import (
	"fmt"
	"log/slog"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/config"
	"github.com/jalusw/swantara/apps/service/internal/db"
	"github.com/jalusw/swantara/apps/service/internal/iam"
	"github.com/jalusw/swantara/apps/service/internal/logger"
	"github.com/jalusw/swantara/apps/service/internal/seeders"

	"github.com/jalusw/swantara/apps/service/internal/kernel/clock"
)

func main() {
	startEstimation := clock.Now()

	cfg, err := config.New(config.ConfigFilename(), config.ConfigPath())
	if err != nil {
		logger.Fatalf("Failed to load config %v", err)
	}

	logger.Setup(cfg.ApplicationDebug, cfg.LogLevel, logger.Options{
		File:       cfg.LogFile,
		Format:     cfg.LogFormat,
		MaxSize:    cfg.LogMaxSize,
		MaxAge:     cfg.LogMaxAge,
		MaxBackups: cfg.LogMaxBackups,
		Compress:   cfg.LogCompress,
	})
	slog.Info("Starting dummy case seeding process")

	d, err := db.New(cfg)
	if err != nil {
		logger.Fatalf("Failed to load db %v", err)
	}

	passwordSvc := iam.NewPasswordService(cfg)
	seeder, err := seeders.New(d, passwordSvc)
	if err != nil {
		logger.Fatalf("Failed to initialize seeder %v", err)
	}

	if err := seeder.SeedPermissions(); err != nil {
		logger.Fatalf("Failed to seed permissions %v", err)
	}
	if err := seeder.SeedDummyCase(); err != nil {
		logger.Fatalf("Failed to seed dummy case %v", err)
	}

	elapsed := time.Since(startEstimation)
	fmt.Printf("Dummy case seeding finished with %v", elapsed.Milliseconds())
}
