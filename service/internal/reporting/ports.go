package reporting

import (
	"context"
	"time"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	"github.com/jalusw/swantara/apps/service/internal/asset"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	"github.com/jalusw/swantara/apps/service/internal/kernel/amount"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/project"
	"github.com/jalusw/swantara/apps/service/internal/reference"
	"github.com/jalusw/swantara/apps/service/internal/subscription"
)

type RateResolver interface {
	Rate(ctx context.Context, currencyCode string, organizationID uint64, rateType amount.RateType, date time.Time) (amount.Amount, error)
}

type Poster interface {
	Post(ctx context.Context, request accounting.PostRequest) (*accounting.JournalEntry, error)
	Reverse(ctx context.Context, request accounting.ReverseRequest) (*accounting.JournalEntry, error)
}

type OrgReader interface {
	Find(ctx context.Context, id uint64) (*reference.Organization, error)
}

type PipelineForecaster interface {
	Forecast(ctx context.Context, organizationID *uint64) (crm.PipelineForecast, error)
}

type SubscriptionMetricsProvider interface {
	Metrics(ctx context.Context, organizationID uint64) (subscription.Metrics, error)
}

type ProjectListReader interface {
	List(ctx context.Context, q *query.Query) (*query.Page[project.Project], error)
}

type ProjectSummarizer interface {
	Summary(ctx context.Context, projectID uint64) (project.ProjectSummary, error)
}

type PeriodCloser interface {
	Close(ctx context.Context, periodID uint64) (*accounting.TaxPeriod, error)
	Lock(ctx context.Context, periodID uint64) (*accounting.TaxPeriod, error)
}

type AssetListReader interface {
	List(ctx context.Context, q *query.Query) (*query.Page[asset.FixedAsset], error)
}

type DepreciationPoster interface {
	PostDepreciation(ctx context.Context, request asset.PostDepreciationRequest) (*asset.AssetDepreciationLine, error)
}

type DeferralRecognizer interface {
	RecognizeDue(ctx context.Context, organizationID *uint64, asOf time.Time) (int, error)
}

type KpiSummarizer interface {
	RefreshPeriod(ctx context.Context, organizationID, periodID uint64) (int, error)
}
