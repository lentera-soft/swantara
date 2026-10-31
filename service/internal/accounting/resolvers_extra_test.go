package accounting

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/jalusw/swantara/apps/service/internal/kernel/model"
	"github.com/jalusw/swantara/apps/service/internal/kernel/query"
	"github.com/jalusw/swantara/apps/service/internal/reference"
)

type configListMock struct {
	list func(ctx context.Context, q *query.Query) (*query.Page[reference.SystemConfig], error)
}

func (m configListMock) List(ctx context.Context, q *query.Query) (*query.Page[reference.SystemConfig], error) {
	if m.list != nil {
		return m.list(ctx, q)
	}
	return &query.Page[reference.SystemConfig]{Items: []*reference.SystemConfig{}}, nil
}

func configValue(orgID *uint64, key string, value string) *reference.SystemConfig {
	return &reference.SystemConfig{
		Base:           model.Base{ID: 1},
		OrganizationID: orgID,
		Key:            key,
		Value:          json.RawMessage(value),
	}
}

func TestAdvanceAccountResolver_Configured(t *testing.T) {
	orgID := uint64(10)
	configs := configListMock{list: func(_ context.Context, q *query.Query) (*query.Page[reference.SystemConfig], error) {
		if len(q.Filters) != 1 || q.Filters[0].Value != configCustomerAdvanceAccountID {
			t.Fatalf("unexpected filters: %+v", q.Filters)
		}
		return &query.Page[reference.SystemConfig]{Items: []*reference.SystemConfig{
			configValue(nil, "other.key", `7`),
			configValue(&orgID, configCustomerAdvanceAccountID, `42`),
		}}, nil
	}}
	resolver := NewAdvanceAccountResolver(configs, nil)
	got, err := resolver.CustomerAdvanceAccountID(context.Background(), orgID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 42 {
		t.Fatalf("account id = %d, want 42", got)
	}
}

func TestAdvanceAccountResolver_Fallback(t *testing.T) {
	orgID := uint64(10)
	configs := configListMock{list: func(_ context.Context, _ *query.Query) (*query.Page[reference.SystemConfig], error) {
		return &query.Page[reference.SystemConfig]{Items: []*reference.SystemConfig{
			configValue(&orgID, configSupplierAdvanceAccountID, `{}`),
			configValue(&orgID, configSupplierAdvanceAccountID, `0`),
			configValue(&orgID, configSupplierAdvanceAccountID, ``),
		}}, nil
	}}
	accounts := AccountLookupMock{ListFunc: func(_ context.Context, q *query.Query) (*query.Page[reference.Account], error) {
		return &query.Page[reference.Account]{Items: []*reference.Account{
			{Base: model.Base{ID: 1}, OrganizationID: orgID, Type: AccountTypePayable, Active: false},
			{Base: model.Base{ID: 2}, OrganizationID: orgID + 1, Type: AccountTypePayable, Active: true},
			{Base: model.Base{ID: 3}, OrganizationID: orgID, Type: AccountTypePayable, Active: true},
		}}, nil
	}}
	resolver := NewAdvanceAccountResolver(configs, accounts)
	got, err := resolver.SupplierAdvanceAccountID(context.Background(), orgID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != 3 {
		t.Fatalf("account id = %d, want 3", got)
	}
}

func TestAdvanceAccountResolver_NoAccounts(t *testing.T) {
	resolver := NewAdvanceAccountResolver(configListMock{}, nil)
	if _, err := resolver.CustomerAdvanceAccountID(context.Background(), 1); !errors.Is(err, ErrFxAccountNotFound) {
		t.Fatalf("err = %v, want ErrFxAccountNotFound", err)
	}
}

func TestAdvanceAccountResolver_PropagatesErrors(t *testing.T) {
	wantErr := errors.New("config failed")
	resolver := NewAdvanceAccountResolver(configListMock{list: func(_ context.Context, _ *query.Query) (*query.Page[reference.SystemConfig], error) {
		return nil, wantErr
	}}, AccountLookupMock{ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.Account], error) {
		return nil, wantErr
	}})
	if _, err := resolver.CustomerAdvanceAccountID(context.Background(), 1); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
}

func TestBankChargeResolver_ConfiguredAndFallback(t *testing.T) {
	orgID := uint64(10)
	configs := configListMock{list: func(_ context.Context, q *query.Query) (*query.Page[reference.SystemConfig], error) {
		key := q.Filters[0].Value
		if key == configBankFeeAccountID {
			return &query.Page[reference.SystemConfig]{Items: []*reference.SystemConfig{
				configValue(&orgID, configBankFeeAccountID, `55`),
			}}, nil
		}
		return &query.Page[reference.SystemConfig]{Items: []*reference.SystemConfig{}}, nil
	}}
	accounts := AccountLookupMock{ListFunc: func(_ context.Context, q *query.Query) (*query.Page[reference.Account], error) {
		if q.Filters[0].Value == AccountTypeIncome {
			return &query.Page[reference.Account]{Items: []*reference.Account{
				{Base: model.Base{ID: 77}, OrganizationID: orgID, Type: AccountTypeIncome, Active: true},
			}}, nil
		}
		return &query.Page[reference.Account]{Items: []*reference.Account{}}, nil
	}}
	resolver := NewBankChargeResolver(configs, accounts)

	fee, err := resolver.FeeAccountID(context.Background(), orgID)
	if err != nil || fee != 55 {
		t.Fatalf("fee = %d, err = %v; want 55, nil", fee, err)
	}
	interest, err := resolver.InterestAccountID(context.Background(), orgID)
	if err != nil || interest != 77 {
		t.Fatalf("interest = %d, err = %v; want 77, nil", interest, err)
	}
}

func TestBankChargeResolver_NoAccounts(t *testing.T) {
	resolver := NewBankChargeResolver(configListMock{}, nil)
	if _, err := resolver.FeeAccountID(context.Background(), 1); !errors.Is(err, ErrFxAccountNotFound) {
		t.Fatalf("err = %v, want ErrFxAccountNotFound", err)
	}
	if _, err := resolver.InterestAccountID(context.Background(), 1); !errors.Is(err, ErrFxAccountNotFound) {
		t.Fatalf("err = %v, want ErrFxAccountNotFound", err)
	}
}

func TestFxAccountResolver_GainConfigured(t *testing.T) {
	orgID := uint64(10)
	configs := configListMock{list: func(_ context.Context, q *query.Query) (*query.Page[reference.SystemConfig], error) {
		key := q.Filters[0].Value.(string)
		if key == configFxGainAccountID {
			return &query.Page[reference.SystemConfig]{Items: []*reference.SystemConfig{
				configValue(&orgID, configFxGainAccountID, `88`),
			}}, nil
		}
		return &query.Page[reference.SystemConfig]{Items: []*reference.SystemConfig{}}, nil
	}}
	id, err := NewFxAccountResolver(configs, nil).FxGainAccountID(context.Background(), orgID)
	if err != nil || id != 88 {
		t.Fatalf("id = %d, err = %v; want 88, nil", id, err)
	}
}

func TestFxAccountResolver_AliasFallback(t *testing.T) {
	orgID := uint64(10)
	otherOrg := orgID + 1
	configs := configListMock{list: func(_ context.Context, q *query.Query) (*query.Page[reference.SystemConfig], error) {
		key := q.Filters[0].Value.(string)
		if key == "reporting.fx_gain_loss_account_id" {
			return &query.Page[reference.SystemConfig]{Items: []*reference.SystemConfig{
				configValue(nil, "reporting.fx_gain_loss_account_id", `99`),
			}}, nil
		}
		return &query.Page[reference.SystemConfig]{Items: []*reference.SystemConfig{
			configValue(&orgID, key, `not-a-number`),
			configValue(&otherOrg, key, `123`),
			configValue(&orgID, key, `0`),
			configValue(&orgID, key, ``),
		}}, nil
	}}
	id, err := NewFxAccountResolver(configs, nil).FxLossAccountID(context.Background(), orgID)
	if err != nil || id != 99 {
		t.Fatalf("id = %d, err = %v; want 99, nil", id, err)
	}
}

func TestFxAccountResolver_FallbackByType(t *testing.T) {
	orgID := uint64(10)
	accounts := AccountLookupMock{ListFunc: func(_ context.Context, q *query.Query) (*query.Page[reference.Account], error) {
		if q.Filters[0].Value != AccountTypeExpense {
			t.Fatalf("type filter = %v", q.Filters[0].Value)
		}
		return &query.Page[reference.Account]{Items: []*reference.Account{
			{Base: model.Base{ID: 1}, OrganizationID: orgID + 1, Type: AccountTypeExpense, Active: true},
			{Base: model.Base{ID: 2}, OrganizationID: orgID, Type: AccountTypeExpense, Active: false},
			{Base: model.Base{ID: 3}, OrganizationID: orgID, Type: AccountTypeExpense, Active: true},
		}}, nil
	}}
	id, err := NewFxAccountResolver(configListMock{}, accounts).FxLossAccountID(context.Background(), orgID)
	if err != nil || id != 3 {
		t.Fatalf("id = %d, err = %v; want 3, nil", id, err)
	}
}

func TestFxAccountResolver_PropagatesLookupErrors(t *testing.T) {
	wantErr := errors.New("lookup failed")
	configs := configListMock{list: func(_ context.Context, _ *query.Query) (*query.Page[reference.SystemConfig], error) {
		return nil, wantErr
	}}
	accounts := AccountLookupMock{ListFunc: func(_ context.Context, _ *query.Query) (*query.Page[reference.Account], error) {
		return nil, wantErr
	}}
	if _, err := NewFxAccountResolver(configs, accounts).FxGainAccountID(context.Background(), 1); !errors.Is(err, wantErr) {
		t.Fatalf("err = %v, want %v", err, wantErr)
	}
}
