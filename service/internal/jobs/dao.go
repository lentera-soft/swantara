package jobs

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"gorm.io/gorm"
)

type JobRunDAO interface {
	dao.CRUD[JobRun]
	HasRunning(ctx context.Context, jobType string) (bool, error)
}

type jobRunDAO struct {
	dao.Base[JobRun]
	db *gorm.DB
}

func NewJobRunDAO(db *gorm.DB) JobRunDAO {
	return jobRunDAO{Base: dao.NewBase[JobRun](db), db: db}
}

func (d jobRunDAO) HasRunning(ctx context.Context, jobType string) (bool, error) {
	var count int64
	if err := d.db.WithContext(ctx).Model(&JobRun{}).
		Where("job_type = ? AND status = ?", jobType, StatusRunning).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
