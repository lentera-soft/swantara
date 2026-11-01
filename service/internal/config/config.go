package config

import (
	"fmt"
	"log"
	"os"
	"reflect"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jalusw/swantara/apps/service/internal/helper"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
)

type Config struct {
	ApplicationName     string `mapstructure:"APP_NAME" validate:"required"`
	ApplicationHost     string `mapstructure:"APP_HOST" validate:"required"`
	ApplicationPort     int    `mapstructure:"APP_PORT" validate:"required,min=1,max=65535"`
	ApplicationDebug    bool   `mapstructure:"APP_DEBUG"`
	ApplicationLanguage string `mapstructure:"APP_LANG" validate:"required"`
	ApplicationURL      string `mapstructure:"APP_URL" validate:"required,url"`
	ApplicationVersion  string `mapstructure:"APP_VERSION"`
	ApplicationPrefork  bool   `mapstructure:"APP_PREFORK"`

	LogLevel      string `mapstructure:"LOG_LEVEL" validate:"oneof=debug info warn error"`
	LogFile       string `mapstructure:"LOG_FILE"`
	LogFormat     string `mapstructure:"LOG_FORMAT" validate:"omitempty,oneof=text json pretty pretty-json"`
	LogMaxSize    int    `mapstructure:"LOG_MAX_SIZE" validate:"min=1"`
	LogMaxAge     int    `mapstructure:"LOG_MAX_AGE" validate:"min=1"`
	LogMaxBackups int    `mapstructure:"LOG_MAX_BACKUPS" validate:"min=0"`
	LogCompress   bool   `mapstructure:"LOG_COMPRESS"`

	DatabaseName                string        `mapstructure:"DB_NAME" validate:"required"`
	DatabaseHost                string        `mapstructure:"DB_HOST" validate:"required"`
	DatabasePort                int           `mapstructure:"DB_PORT" validate:"required,min=1,max=65535"`
	DatabaseUser                string        `mapstructure:"DB_USER" validate:"required"`
	DatabasePassword            string        `mapstructure:"DB_PASSWORD"`
	DatabaseSSLMode             string        `mapstructure:"DB_SSL_MODE" validate:"oneof=disable require verify-ca verify-full prefer"`
	DatabaseMaxOpenConns        int           `mapstructure:"DB_MAX_OPEN_CONNS" validate:"min=1"`
	DatabaseMaxIdleConns        int           `mapstructure:"DB_MAX_IDLE_CONNS" validate:"min=0"`
	DatabaseConnMaxLife         time.Duration `mapstructure:"DB_CONN_MAX_LIFE" validate:"min=1s"`
	DatabaseConnMaxIdle         time.Duration `mapstructure:"DB_CONN_MAX_IDLE" validate:"min=1s"`
	DatabaseSlowThreshold       time.Duration `mapstructure:"DB_SLOW_THRESHOLD" validate:"omitempty,min=1ms"`
	DatabaseRequireNonSuperuser bool          `mapstructure:"DB_REQUIRE_NON_SUPERUSER"`

	BcryptCost int    `mapstructure:"BCRYPT_PASSWORD_COST" validate:"min=4,max=31"`
	Pepper     string `mapstructure:"PASSWORD_PEPPER"`

	JWTAccessTokenSecret           string `mapstructure:"JWT_ACCESS_TOKEN_SECRET" validate:"required"`
	JWTAccessTokenExpires          string `mapstructure:"JWT_ACCESS_TOKEN_EXPIRES_IN" validate:"required"`
	JWTAccessTokenExpiresDuration  time.Duration
	JWTAccessTokenSigningMethod    jwt.SigningMethod
	JWTRefreshTokenSecret          string `mapstructure:"JWT_REFRESH_TOKEN_SECRET" validate:"required"`
	JWTRefreshTokenExpires         string `mapstructure:"JWT_REFRESH_TOKEN_EXPIRES_IN" validate:"required"`
	JWTRefreshTokenExpiresDuration time.Duration
	JWTRefreshTokenSigningMethod   jwt.SigningMethod

	QueueRedisHost     string `mapstructure:"QUEUE_REDIS_HOST" validate:"required"`
	QueueRedisPort     int    `mapstructure:"QUEUE_REDIS_PORT" validate:"required"`
	QueueRedisPassword string `mapstructure:"QUEUE_REDIS_PASSWORD"`
	QueueRedisDB       int    `mapstructure:"QUEUE_REDIS_DB" validate:"min=0"`

	SMTPHost       string `mapstructure:"SMTP_HOST" validate:"required"`
	SMTPPort       int    `mapstructure:"SMTP_PORT" validate:"required,min=1,max=65535"`
	SMTPUsername   string `mapstructure:"SMTP_USERNAME"`
	SMTPPassword   string `mapstructure:"SMTP_PASSWORD"`
	SMTPEncryption string `mapstructure:"SMTP_ENCRYPTION" validate:"oneof=none tls ssl"`
	SMTPFromEmail  string `mapstructure:"SMTP_FROM_EMAIL" validate:"omitempty,email"`
	SMTPFromName   string `mapstructure:"SMTP_FROM_NAME"`

	ClientWebURL string `mapstructure:"CLIENT_WEB_URL" validate:"required,url"`

	TrustedProxies string `mapstructure:"APP_TRUSTED_PROXIES"`

	MailUserVerificationRedirection string `mapstructure:"MAIL_USER_VERIFICATION_REDIRECTION" validate:"required,url"`
	MailPasswordResetRedirection    string `mapstructure:"MAIL_PASSWORD_RESET_REDIRECTION" validate:"required,url"`

	AuthEmailVerifyTTL   string `mapstructure:"AUTH_EMAIL_VERIFY_TTL"`
	AuthPasswordResetTTL string `mapstructure:"AUTH_PASSWORD_RESET_TTL"`

	AuthEmailVerifyTTLDuration   time.Duration
	AuthPasswordResetTTLDuration time.Duration

	OAuthStateTTL        string `mapstructure:"OAUTH_STATE_TTL" validate:"omitempty"`
	OAuthHTTPTimeout     string `mapstructure:"OAUTH_HTTP_TIMEOUT" validate:"omitempty"`
	OAuthSuccessRedirect string `mapstructure:"OAUTH_SUCCESS_REDIRECT" validate:"omitempty,startswith=/"`

	OAuthStateTTLDuration    time.Duration
	OAuthHTTPTimeoutDuration time.Duration

	GoogleClientID     string `mapstructure:"OAUTH_GOOGLE_CLIENT_ID"`
	GoogleClientSecret string `mapstructure:"OAUTH_GOOGLE_CLIENT_SECRET"`
	FacebookAppID      string `mapstructure:"OAUTH_FACEBOOK_APP_ID"`
	FacebookAppSecret  string `mapstructure:"OAUTH_FACEBOOK_APP_SECRET"`

	StorageProvider      string `mapstructure:"STORAGE_PROVIDER" validate:"omitempty,oneof=local s3 rustfs"`
	StoragePath          string `mapstructure:"STORAGE_PATH" validate:"omitempty"`
	StorageMaxUploadSize int64  `mapstructure:"STORAGE_MAX_UPLOAD_SIZE" validate:"required,min=1"`

	StorageEndpoint     string `mapstructure:"STORAGE_ENDPOINT"`
	StorageBucket       string `mapstructure:"STORAGE_BUCKET"`
	StorageAccessKey    string `mapstructure:"STORAGE_ACCESS_KEY"`
	StorageSecretKey    string `mapstructure:"STORAGE_SECRET_KEY"`
	StorageRegion       string `mapstructure:"STORAGE_REGION"`
	StorageUsePathStyle bool   `mapstructure:"STORAGE_USE_PATH_STYLE"`

	RateLimiterEnabled    bool   `mapstructure:"RATE_LIMITER_ENABLED"`
	RateLimiterMax        int    `mapstructure:"RATE_LIMITER_MAX" validate:"min=1"`
	RateLimiterExpiration string `mapstructure:"RATE_LIMITER_EXPIRATION" validate:"required"`
	RateLimiterDuration   time.Duration

	RateLimiterStorage       string `mapstructure:"RATE_LIMITER_STORAGE" validate:"oneof=memory redis"`
	RateLimiterRedisHost     string `mapstructure:"RATE_LIMITER_REDIS_HOST"`
	RateLimiterRedisPort     int    `mapstructure:"RATE_LIMITER_REDIS_PORT" validate:"min=0,max=65535"`
	RateLimiterRedisPassword string `mapstructure:"RATE_LIMITER_REDIS_PASSWORD"`
	RateLimiterRedisDB       int    `mapstructure:"RATE_LIMITER_REDIS_DB" validate:"min=0"`
}

const (
	DefaultConfigPath     = "."
	DefaultConfigFilename = ".env"

	ConfigTypeEnv                          = "env"
	ConfigPathEnv                          = "CONFIG_PATH"
	ConfigFileEnv                          = "CONFIG_FILE"
	AddressFormat                          = "%s:%d"
	CommaSeparator                         = ","
	DefaultAppName                         = "Swantara API Service"
	DefaultAppHost                         = "localhost"
	DefaultAppPort                         = "8080"
	DefaultAppDebug                        = false
	DefaultAppLang                         = "en"
	DefaultAppUrl                          = "http://localhost:8080"
	DefaultAppVersion                      = "dev"
	DefaultAppPrefork                      = false
	DefaultLogLevel                        = "info"
	DefaultLogFile                         = ""
	DefaultLogFormat                       = ""
	DefaultLogMaxSize                      = 100
	DefaultLogMaxAge                       = 30
	DefaultLogMaxBackups                   = 3
	DefaultLogCompress                     = false
	DefaultDbName                          = "swantara"
	DefaultDbHost                          = "localhost"
	DefaultDbPort                          = "5432"
	DefaultDbUser                          = "postgres"
	DefaultDbSslMode                       = "disable"
	DefaultDbMaxOpenConns                  = 50
	DefaultDbMaxIdleConns                  = 10
	DefaultDbConnMaxLife                   = time.Hour
	DefaultDbConnMaxIdle                   = 30 * time.Minute
	DefaultDbSlowThreshold                 = "200ms"
	DefaultDbRequireNonSuperuser           = false
	DefaultBcryptPasswordCost              = bcrypt.DefaultCost
	DefaultJwtAccessTokenExpiresIn         = "30m"
	DefaultJwtRefreshTokenExpiresIn        = "48h"
	DefaultQueueRedisHost                  = "localhost"
	DefaultQueueRedisPort                  = 6379
	DefaultQueueRedisDb                    = 0
	DefaultSmtpHost                        = "localhost"
	DefaultSmtpPort                        = 1025
	DefaultSmtpUsername                    = ""
	DefaultSmtpPassword                    = ""
	DefaultSmtpEncryption                  = "none"
	DefaultSmtpFromEmail                   = "noreply@swantara.com"
	DefaultSmtpFromName                    = "Swantara"
	DefaultClientWebUrl                    = "http://localhost:3000"
	DefaultMailUserVerificationRedirection = "http://localhost:3000/email-verify"
	DefaultMailPasswordResetRedirection    = "http://localhost:3000/password-reset"
	DefaultAuthEmailVerifyTtl              = "24h"
	DefaultAuthPasswordResetTtl            = "30m"
	DefaultOAuthStateTtl                   = "10m"
	DefaultOAuthHTTPTimeout                = "15s"
	DefaultOAuthSuccessRedirect            = "/onboarding"
	DefaultRateLimiterEnabled              = true
	DefaultRateLimiterMax                  = 60
	DefaultRateLimiterExpiration           = "1m"
	DefaultRateLimiterStorage              = "memory"
	DefaultRateLimiterRedisHost            = "localhost"
	DefaultRateLimiterRedisPort            = 6379
	DefaultRateLimiterRedisDb              = 0
	DefaultStorageProvider                 = "local"
	DefaultStoragePath                     = "./storage"
	DefaultStorageMaxUploadSize            = 10 * 1024 * 1024
	DefaultStorageBucket                   = "swantara"
	DefaultStorageRegion                   = "us-east-1"
	DefaultStorageUsePathStyle             = true
)

func ConfigPath() string {
	if f := os.Getenv(ConfigPathEnv); f != "" {
		return f
	}
	return DefaultConfigPath
}

func ConfigFilename() string {
	if f := os.Getenv(ConfigFileEnv); f != "" {
		return f
	}
	return DefaultConfigFilename
}

func New(path, filename string) (*Config, error) {
	v := viper.New()
	var config Config

	v.SetConfigType(ConfigTypeEnv)
	v.AutomaticEnv()

	if filename != "" {
		v.SetConfigName(filename)
		v.AddConfigPath(path)
		if err := v.ReadInConfig(); err != nil {
			return nil, err
		}
	}

	v.SetDefault("APP_NAME", DefaultAppName)
	v.SetDefault("APP_HOST", DefaultAppHost)
	v.SetDefault("APP_PORT", DefaultAppPort)
	v.SetDefault("APP_DEBUG", DefaultAppDebug)
	v.SetDefault("APP_LANG", DefaultAppLang)
	v.SetDefault("APP_URL", DefaultAppUrl)
	v.SetDefault("APP_VERSION", DefaultAppVersion)
	v.SetDefault("APP_PREFORK", DefaultAppPrefork)

	v.SetDefault("LOG_LEVEL", DefaultLogLevel)
	v.SetDefault("LOG_FILE", DefaultLogFile)
	v.SetDefault("LOG_FORMAT", DefaultLogFormat)
	v.SetDefault("LOG_MAX_SIZE", DefaultLogMaxSize)
	v.SetDefault("LOG_MAX_AGE", DefaultLogMaxAge)
	v.SetDefault("LOG_MAX_BACKUPS", DefaultLogMaxBackups)
	v.SetDefault("LOG_COMPRESS", DefaultLogCompress)

	v.SetDefault("DB_NAME", DefaultDbName)
	v.SetDefault("DB_HOST", DefaultDbHost)
	v.SetDefault("DB_PORT", DefaultDbPort)
	v.SetDefault("DB_USER", DefaultDbUser)
	v.SetDefault("DB_SSL_MODE", DefaultDbSslMode)
	v.SetDefault("DB_MAX_OPEN_CONNS", DefaultDbMaxOpenConns)
	v.SetDefault("DB_MAX_IDLE_CONNS", DefaultDbMaxIdleConns)
	v.SetDefault("DB_CONN_MAX_LIFE", DefaultDbConnMaxLife)
	v.SetDefault("DB_CONN_MAX_IDLE", DefaultDbConnMaxIdle)
	v.SetDefault("DB_SLOW_THRESHOLD", DefaultDbSlowThreshold)
	v.SetDefault("DB_REQUIRE_NON_SUPERUSER", DefaultDbRequireNonSuperuser)

	v.SetDefault("BCRYPT_PASSWORD_COST", DefaultBcryptPasswordCost)

	v.SetDefault("JWT_ACCESS_TOKEN_EXPIRES_IN", DefaultJwtAccessTokenExpiresIn)
	v.SetDefault("JWT_REFRESH_TOKEN_EXPIRES_IN", DefaultJwtRefreshTokenExpiresIn)

	v.SetDefault("QUEUE_REDIS_HOST", DefaultQueueRedisHost)
	v.SetDefault("QUEUE_REDIS_PORT", DefaultQueueRedisPort)
	v.SetDefault("QUEUE_REDIS_DB", DefaultQueueRedisDb)

	v.SetDefault("SMTP_HOST", DefaultSmtpHost)
	v.SetDefault("SMTP_PORT", DefaultSmtpPort)
	v.SetDefault("SMTP_USERNAME", DefaultSmtpUsername)
	v.SetDefault("SMTP_PASSWORD", DefaultSmtpPassword)
	v.SetDefault("SMTP_ENCRYPTION", DefaultSmtpEncryption)
	v.SetDefault("SMTP_FROM_EMAIL", DefaultSmtpFromEmail)
	v.SetDefault("SMTP_FROM_NAME", DefaultSmtpFromName)

	v.SetDefault("CLIENT_WEB_URL", DefaultClientWebUrl)

	v.SetDefault("MAIL_USER_VERIFICATION_REDIRECTION", DefaultMailUserVerificationRedirection)
	v.SetDefault("MAIL_PASSWORD_RESET_REDIRECTION", DefaultMailPasswordResetRedirection)

	v.SetDefault("AUTH_EMAIL_VERIFY_TTL", DefaultAuthEmailVerifyTtl)
	v.SetDefault("AUTH_PASSWORD_RESET_TTL", DefaultAuthPasswordResetTtl)

	v.SetDefault("OAUTH_STATE_TTL", DefaultOAuthStateTtl)
	v.SetDefault("OAUTH_HTTP_TIMEOUT", DefaultOAuthHTTPTimeout)
	v.SetDefault("OAUTH_SUCCESS_REDIRECT", DefaultOAuthSuccessRedirect)

	v.SetDefault("RATE_LIMITER_ENABLED", DefaultRateLimiterEnabled)
	v.SetDefault("RATE_LIMITER_MAX", DefaultRateLimiterMax)
	v.SetDefault("RATE_LIMITER_EXPIRATION", DefaultRateLimiterExpiration)

	v.SetDefault("RATE_LIMITER_STORAGE", DefaultRateLimiterStorage)
	v.SetDefault("RATE_LIMITER_REDIS_HOST", DefaultRateLimiterRedisHost)
	v.SetDefault("RATE_LIMITER_REDIS_PORT", DefaultRateLimiterRedisPort)
	v.SetDefault("RATE_LIMITER_REDIS_DB", DefaultRateLimiterRedisDb)

	v.SetDefault("STORAGE_PROVIDER", DefaultStorageProvider)
	v.SetDefault("STORAGE_PATH", DefaultStoragePath)
	v.SetDefault("STORAGE_MAX_UPLOAD_SIZE", DefaultStorageMaxUploadSize)
	v.SetDefault("STORAGE_BUCKET", DefaultStorageBucket)
	v.SetDefault("STORAGE_REGION", DefaultStorageRegion)
	v.SetDefault("STORAGE_USE_PATH_STYLE", DefaultStorageUsePathStyle)

	value := reflect.ValueOf(&config).Elem()
	typ := value.Type()
	for i := 0; i < typ.NumField(); i++ {
		field := value.Field(i)
		tag, _, _ := strings.Cut(typ.Field(i).Tag.Get("mapstructure"), CommaSeparator)
		if tag == "" || tag == "-" {
			continue
		}
		if err := v.UnmarshalKey(tag, field.Addr().Interface()); err != nil {
			log.Println("Failed to parse the configuration", err)
			return nil, err
		}
	}

	config.JWTAccessTokenSigningMethod = jwt.SigningMethodHS256
	config.JWTRefreshTokenSigningMethod = jwt.SigningMethodHS256

	if err := config.Validate(); err != nil {
		return nil, err
	}

	duration, err := helper.ParseDuration("RATE_LIMITER_EXPIRATION", config.RateLimiterExpiration)
	if err != nil {
		return nil, err
	}
	config.RateLimiterDuration = duration

	emailVerifyTTL, err := helper.ParseDuration("AUTH_EMAIL_VERIFY_TTL", config.AuthEmailVerifyTTL)
	if err != nil {
		return nil, err
	}
	config.AuthEmailVerifyTTLDuration = emailVerifyTTL

	passwordResetTTL, err := helper.ParseDuration("AUTH_PASSWORD_RESET_TTL", config.AuthPasswordResetTTL)
	if err != nil {
		return nil, err
	}
	config.AuthPasswordResetTTLDuration = passwordResetTTL

	if config.OAuthStateTTL == "" {
		config.OAuthStateTTL = DefaultOAuthStateTtl
	}
	if config.OAuthHTTPTimeout == "" {
		config.OAuthHTTPTimeout = DefaultOAuthHTTPTimeout
	}

	oauthStateTTL, err := helper.ParseDuration("OAUTH_STATE_TTL", config.OAuthStateTTL)
	if err != nil {
		return nil, err
	}
	config.OAuthStateTTLDuration = oauthStateTTL

	oauthHTTPTimeout, err := helper.ParseDuration("OAUTH_HTTP_TIMEOUT", config.OAuthHTTPTimeout)
	if err != nil {
		return nil, err
	}
	config.OAuthHTTPTimeoutDuration = oauthHTTPTimeout

	accessTokenExpires, err := helper.ParseDuration("JWT_ACCESS_TOKEN_EXPIRES_IN", config.JWTAccessTokenExpires)
	if err != nil {
		return nil, err
	}
	config.JWTAccessTokenExpiresDuration = accessTokenExpires

	refreshTokenExpires, err := helper.ParseDuration("JWT_REFRESH_TOKEN_EXPIRES_IN", config.JWTRefreshTokenExpires)
	if err != nil {
		return nil, err
	}
	config.JWTRefreshTokenExpiresDuration = refreshTokenExpires

	return &config, nil
}

func (c *Config) HTTPAddress() string {
	return fmt.Sprintf(AddressFormat, c.ApplicationHost, c.ApplicationPort)
}

func (c *Config) QueueRedisAddress() string {
	return fmt.Sprintf(AddressFormat, c.QueueRedisHost, c.QueueRedisPort)
}

func (c *Config) RateLimiterRedisAddress() string {
	return fmt.Sprintf(AddressFormat, c.RateLimiterRedisHost, c.RateLimiterRedisPort)
}

func (c *Config) TrustedProxyList() []string {
	if strings.TrimSpace(c.TrustedProxies) == "" {
		return nil
	}

	parts := strings.Split(c.TrustedProxies, CommaSeparator)
	proxies := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			proxies = append(proxies, trimmed)
		}
	}
	return proxies
}

func (c *Config) Validate() error {
	v := validator.New(validator.WithRequiredStructEnabled())
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name, _, _ := strings.Cut(fld.Tag.Get("mapstructure"), CommaSeparator)
		if name == "-" {
			return ""
		}
		return name
	})

	if err := v.Struct(c); err != nil {
		return err
	}

	if c.StorageProvider == "s3" || c.StorageProvider == "rustfs" {
		if c.StorageEndpoint == "" {
			return fmt.Errorf("STORAGE_ENDPOINT is required for %s storage", c.StorageProvider)
		}
		if c.StorageBucket == "" {
			return fmt.Errorf("STORAGE_BUCKET is required for %s storage", c.StorageProvider)
		}
		if c.StorageAccessKey == "" {
			return fmt.Errorf("STORAGE_ACCESS_KEY is required for %s storage", c.StorageProvider)
		}
		if c.StorageSecretKey == "" {
			return fmt.Errorf("STORAGE_SECRET_KEY is required for %s storage", c.StorageProvider)
		}
	}

	if (c.GoogleClientID != "") != (c.GoogleClientSecret != "") {
		return fmt.Errorf("OAUTH_GOOGLE_CLIENT_ID and OAUTH_GOOGLE_CLIENT_SECRET must be set together")
	}

	if (c.FacebookAppID != "") != (c.FacebookAppSecret != "") {
		return fmt.Errorf("OAUTH_FACEBOOK_APP_ID and OAUTH_FACEBOOK_APP_SECRET must be set together")
	}

	for _, d := range []struct {
		name  string
		value string
	}{
		{name: "RATE_LIMITER_EXPIRATION", value: c.RateLimiterExpiration},
		{name: "AUTH_EMAIL_VERIFY_TTL", value: c.AuthEmailVerifyTTL},
		{name: "AUTH_PASSWORD_RESET_TTL", value: c.AuthPasswordResetTTL},
		{name: "OAUTH_STATE_TTL", value: c.OAuthStateTTL},
		{name: "OAUTH_HTTP_TIMEOUT", value: c.OAuthHTTPTimeout},
	} {
		if d.value == "" {
			continue
		}
		if _, err := helper.ParseDuration(d.name, d.value); err != nil {
			return err
		}
	}

	return nil
}

func ConfigFilePath() string { return ConfigFilename() }
