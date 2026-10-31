package manufacturing

import (
	"context"

	"github.com/jalusw/swantara/apps/service/internal/kernel/scope"
)

type RoutingService struct {
	recipes RecipeDAO
	steps   ProductionStepDAO
}

func NewRoutingService(recipes RecipeDAO, steps ProductionStepDAO) RoutingService {
	return RoutingService{recipes: recipes, steps: steps}
}

func (s RoutingService) ListInOrg(ctx context.Context, recipeID, organizationID uint64) ([]*ProductionStep, error) {
	if _, err := s.recipeInOrg(ctx, recipeID, organizationID); err != nil {
		return nil, err
	}
	return s.steps.ListByRecipe(ctx, recipeID)
}

func (s RoutingService) CreateInOrg(ctx context.Context, recipeID, organizationID uint64, step *ProductionStep) (*ProductionStep, error) {
	if _, err := s.recipeInOrg(ctx, recipeID, organizationID); err != nil {
		return nil, err
	}
	if err := validateRoutingStep(step); err != nil {
		return nil, err
	}
	step.RecipeID = &recipeID
	return s.steps.Create(ctx, step)
}

func (s RoutingService) UpdateInOrg(ctx context.Context, recipeID, stepID, organizationID uint64, step *ProductionStep) (*ProductionStep, error) {
	if _, err := s.recipeInOrg(ctx, recipeID, organizationID); err != nil {
		return nil, err
	}
	existing, err := s.steps.Find(ctx, stepID)
	if err != nil {
		return nil, err
	}
	if existing == nil || existing.RecipeID == nil || *existing.RecipeID != recipeID {
		return nil, ErrRoutingStepNotFound
	}
	if err := validateRoutingStep(step); err != nil {
		return nil, err
	}
	existing.WorkCenterID = step.WorkCenterID
	existing.Name = step.Name
	existing.Sequence = step.Sequence
	existing.SetupMinutes = step.SetupMinutes
	existing.TimeMinutes = step.TimeMinutes
	return s.steps.Update(ctx, existing)
}

func (s RoutingService) DeleteInOrg(ctx context.Context, recipeID, stepID, organizationID uint64) error {
	if _, err := s.recipeInOrg(ctx, recipeID, organizationID); err != nil {
		return err
	}
	existing, err := s.steps.Find(ctx, stepID)
	if err != nil {
		return err
	}
	if existing == nil || existing.RecipeID == nil || *existing.RecipeID != recipeID {
		return ErrRoutingStepNotFound
	}
	return s.steps.Delete(ctx, stepID)
}

func (s RoutingService) recipeInOrg(ctx context.Context, recipeID, organizationID uint64) (*Recipe, error) {
	recipe, err := s.recipes.Find(ctx, recipeID)
	if err != nil {
		return nil, err
	}
	if recipe == nil || !scope.Owns(recipe.OrganizationID, organizationID) {
		return nil, ErrRecipeNotFound
	}
	return recipe, nil
}

func validateRoutingStep(step *ProductionStep) error {
	if step.WorkCenterID == nil || *step.WorkCenterID == 0 {
		return ErrRoutingWorkCenter
	}
	if step.Name == nil || *step.Name == "" {
		return ErrRoutingName
	}
	if step.Sequence < 0 {
		return ErrRoutingSequence
	}
	if step.SetupMinutes < 0 || step.TimeMinutes < 0 {
		return ErrRoutingMinutes
	}
	return nil
}
