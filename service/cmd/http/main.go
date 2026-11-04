package main

import (
	"context"
	"log/slog"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v3"

	"github.com/jalusw/swantara/apps/service/internal/config"
	"github.com/jalusw/swantara/apps/service/internal/db"
	"github.com/jalusw/swantara/apps/service/internal/httpx"
	"github.com/jalusw/swantara/apps/service/internal/kernel/audit"
	auditHandler "github.com/jalusw/swantara/apps/service/internal/kernel/audit/handler"
	"github.com/jalusw/swantara/apps/service/internal/kernel/dao"
	"github.com/jalusw/swantara/apps/service/internal/kernel/sequence"
	"github.com/jalusw/swantara/apps/service/internal/logger"
	"github.com/jalusw/swantara/apps/service/internal/queue"
	"github.com/jalusw/swantara/apps/service/internal/seeders"
	"github.com/jalusw/swantara/apps/service/internal/storage"

	"github.com/jalusw/swantara/apps/service/internal/accounting"
	accountingHandler "github.com/jalusw/swantara/apps/service/internal/accounting/handler"
	"github.com/jalusw/swantara/apps/service/internal/asset"
	assetHandler "github.com/jalusw/swantara/apps/service/internal/asset/handler"
	"github.com/jalusw/swantara/apps/service/internal/commission"
	commissionHandler "github.com/jalusw/swantara/apps/service/internal/commission/handler"
	"github.com/jalusw/swantara/apps/service/internal/contacts"
	contactsHandler "github.com/jalusw/swantara/apps/service/internal/contacts/handler"
	"github.com/jalusw/swantara/apps/service/internal/crm"
	crmHandler "github.com/jalusw/swantara/apps/service/internal/crm/handler"
	"github.com/jalusw/swantara/apps/service/internal/crosscutting"
	crosscuttingHandler "github.com/jalusw/swantara/apps/service/internal/crosscutting/handler"
	"github.com/jalusw/swantara/apps/service/internal/expense"
	expenseHandler "github.com/jalusw/swantara/apps/service/internal/expense/handler"
	"github.com/jalusw/swantara/apps/service/internal/giftcard"
	giftcardHandler "github.com/jalusw/swantara/apps/service/internal/giftcard/handler"
	"github.com/jalusw/swantara/apps/service/internal/iam"
	"github.com/jalusw/swantara/apps/service/internal/iam/handler"
	"github.com/jalusw/swantara/apps/service/internal/inquiry"
	inquiryHandler "github.com/jalusw/swantara/apps/service/internal/inquiry/handler"
	"github.com/jalusw/swantara/apps/service/internal/interorganization"
	interorganizationHandler "github.com/jalusw/swantara/apps/service/internal/interorganization/handler"
	"github.com/jalusw/swantara/apps/service/internal/inventory"
	inventoryHandler "github.com/jalusw/swantara/apps/service/internal/inventory/handler"
	"github.com/jalusw/swantara/apps/service/internal/localization"
	localizationHandler "github.com/jalusw/swantara/apps/service/internal/localization/handler"
	"github.com/jalusw/swantara/apps/service/internal/manufacturing"
	manufacturingHandler "github.com/jalusw/swantara/apps/service/internal/manufacturing/handler"
	"github.com/jalusw/swantara/apps/service/internal/organization"
	organizationHandler "github.com/jalusw/swantara/apps/service/internal/organization/handler"
	"github.com/jalusw/swantara/apps/service/internal/payroll"
	payrollHandler "github.com/jalusw/swantara/apps/service/internal/payroll/handler"
	"github.com/jalusw/swantara/apps/service/internal/pos"
	posHandler "github.com/jalusw/swantara/apps/service/internal/pos/handler"
	"github.com/jalusw/swantara/apps/service/internal/procurement"
	procurementHandler "github.com/jalusw/swantara/apps/service/internal/procurement/handler"
	"github.com/jalusw/swantara/apps/service/internal/products"
	productsHandler "github.com/jalusw/swantara/apps/service/internal/products/handler"
	"github.com/jalusw/swantara/apps/service/internal/project"
	projectHandler "github.com/jalusw/swantara/apps/service/internal/project/handler"
	"github.com/jalusw/swantara/apps/service/internal/quality"
	qualityHandler "github.com/jalusw/swantara/apps/service/internal/quality/handler"
	"github.com/jalusw/swantara/apps/service/internal/reference"
	referenceHandler "github.com/jalusw/swantara/apps/service/internal/reference/handler"
	"github.com/jalusw/swantara/apps/service/internal/reporting"
	reportingHandler "github.com/jalusw/swantara/apps/service/internal/reporting/handler"
	"github.com/jalusw/swantara/apps/service/internal/returns"
	returnsHandler "github.com/jalusw/swantara/apps/service/internal/returns/handler"
	"github.com/jalusw/swantara/apps/service/internal/sales"
	salesHandler "github.com/jalusw/swantara/apps/service/internal/sales/handler"
	"github.com/jalusw/swantara/apps/service/internal/service"
	serviceHandler "github.com/jalusw/swantara/apps/service/internal/service/handler"
	"github.com/jalusw/swantara/apps/service/internal/subscription"
	subscriptionHandler "github.com/jalusw/swantara/apps/service/internal/subscription/handler"
	"github.com/jalusw/swantara/apps/service/internal/xtradata"
	xtradataHandler "github.com/jalusw/swantara/apps/service/internal/xtradata/handler"
)

// @title Swantara API Service
// @version 1.0.0
// @description REST API for the Swantara ERP platform.
// @description
// @description Authentication is via Bearer JWT — obtain a token from `POST /api/v1/auth/login` and send `Authorization: Bearer <token>` on subsequent requests.
// @description Most endpoints are multi-tenant and live under `/api/v1/organizations/{organization_id}`; the caller must have an active membership in the organization with the required permission.
// @description
// @description Conventions: paginated lists accept `page`, `size`, `sort`, `filter` and return `{data, meta}`; responses use a shared envelope `{success, message, data}` with a consistent error shape; mutating requests support `Idempotency-Key` for safe retries. See `GET /api/v1/health` for liveness and `/docs/index.html` for interactive documentation.
// @host localhost:8080
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description JWT access token. Format: "Bearer <token>".
func main() {
	cfg, err := config.New(config.ConfigPath(), config.ConfigFilename())
	if err != nil {
		logger.Fatalf("Failed to load configuration %v", err)
	}

	logger.Setup(cfg.ApplicationDebug, cfg.LogLevel, logger.Options{
		File:       cfg.LogFile,
		Format:     cfg.LogFormat,
		MaxSize:    cfg.LogMaxSize,
		MaxAge:     cfg.LogMaxAge,
		MaxBackups: cfg.LogMaxBackups,
		Compress:   cfg.LogCompress,
	})

	d, err := db.New(cfg)
	if err != nil {
		slog.Error("Failed to load database", "error", err)
	}

	if err := d.Use(audit.NewGormPlugin()); err != nil {
		slog.Error("Failed to register audit plugin", "error", err)
	}

	limiterStorage, err := httpx.NewRateLimiterStorage(cfg)
	if err != nil {
		slog.Warn("Rate limiter storage unavailable, using in-memory storage", "error", err)
	}

	app := httpx.NewApp(cfg, limiterStorage)
	httpx.RegisterDocs(app, cfg)
	httpx.SetResponseVersion(cfg.ApplicationVersion)
	httpx.SetLinkBaseURL(cfg.ApplicationURL)

	passwordSvc := iam.NewPasswordService(cfg)
	tokenSvc := iam.NewTokenService(cfg)
	queueClient := queue.NewQueueClient(cfg)

	seeder, err := seeders.New(d, passwordSvc)
	if err != nil {
		slog.Error("Failed to initialize seeder", "error", err)
	}

	objectStore, err := storage.NewStorageService(cfg)
	if err != nil {
		logger.Fatalf("Failed to initialize storage: %v", err)
	}

	userDAO := iam.NewUserDAO(d)
	userSessionDAO := iam.NewUserSessionDAO(d)
	userEmailVerificationDAO := iam.NewUserEmailVerificationDAO(d)
	userPasswordResetDAO := iam.NewUserPasswordResetDAO(d)
	userOAuthIdentityDAO := iam.NewUserOAuthIdentityDAO(d)
	permissionDAO := iam.NewPermissionDAO(d)
	memberDAO := iam.NewMemberDAO(d)
	memberRoleDAO := iam.NewMemberRoleDAO(d)
	organizationDAO := dao.NewBase[reference.Organization](d)
	currencyDAO := dao.NewBase[reference.Currency](d)
	countryDAO := dao.NewBase[reference.Country](d)
	fxRateDAO := dao.NewBase[reference.FxRate](d)
	unitGroupDAO := dao.NewBase[reference.UnitGroup](d)
	uomDAO := dao.NewBase[reference.Unit](d)
	paymentTermDAO := reference.NewPaymentTermDAO(d)
	accountDAO := dao.NewBase[reference.Account](d)
	journalDAO := dao.NewBase[reference.Journal](d)
	dimensionDAO := dao.NewBase[reference.Dimension](d)
	taxDAO := dao.NewBase[reference.Tax](d)
	taxYearDAO := dao.NewBase[reference.TaxYear](d)
	itemCategoryDAO := dao.NewBase[reference.ItemCategory](d)
	crmStageDAO := dao.NewBase[reference.PipelineStage](d)
	salesTeamDAO := dao.NewBase[reference.SalesGroup](d)
	carrierDAO := dao.NewBase[reference.Carrier](d)
	campaignDAO := dao.NewBase[reference.Campaign](d)
	departmentDAO := dao.NewBase[reference.Department](d)
	jobPositionDAO := dao.NewBase[reference.JobPosition](d)
	workCenterDAO := dao.NewBase[reference.WorkCenter](d)
	leaveTypeDAO := dao.NewBase[reference.LeaveType](d)
	salaryRuleDAO := dao.NewBase[reference.SalaryRule](d)
	assetCategoryDAO := dao.NewBase[reference.AssetCategory](d)
	posConfigDAO := dao.NewBase[reference.POSConfig](d)
	expenseCategoryDAO := dao.NewBase[reference.ExpenseCategory](d)
	subscriptionPlanDAO := dao.NewBase[reference.SubscriptionPlan](d)
	systemConfigDAO := dao.NewBase[reference.SystemConfig](d)
	journalEntryDAO := accounting.NewJournalEntryDAO(d)
	sequenceSvc := sequence.NewService(sequence.NewDAO(d))
	contactDAO := contacts.NewContactDAO(d)
	contactAddressDAO := contacts.NewContactAddressDAO(d)
	contactBankAccountDAO := contacts.NewContactBankAccountDAO(d)
	customerProfileDAO := contacts.NewCustomerProfileDAO(d)
	supplierProfileDAO := contacts.NewSupplierProfileDAO(d)
	orgSystemConfigDAO := xtradata.NewSystemConfigDAO(d)
	orgIdempotencyKeyDAO := xtradata.NewIdempotencyKeyDAO(d)
	orgLocalizerDAO := localization.NewOrganizationLocalizer(d)
	localizationProfileDAO := localization.NewProfileDAO(d)
	taxTemplateLineDAO := localization.NewTaxTemplateLineDAO(d)
	webhookSubscriptionDAO := xtradata.NewWebhookSubscriptionDAO(d)
	webhookDeliveryDAO := xtradata.NewWebhookDeliveryDAO(d)
	integrationEventDAO := xtradata.NewIntegrationEventDAO(d)
	contactInquiryDAO := inquiry.NewContactInquiryDAO(d)
	itemDAO := products.NewItemDAO(d)
	itemVariantDAO := products.NewItemVariantDAO(d)
	priceBookDAO := products.NewPriceBookDAO(d)
	priceBookRuleDAO := products.NewPriceRuleDAO(d)
	auditLogDAO := audit.NewLogDAO(d)
	supplierProductDAO := products.NewSupplierProductDAO(d)
	recipeDAO := manufacturing.NewRecipeDAO(d)
	recipeLineDAO := manufacturing.NewRecipeLineDAO(d)
	routingOperationDAO := manufacturing.NewProductionStepDAO(d)
	journalEntryLineDAO := accounting.NewJournalLineDAO(d)
	taxPeriodDAO := accounting.NewTaxPeriodDAO(d)
	periodCloseDAO := accounting.NewPeriodCloseDAO(d)
	invoiceDAO := accounting.NewInvoiceDAO(d)
	invoiceLineDAO := accounting.NewInvoiceLineDAO(d)
	invoiceTaxDAO := accounting.NewInvoiceTaxDAO(d)
	paymentDAO := accounting.NewPaymentDAO(d)
	paymentAllocationDAO := accounting.NewPaymentAllocationDAO(d)
	bankStatementDAO := accounting.NewBankStatementDAO(d)
	bankStatementLineDAO := accounting.NewBankStatementLineDAO(d)
	partialReconcileDAO := accounting.NewAccountPartialReconcileDAO(d)
	fullReconcileDAO := accounting.NewAccountFullReconcileDAO(d)
	reminderLevelDAO := accounting.NewReminderLevelDAO(d)
	reminderActionDAO := accounting.NewReminderActionDAO(d)
	budgetDAO := accounting.NewBudgetDAO(d)
	budgetLineDAO := accounting.NewBudgetLineDAO(d)
	budgetQueryDAO := accounting.NewBudgetQueryDAO(d)
	taxRuleDAO := accounting.NewTaxRuleDAO(d)
	taxRuleTaxMapDAO := accounting.NewTaxRuleTaxMapDAO(d)
	taxRuleAccountMapDAO := accounting.NewTaxRuleAccountMapDAO(d)
	invoiceInstallmentDAO := accounting.NewInvoiceInstallmentDAO(d)
	invoiceCreditApplicationDAO := accounting.NewInvoiceCreditApplicationDAO(d)
	invoiceContraSettlementDAO := accounting.NewInvoiceContraSettlementDAO(d)
	downPaymentLinkDAO := accounting.NewDownPaymentLinkDAO(d)
	withholdingTaxDAO := accounting.NewWithholdingTaxDAO(d)
	taxReturnDAO := accounting.NewTaxReturnDAO(d)
	trialBalanceDAO := accounting.NewTrialBalanceDAO(d)
	cashFlowDAO := accounting.NewCashFlowDAO(d)
	equityDAO := accounting.NewEquityDAO(d)
	generalLedgerDAO := accounting.NewGeneralLedgerDAO(d)
	pdcInstrumentDAO := accounting.NewPdcInstrumentDAO(d)
	reconcileRuleDAO := accounting.NewReconcileRuleDAO(d)
	reconcileRuleMatchDAO := accounting.NewReconcileRuleMatchDAO(d)
	warehouseDAO := inventory.NewWarehouseDAO(d)
	stockLocationDAO := inventory.NewStockLocationDAO(d)
	stockMovementDAO := inventory.NewStockMovementDAO(d)
	stockShipmentDAO := inventory.NewShipmentDAO(d)
	stockQuantDAO := inventory.NewStockBalanceDAO(d)
	stockLotDAO := inventory.NewBatchDAO(d)
	stockReservationDAO := inventory.NewStockHoldDAO(d)
	stockCostLayerDAO := inventory.NewCostLayerDAO(d)
	reorderRuleDAO := inventory.NewReorderRuleDAO(d)
	inventoryCountDAO := inventory.NewStockCountDAO(d)
	inventoryCountLineDAO := inventory.NewStockCountLineDAO(d)
	transferOrderDAO := inventory.NewWarehouseTransferDAO(d)
	moDAO := manufacturing.NewProductionOrderDAO(d)
	consumedMaterialDAO := manufacturing.NewConsumedMaterialDAO(d)
	workOrderDAO := manufacturing.NewShopTaskDAO(d)
	crmLeadDAO := crm.NewProspectDAO(d)
	crmActivityDAO := crm.NewProspectActivityDAO(d)
	crmHistoryDAO := crm.NewStageHistoryDAO(d)
	crmProspectContactDAO := crm.NewProspectContactDAO(d)
	saleOrderDAO := sales.NewSaleOrderDAO(d)
	saleOrderLineDAO := sales.NewSaleOrderLineDAO(d)
	saleQuoteDAO := sales.NewSaleQuoteDAO(d)
	saleQuoteLineDAO := sales.NewSaleQuoteLineDAO(d)
	saleContactDAO := contactDAO
	approvalRequestDAO := crosscutting.NewApprovalRequestDAO(d)
	approvalStepDAO := crosscutting.NewApprovalStepDAO(d)
	posSessionDAO := pos.NewPOSSessionDAO(d)
	posOrderDAO := pos.NewPOSOrderDAO(d)
	posOrderLineDAO := pos.NewPOSOrderLineDAO(d)
	posPaymentDAO := pos.NewPOSPaymentDAO(d)
	posPaymentAccountDAO := dao.NewBase[reference.POSPaymentAccount](d)
	couponDAO := giftcard.NewCouponDAO(d)
	attachmentDAO := crosscutting.NewAttachmentDAO(d)
	messageDAO := crosscutting.NewMessageDAO(d)
	qualityPointDAO := quality.NewQualityPointDAO(d)
	qualityCheckDAO := quality.NewQualityCheckDAO(d)
	qualityAlertDAO := quality.NewQualityAlertDAO(d)
	purchaseRequestDAO := procurement.NewPurchaseRequestDAO(d)
	purchaseRequestLineDAO := procurement.NewPurchaseRequestLineDAO(d)
	purchaseOrderDAO := procurement.NewPurchaseOrderDAO(d)
	purchaseOrderLineDAO := procurement.NewPurchaseOrderLineDAO(d)
	purchaseRFQDAO := procurement.NewSupplierQuoteRequestDAO(d)
	purchaseRFQLineDAO := procurement.NewSupplierQuoteRequestLineDAO(d)
	purchaseRFQQuoteDAO := procurement.NewSupplierQuoteDAO(d)
	purchaseRFQQuoteLineDAO := procurement.NewSupplierQuoteLineDAO(d)
	supplyAgreementDAO := procurement.NewSupplyAgreementDAO(d)
	supplyAgreementLineDAO := procurement.NewSupplyAgreementLineDAO(d)
	purchaseCreditMemoDAO := procurement.NewPurchaseCreditMemoDAO(d)
	purchaseDebitMemoDAO := procurement.NewPurchaseDebitMemoDAO(d)
	purchasePaymentBatchDAO := procurement.NewPaymentBatchDAO(d)
	purchasePaymentBatchLineDAO := procurement.NewPaymentBatchLineDAO(d)
	costCenterDAO := procurement.NewCostCenterDAO(d)
	vendorScorecardDAO := procurement.NewSupplierScorecardDAO(d)
	mrpRunDAO := manufacturing.NewPlanningRunDAO(d)
	mrpDemandDAO := manufacturing.NewPlanningNeedDAO(d)
	mrpPlannedOrderDAO := manufacturing.NewPlannedSupplyDAO(d)
	demandForecastDAO := manufacturing.NewDemandPlanDAO(d)
	subcontractOrderDAO := manufacturing.NewOutsideProcessingOrderDAO(d)
	rmaDAO := returns.NewRMADAO(d)
	rmaLineDAO := returns.NewRMALineDAO(d)
	employeeDAO := payroll.NewEmployeeDAO(d)
	contractDAO := payroll.NewEmploymentContractDAO(d)
	leaveDAO := payroll.NewLeaveRequestDAO(d)
	attendanceDAO := payroll.NewAttendanceDAO(d)
	timesheetDAO := payroll.NewTimesheetDAO(d)
	shiftDAO := payroll.NewShiftDAO(d)
	shiftAssignmentDAO := payroll.NewShiftAssignmentDAO(d)
	payrollRunDAO := payroll.NewPayrollRunDAO(d)
	payslipDAO := payroll.NewPayslipDAO(d)
	payslipLineDAO := payroll.NewPayslipLineDAO(d)
	projectDAO := project.NewProjectDAO(d)
	projectTaskDAO := project.NewProjectTaskDAO(d)
	projectMilestoneDAO := project.NewProjectMilestoneDAO(d)
	projectInvoiceLineDAO := project.NewProjectInvoiceLineDAO(d)
	expenseReportDAO := expense.NewExpenseReportDAO(d)
	expenseLineDAO := expense.NewExpenseLineDAO(d)
	inboundCostDAO := inventory.NewInboundCostDAO(d)
	inboundCostLineDAO := inventory.NewInboundCostLineDAO(d)
	inboundCostAdjustmentDAO := inventory.NewInboundCostAdjustmentDAO(d)
	assetDAO := asset.NewFixedAssetDAO(d)
	assetDepreciationLineDAO := asset.NewAssetDepreciationLineDAO(d)
	deferredScheduleDAO := accounting.NewDeferredScheduleDAO(d)
	deferredScheduleLineDAO := accounting.NewDeferredScheduleLineDAO(d)
	paymentBatchDAO := accounting.NewPaymentBatchDAO(d)
	paymentBatchLineDAO := accounting.NewPaymentBatchLineDAO(d)
	subscriptionDAO := subscription.NewSubscriptionDAO(d)
	subscriptionLineDAO := subscription.NewSubscriptionLineDAO(d)
	commissionPlanDAO := commission.NewCommissionPlanDAO(d)
	commissionRuleDAO := commission.NewCommissionRuleDAO(d)
	commissionAssignmentDAO := commission.NewCommissionAssignmentDAO(d)
	commissionEntryDAO := commission.NewCommissionEntryDAO(d)
	giftCardDAO := giftcard.NewGiftCardDAO(d)
	giftCardTransactionDAO := giftcard.NewGiftCardTransactionDAO(d)
	equipmentDAO := service.NewEquipmentDAO(d)
	serviceContractDAO := service.NewServiceContractDAO(d)
	serviceOrderDAO := service.NewServiceOrderDAO(d)
	serviceOrderLineDAO := service.NewServiceOrderLineDAO(d)
	maintenancePlanDAO := service.NewMaintenancePlanDAO(d)
	dropshipLinkDAO := interorganization.NewDropshipLinkDAO(d)
	interorgRuleDAO := interorganization.NewInterorganizationRuleDAO(d)
	interorgTransactionDAO := interorganization.NewInterorganizationTransactionDAO(d)
	consolidationRunDAO := interorganization.NewConsolidationRunDAO(d)
	consolidationEliminationDAO := interorganization.NewConsolidationEliminationDAO(d)
	accountBalanceDAO := accounting.NewAccountBalanceDAO(d)
	reportDAO := reporting.NewReportDAO(d)
	fxRevaluationDAO := reporting.NewFxRevaluationDAO(d)
	fxRevaluationLineDAO := reporting.NewFxRevaluationLineDAO(d)
	accrualDAO := reporting.NewAccrualDAO(d)
	accrualLineDAO := reporting.NewAccrualLineDAO(d)
	kpiSummaryDAO := reporting.NewKpiSummaryDAO(d)
	leadToCashDAO := reporting.NewLeadToCashDAO(d)

	memberSvc := iam.NewMemberService(
		memberDAO,
		memberRoleDAO,
		permissionDAO,
	)
	organizationSvc := organization.NewOrganizationService(
		organizationDAO,
		currencyDAO,
		countryDAO,
		memberSvc,
		seeder,
	).WithProvisionEnqueuer(queueClient)
	fxRateSvc := reference.NewFxRateService(fxRateDAO, currencyDAO)
	countrySvc := reference.NewCountryService(countryDAO)
	uomSvc := reference.NewUnitService(unitGroupDAO, uomDAO)
	paymentTermSvc := reference.NewPaymentTermService(paymentTermDAO)
	dimensionSvc := reference.NewDimensionService(dimensionDAO)
	accountSvc := reference.NewAccountService(accountDAO)
	journalSvc := reference.NewJournalService(journalDAO, accountDAO)
	taxSvc := reference.NewTaxService(taxDAO, accountDAO)
	taxYearSvc := reference.NewTaxYearService(taxYearDAO)
	campaignSvc := reference.NewCampaignService(campaignDAO)
	contactSvc := contacts.NewContactService(
		contactDAO,
		contactAddressDAO,
		contactBankAccountDAO,
		customerProfileDAO,
		supplierProfileDAO,
		employeeDAO,
	).WithSequences(sequenceSvc)
	contactAvatarSvc := contacts.NewContactAvatarService(contactDAO, objectStore)
	configSvc := xtradata.NewConfigService(orgSystemConfigDAO)
	idemSvc := xtradata.NewIdempotencyService(orgIdempotencyKeyDAO)
	integrationEventSvc := xtradata.NewEventService(integrationEventDAO, nil)
	webhoookSvc := xtradata.NewWebhookService(webhookSubscriptionDAO, webhookDeliveryDAO)
	userSvc := iam.NewUserService(userDAO, passwordSvc)
	authSvc := iam.NewAuthService(
		userDAO,
		userSvc,
		userSessionDAO,
		passwordSvc,
		tokenSvc,
		userEmailVerificationDAO,
		userPasswordResetDAO,
		queueClient,
		cfg.AuthEmailVerifyTTLDuration,
		cfg.AuthPasswordResetTTLDuration,
	)
	localizationProfileSvc := localization.NewProfileService(
		localizationProfileDAO,
		taxTemplateLineDAO,
		orgLocalizerDAO,
	)
	authzSvc := iam.NewAuthzService(permissionDAO)
	avatarSvc := iam.NewAvatarService(userDAO, objectStore)

	var oauthProviders []iam.OAuthProvider
	if cfg.GoogleClientID != "" {
		oauthProviders = append(oauthProviders, iam.NewGoogleProvider(cfg))
	}
	if cfg.FacebookAppID != "" {
		oauthProviders = append(oauthProviders, iam.NewFacebookProvider(cfg))
	}
	oauthSvc := iam.NewOAuthService(userDAO, userSvc, userOAuthIdentityDAO, userSessionDAO, passwordSvc, tokenSvc, oauthProviders...)

	contactInquirySvc := inquiry.NewContactInquiryService(contactInquiryDAO)
	productSvc := products.NewProductService(
		itemDAO,
		itemVariantDAO,
		itemCategoryDAO,
		priceBookDAO,
		priceBookRuleDAO,
	)
	webhookDeliverer := xtradata.NewWebhookDeliverer(
		webhookSubscriptionDAO,
		webhookDeliveryDAO,
		nil,
	)
	fxRateSource := reference.NewFxRateSource(fxRateDAO)
	auditLogSvc := audit.NewAuditLogService(auditLogDAO)
	carrierSvc := reference.NewCarrierService(carrierDAO, itemVariantDAO)
	supplierProductSvc := products.NewSupplierProductService(
		itemVariantDAO,
		itemDAO,
		supplierProductDAO,
		contactDAO,
		supplierProfileDAO,
	)
	bomSvc := manufacturing.NewRecipeService(itemVariantDAO, recipeDAO, recipeLineDAO)
	routingSvc := manufacturing.NewRoutingService(recipeDAO, routingOperationDAO)
	taxPeriodSvc := accounting.NewTaxPeriodService(taxPeriodDAO, taxYearDAO).WithCloseGuard(periodCloseDAO)
	reversalEngine := accounting.NewReversalEngine(journalEntryDAO, journalEntryLineDAO).WithPeriods(taxPeriodSvc)
	postingSvc := accounting.NewPostingService(journalEntryDAO).WithPeriods(taxPeriodSvc).WithReverser(reversalEngine).WithLines(journalEntryLineDAO).WithAccounts(accountDAO).WithSequences(sequenceSvc)
	productAdapter := accounting.NewProductAdapter(itemVariantDAO, itemDAO)
	paymentTermAdapter := accounting.NewPaymentTermAdapter(paymentTermDAO)
	fxAccountResolver := accounting.NewFxAccountResolver(systemConfigDAO, accountDAO)
	advanceAccountResolver := accounting.NewAdvanceAccountResolver(systemConfigDAO, accountDAO)
	bankChargeResolver := accounting.NewBankChargeResolver(systemConfigDAO, accountDAO)
	invoiceSvc := accounting.NewInvoiceService(invoiceDAO, invoiceLineDAO, invoiceTaxDAO, postingSvc, accountDAO, taxDAO, sequenceSvc, db.NewDBTransactioner(d)).WithProducts(productAdapter, itemCategoryDAO).WithCurrencyResolvers(organizationDAO, fxRateSource).WithPaymentTerms(paymentTermAdapter)
	paymentSvc := accounting.NewPaymentService(paymentDAO, invoiceDAO, postingSvc, accountDAO, journalDAO, sequenceSvc, db.NewDBTransactioner(d)).WithFxResolvers(fxRateSource, fxAccountResolver).WithOrganizations(organizationDAO).WithAdvanceAccounts(advanceAccountResolver).WithAllocations(paymentAllocationDAO)
	bankStatementSvc := accounting.NewBankStatementService(bankStatementDAO, bankStatementLineDAO, paymentDAO, journalDAO, db.NewDBTransactioner(d)).WithPosting(postingSvc, bankChargeResolver)
	reconcileSvc := accounting.NewReconcileService(journalEntryLineDAO, partialReconcileDAO, fullReconcileDAO, journalEntryDAO, db.NewDBTransactioner(d))
	reminderSvc := accounting.NewReminderService(invoiceDAO, reminderLevelDAO, reminderActionDAO, db.NewDBTransactioner(d)).WithSender(queueClient)
	budgetSvc := accounting.NewBudgetService(budgetDAO, budgetLineDAO, budgetQueryDAO, db.NewDBTransactioner(d))
	contactCreditAdapter := accounting.NewContactCreditAdapter(customerProfileDAO)
	taxRuleResolver := accounting.NewTaxRuleResolver(taxRuleDAO, taxRuleTaxMapDAO, taxRuleAccountMapDAO, db.NewDBTransactioner(d))
	invoiceSvc = invoiceSvc.WithTaxRules(taxRuleResolver).WithInstallments(invoiceInstallmentDAO).WithSettlements(invoiceCreditApplicationDAO, invoiceContraSettlementDAO).WithDownPayments(downPaymentLinkDAO).WithCreditLimits(contactCreditAdapter)
	withholdingSvc := accounting.NewWithholdingService(withholdingTaxDAO, postingSvc, db.NewDBTransactioner(d))
	taxReturnSvc := accounting.NewTaxReturnService(taxReturnDAO, taxPeriodDAO, invoiceTaxDAO, db.NewDBTransactioner(d)).WithSettlement(postingSvc, journalDAO, accountDAO)
	trialBalanceSvc := accounting.NewTrialBalanceService(trialBalanceDAO, taxPeriodDAO).WithAccounts(accountDAO)
	cashFlowSvc := accounting.NewCashFlowService(cashFlowDAO)
	equitySvc := accounting.NewEquityService(equityDAO, taxPeriodDAO)
	integritySvc := accounting.NewReportIntegrityService(trialBalanceDAO, cashFlowDAO, equityDAO, taxPeriodDAO, accountDAO)
	generalLedgerSvc := accounting.NewGeneralLedgerService(generalLedgerDAO)
	pdcSvc := accounting.NewPdcService(pdcInstrumentDAO, paymentSvc, db.NewDBTransactioner(d))
	reconcileRuleEngine := accounting.NewReconcileRuleEngine(reconcileRuleDAO, reconcileRuleMatchDAO, journalEntryLineDAO, partialReconcileDAO)
	productResolver := inventory.NewItemResolver(itemVariantDAO, itemDAO, itemCategoryDAO)
	warehouseSvc := inventory.NewWarehouseService(warehouseDAO, stockLocationDAO)
	ledgerSvc := inventory.NewLedgerService(stockMovementDAO, stockQuantDAO, stockLocationDAO, db.NewDBTransactioner(d))
	valuationSvc := inventory.NewValuationService(stockMovementDAO, stockCostLayerDAO, stockLocationDAO, productResolver, postingSvc, db.NewDBTransactioner(d))
	reservationSvc := inventory.NewHoldService(stockReservationDAO, stockQuantDAO)
	lotSvc := inventory.NewBatchService(stockLotDAO, productResolver)
	reorderSvc := inventory.NewReorderService(reorderRuleDAO, ledgerSvc, productResolver)
	countSvc := inventory.NewStockCountService(inventoryCountDAO, inventoryCountLineDAO, stockQuantDAO, stockCostLayerDAO, ledgerSvc, productResolver, postingSvc, db.NewDBTransactioner(d))
	transferSvc := inventory.NewTransferService(transferOrderDAO, stockMovementDAO, stockLocationDAO, warehouseDAO, stockCostLayerDAO, ledgerSvc, productResolver, postingSvc, db.NewDBTransactioner(d))
	stockSvc := inventory.NewStockService(stockMovementDAO, stockShipmentDAO, stockQuantDAO)
	moSvc := manufacturing.NewProductionOrderService(moDAO, consumedMaterialDAO, recipeDAO, bomSvc, itemVariantDAO, stockLocationDAO, reservationSvc, sequenceSvc)
	productionSvc := manufacturing.NewProductionService(moDAO, consumedMaterialDAO, workOrderDAO, routingOperationDAO, workCenterDAO, stockLocationDAO, ledgerSvc, valuationSvc, productResolver, postingSvc, journalEntryLineDAO, reservationSvc, sequenceSvc)
	leadSvc := crm.NewProspectService(crmLeadDAO, crmStageDAO, salesTeamDAO, contactDAO).
		WithStageHistory(crmHistoryDAO).
		WithBuyingCommittee(crmProspectContactDAO).
		WithConfigs(systemConfigDAO).
		WithMembers(memberDAO).
		WithPermissions(permissionDAO)
	activitySvc := crm.NewProspectActivityService(crmActivityDAO, crmLeadDAO, contactDAO).
		WithStageHistory(crmHistoryDAO)
	pipelineSvc := crm.NewPipelineService(crmLeadDAO, crmStageDAO).
		WithConfigs(systemConfigDAO).
		WithStageHistory(crmHistoryDAO).
		WithUsers(userDAO)
	contactInquirySvc = contactInquirySvc.WithLeadCreator(leadSvc)
	saleOrderSvc := sales.NewSaleOrderService(
		sales.SaleOrderRepositories{
			Orders:       saleOrderDAO,
			Lines:        saleOrderLineDAO,
			Quotes:       saleQuoteDAO,
			QuoteLines:   saleQuoteLineDAO,
			PriceBooks:   priceBookDAO,
			Taxes:        taxDAO,
			Contacts:     saleContactDAO,
			Leads:        crmLeadDAO,
			Stages:       crmStageDAO,
			Warehouses:   warehouseDAO,
			Locations:    stockLocationDAO,
			Quants:       stockQuantDAO,
			Shipments:    stockShipmentDAO,
			Movements:    stockMovementDAO,
			Reservations: stockReservationDAO,
		},
		sales.SaleOrderEngines{
			Sequences:      sequenceSvc,
			Product:        productSvc,
			ReservationSvc: reservationSvc,
			Ship:           valuationSvc,
			Invoices:       invoiceSvc,
			OpenInvoices:   invoiceDAO,
			Payments:       paymentSvc,
		},
	)
	saleQuoteSvc := sales.NewSaleQuoteService(
		sales.SaleQuoteRepositories{
			Quotes:     saleQuoteDAO,
			Lines:      saleQuoteLineDAO,
			PriceBooks: priceBookDAO,
			Taxes:      taxDAO,
			Contacts:   saleContactDAO,
			Leads:      crmLeadDAO,
		},
		sales.SaleQuoteEngines{
			Sequences: sequenceSvc,
			Product:   productSvc,
		},
	)
	saleApprovalSvc := crosscutting.NewApprovalService(
		approvalRequestDAO,
		approvalStepDAO,
		db.NewDBTransactioner(d),
	)
	salesConfigSource := sales.NewSystemConfigSource(systemConfigDAO)
	saleControls := sales.SalesControls{
		Customers: customerProfileDAO,
		Invoices:  invoiceDAO,
		Approvals: saleApprovalSvc,
		Configs:   salesConfigSource,
	}
	saleOrderSvc = saleOrderSvc.WithControls(saleControls)
	saleQuoteSvc = saleQuoteSvc.WithControls(saleControls)
	couponSvc := giftcard.NewCouponService(couponDAO, db.NewDBTransactioner(d))
	posSvc := pos.NewPOSService(
		pos.POSRepositories{
			Configs:   posConfigDAO,
			Sessions:  posSessionDAO,
			Orders:    posOrderDAO,
			Lines:     posOrderLineDAO,
			Payments:  posPaymentDAO,
			Taxes:     taxDAO,
			Journals:  journalDAO,
			Locations: stockLocationDAO,
			Quants:    stockQuantDAO,
			Movements: stockMovementDAO,
			Layers:    stockCostLayerDAO,
			Shipments: stockShipmentDAO,
			Members:   memberDAO,
		},
		pos.POSEngines{
			Product:    productSvc,
			Accounts:   accountDAO,
			PayMethods: posPaymentAccountDAO,
			Valuer:     valuationSvc,
			Invoice:    invoiceSvc,
			Poster:     postingSvc,
			Sequences:  sequenceSvc,
			Tx:         db.NewDBTransactioner(d),
			Coupons:    couponSvc,
		},
	)
	posPaymentAccountSvc := pos.NewPaymentAccountService(posPaymentAccountDAO)
	approvalSvc := crosscutting.NewApprovalService(approvalRequestDAO, approvalStepDAO, db.NewDBTransactioner(d))
	attachmentSvc := crosscutting.NewAttachmentService(attachmentDAO, objectStore)
	messageSvc := crosscutting.NewMessageService(messageDAO)
	qualitySvc := quality.NewQualityCheckService(qualityPointDAO, qualityCheckDAO, qualityAlertDAO)
	scrapRouter := inventory.NewScrapRouter(stockShipmentDAO, stockMovementDAO, stockLocationDAO, valuationSvc)
	qualitySvc = qualitySvc.WithScrapRouter(scrapRouter)
	purchaseConfigSource := procurement.NewSystemConfigSource(systemConfigDAO)
	purchaseRequestSvc := procurement.NewPurchaseRequestService(
		purchaseRequestDAO,
		purchaseRequestLineDAO,
		sequenceSvc,
		contactDAO,
	)
	purchaseOrderSvc := procurement.NewPurchaseOrderService(
		procurement.PurchaseOrderRepositories{
			Orders:           purchaseOrderDAO,
			Lines:            purchaseOrderLineDAO,
			Requisitions:     purchaseRequestDAO,
			RequisitionLines: purchaseRequestLineDAO,
			Agreements:       supplyAgreementDAO,
			AgreementLines:   supplyAgreementLineDAO,
			CreditMemos:      purchaseCreditMemoDAO,
			DebitMemos:       purchaseDebitMemoDAO,
			Batches:          purchasePaymentBatchDAO,
			BatchLines:       purchasePaymentBatchLineDAO,
			Contacts:         contactDAO,
			Suppliers:        supplierProfileDAO,
			Warehouses:       warehouseDAO,
			Locations:        stockLocationDAO,
			Shipments:        stockShipmentDAO,
			Movements:        stockMovementDAO,
			Resolver:         productResolver,
			Taxes:            taxDAO,
			CostCenters:      costCenterDAO,
		},
		procurement.PurchaseOrderEngines{
			Sequences:    sequenceSvc,
			Configs:      purchaseConfigSource,
			Offers:       supplierProductSvc,
			Expense:      productSvc,
			Receive:      valuationSvc,
			Approvals:    approvalSvc,
			Bills:        invoiceSvc,
			OpenInvoices: invoiceDAO,
			Payments:     paymentSvc,
			Quality:      qualitySvc,
		},
	)
	purchaseRFQSvc := procurement.NewSupplierQuoteRequestService(
		purchaseRFQDAO,
		purchaseRFQLineDAO,
		purchaseRFQQuoteDAO,
		purchaseRFQQuoteLineDAO,
		purchaseRequestDAO,
		purchaseRequestLineDAO,
		sequenceSvc,
		contactDAO,
		purchaseOrderSvc,
	)
	supplyAgreementSvc := procurement.NewSupplyAgreementService(supplyAgreementDAO, supplyAgreementLineDAO, sequenceSvc, contactDAO)
	vendorScorecardSvc := procurement.NewSupplierScorecardService(vendorScorecardDAO)
	costCenterSvc := procurement.NewCostCenterService(costCenterDAO)
	mrpSvc := manufacturing.NewPlanningService(mrpRunDAO, mrpDemandDAO, mrpPlannedOrderDAO, demandForecastDAO, saleOrderDAO, saleOrderLineDAO, purchaseOrderDAO, purchaseOrderLineDAO, moDAO, reorderSvc, ledgerSvc, recipeDAO, recipeLineDAO, bomSvc, itemVariantDAO, itemDAO, stockLocationDAO, purchaseOrderSvc, moSvc, transferSvc)
	subcontractSvc := manufacturing.NewOutsideProcessingService(subcontractOrderDAO, moDAO, consumedMaterialDAO, recipeDAO, purchaseOrderSvc, purchaseOrderDAO, purchaseOrderLineDAO, stockLocationDAO, ledgerSvc, valuationSvc, productResolver, postingSvc)
	originOrderLookup := returns.NewOriginOrderLookup(saleOrderDAO, purchaseOrderDAO)
	rmaSvc := returns.NewRMAService(
		rmaDAO,
		rmaLineDAO,
		originOrderLookup,
		stockMovementDAO,
		stockLocationDAO,
		stockCostLayerDAO,
		valuationSvc,
		invoiceDAO,
		invoiceSvc,
		saleOrderSvc,
		purchaseOrderSvc,
		sequenceSvc,
		db.NewDBTransactioner(d),
	)
	qualityPointSvc := quality.NewQualityPointService(qualityPointDAO)
	hrSvc := payroll.NewHRService(
		employeeDAO,
		contractDAO,
		leaveDAO,
		leaveTypeDAO,
		departmentDAO,
		jobPositionDAO,
		organizationDAO,
		contactDAO,
		dimensionDAO,
		userDAO,
		attendanceDAO,
		timesheetDAO,
		shiftDAO,
		shiftAssignmentDAO,
		db.NewDBTransactioner(d),
	).WithSequences(sequenceSvc)
	salaryRuleSvc := payroll.NewSalaryRuleService(salaryRuleDAO, accountDAO)
	payrollSvc := payroll.NewPayrollService(
		payrollRunDAO,
		payslipDAO,
		payslipLineDAO,
		employeeDAO,
		contractDAO,
		attendanceDAO,
		salaryRuleDAO,
		journalDAO,
		postingSvc,
		sequenceSvc,
		db.NewDBTransactioner(d),
	)
	projectSvc := project.NewProjectService(
		projectDAO,
		projectTaskDAO,
		projectMilestoneDAO,
		projectInvoiceLineDAO,
		timesheetDAO,
		contractDAO,
		contactDAO,
		accountDAO,
		dimensionDAO,
		invoiceSvc,
		invoiceLineDAO,
	)
	expenseConfigSource := expense.NewExpenseConfigSource(systemConfigDAO)
	expenseSvc := expense.NewExpenseService(
		expenseReportDAO,
		expenseLineDAO,
		expenseCategoryDAO,
		taxDAO,
		postingSvc,
		expenseConfigSource,
		db.NewDBTransactioner(d),
	).WithBilling(invoiceSvc, productSvc, projectDAO)
	inboundCostConfigSource := inventory.NewInboundCostConfigSource(systemConfigDAO)
	inboundCostSvc := inventory.NewInboundCostService(
		inboundCostDAO,
		inboundCostLineDAO,
		inboundCostAdjustmentDAO,
		stockMovementDAO,
		stockCostLayerDAO,
		productResolver,
		postingSvc,
		inboundCostConfigSource,
		invoiceLineDAO,
		db.NewDBTransactioner(d),
	)
	assetSvc := asset.NewAssetService(
		assetDAO,
		assetDepreciationLineDAO,
		assetCategoryDAO,
		invoiceLineDAO,
		invoiceDAO,
		postingSvc,
		db.NewDBTransactioner(d),
	)
	subscriptionConfigSource := subscription.NewSubscriptionConfigSource(systemConfigDAO)
	deferralSvc := accounting.NewDeferralService(
		deferredScheduleDAO,
		deferredScheduleLineDAO,
		postingSvc,
		subscriptionConfigSource,
		db.NewDBTransactioner(d),
	)
	paymentBatchSvc := accounting.NewPaymentBatchService(paymentBatchDAO, paymentBatchLineDAO, paymentDAO, subscriptionConfigSource, db.NewDBTransactioner(d))
	subscriptionSvc := subscription.NewSubscriptionService(
		subscriptionDAO,
		subscriptionLineDAO,
		subscriptionPlanDAO,
		contactDAO,
		priceBookDAO,
		productSvc,
		invoiceSvc,
		deferralSvc,
		subscriptionConfigSource,
		db.NewDBTransactioner(d),
	)
	commissionSvc := commission.NewCommissionService(
		commissionPlanDAO,
		commissionRuleDAO,
		commissionAssignmentDAO,
		commissionEntryDAO,
		postingSvc,
		invoiceDAO,
		invoiceLineDAO,
		paymentAllocationDAO,
		productResolver,
		db.NewDBTransactioner(d),
	)
	giftCardSvc := giftcard.NewGiftCardService(
		giftCardDAO,
		giftCardTransactionDAO,
		postingSvc,
		db.NewDBTransactioner(d),
	)
	serviceSvc := service.NewService(
		equipmentDAO,
		serviceContractDAO,
		serviceOrderDAO,
		serviceOrderLineDAO,
		postingSvc,
		invoiceSvc,
		db.NewDBTransactioner(d),
	)
	maintenanceSvc := service.NewMaintenanceService(
		maintenancePlanDAO,
		equipmentDAO,
		serviceOrderDAO,
		db.NewDBTransactioner(d),
	)
	dropshipSvc := interorganization.NewDropShipService(
		dropshipLinkDAO,
		purchaseOrderSvc,
		purchaseOrderDAO,
		purchaseOrderLineDAO,
		saleOrderDAO,
		saleOrderLineDAO,
		stockMovementDAO,
		stockLocationDAO,
		productResolver,
		postingSvc,
		db.NewDBTransactioner(d),
	)
	interorgSvc := interorganization.NewInterorganizationService(
		interorgRuleDAO,
		interorgTransactionDAO,
		purchaseOrderSvc,
		saleOrderDAO,
		saleOrderLineDAO,
	).WithInvoiceMirror(invoiceDAO, invoiceLineDAO, invoiceSvc)
	consolidationSvc := interorganization.NewConsolidationService(
		consolidationRunDAO,
		consolidationEliminationDAO,
		interorgTransactionDAO,
		organizationDAO,
		taxPeriodDAO,
		accountDAO,
		accountBalanceDAO,
		purchaseOrderLineDAO,
		productResolver,
		stockCostLayerDAO,
		fxRateSource,
		db.NewDBTransactioner(d),
	)
	reportConfigSource := reporting.NewConfigSource(systemConfigDAO)
	leadToCashSvc := reporting.NewLeadToCashService(leadToCashDAO)
	reportSvc := reporting.NewReportService(reportDAO, trialBalanceSvc)
	kpiSummarySvc := reporting.NewKpiSummaryService(kpiSummaryDAO, taxPeriodDAO)
	kpiSvc := reporting.NewKpiService(
		reportDAO,
		pipelineSvc,
		subscriptionSvc,
		projectDAO,
		projectSvc,
	)
	fxRevaluationSvc := reporting.NewFxRevaluationService(
		reportDAO,
		fxRevaluationDAO,
		fxRevaluationLineDAO,
		postingSvc,
		reportConfigSource,
		fxRateSource,
		organizationDAO,
	)
	accrualSvc := reporting.NewAccrualService(accrualDAO, accrualLineDAO, postingSvc, reportConfigSource)
	periodCloseSvc := reporting.NewPeriodCloseService(
		taxPeriodSvc,
		taxPeriodDAO,
		reportConfigSource,
		assetDAO,
		assetSvc,
		fxRevaluationSvc,
		accrualSvc,
		deferralSvc,
		kpiSummarySvc,
	)
	statementSvc := reporting.NewStatementService(reportDAO, taxPeriodDAO, taxPeriodDAO, taxYearDAO, postingSvc).WithAccounts(accountDAO)

	queueHealth := queue.NewHealthChecker(cfg)

	authHandler := handler.NewAuthHandler(authSvc)
	oauthHandler := handler.NewOAuthHandler(oauthSvc, cfg)
	userHandler := handler.NewUserHandler(userDAO, userSvc, authzSvc, memberDAO, avatarSvc)
	fxRateHandler := referenceHandler.NewFxRateHandler(fxRateSvc, fxRateSource)
	unitGroupHandler := referenceHandler.NewUnitGroupHandler(uomSvc)
	uomHandler := referenceHandler.NewUnitHandler(uomSvc)
	dimensionHandler := referenceHandler.NewDimensionHandler(dimensionSvc)
	paymentTermHandler := referenceHandler.NewPaymentTermHandler(paymentTermSvc)
	accountHandler := referenceHandler.NewAccountHandler(accountSvc)
	journalHandler := referenceHandler.NewJournalHandler(journalSvc)
	taxHandler := referenceHandler.NewTaxHandler(taxSvc)
	taxYearHandler := referenceHandler.NewTaxYearHandler(taxYearSvc)
	currencyHandler := referenceHandler.NewCurrencyHandler(fxRateSvc)
	countryHandler := referenceHandler.NewCountryHandler(countrySvc)
	systemConfigHandler := xtradataHandler.NewSystemConfigHandler(configSvc)
	integrationEventHandler := xtradataHandler.NewIntegrationEventHandler(
		integrationEventSvc.WithDeliver(webhookDeliverer.Deliver),
	)
	webhookSubscriptionHandler := xtradataHandler.NewWebhookSubscriptionHandler(webhoookSvc)
	localizationProfileHandler := localizationHandler.NewProfileHandler(localizationProfileSvc)
	auditLogHandler := auditHandler.NewAuditLogHandler(auditLogSvc)
	orgHandler := organizationHandler.NewOrganizationHandler(
		organizationSvc,
		organizationDAO,
		memberDAO,
	)
	memberHandler := handler.NewMemberHandler(memberSvc, memberDAO, memberRoleDAO, permissionDAO)
	contactHandler := contactsHandler.NewContactHandler(contactSvc)
	contactAvatarHandler := contactsHandler.NewContactAvatarHandler(contactAvatarSvc)
	contactRelationHandler := contactsHandler.NewContactRelationHandler(
		contactSvc,
	)
	contactInquiryHandler := inquiryHandler.NewContactInquiryHandler(contactInquirySvc)
	itemCategoryHandler := productsHandler.NewItemCategoryHandler(itemCategoryDAO)
	productHandler := productsHandler.NewProductHandler(productSvc)
	priceBookHandler := productsHandler.NewPriceBookHandler(productSvc)
	carrierHandler := referenceHandler.NewCarrierHandler(carrierSvc)
	campaignHandler := referenceHandler.NewCampaignHandler(campaignSvc)
	supplierProductHandler := productsHandler.NewSupplierProductHandler(supplierProductSvc)
	bomHandler := manufacturingHandler.NewRecipeHandler(bomSvc)
	routingHandler := manufacturingHandler.NewRoutingHandler(routingSvc)
	workCenterHandler := manufacturingHandler.NewWorkCenterHandler(workCenterDAO)
	trialBalanceHandler := accountingHandler.NewTrialBalanceHandler(trialBalanceSvc)
	cashFlowHandler := accountingHandler.NewCashFlowHandler(cashFlowSvc)
	equityHandler := accountingHandler.NewEquityHandler(equitySvc)
	integrityHandler := accountingHandler.NewIntegrityHandler(integritySvc)
	generalLedgerHandler := accountingHandler.NewGeneralLedgerHandler(generalLedgerSvc)
	accountMoveHandler := accountingHandler.NewJournalEntryHandler(postingSvc)
	invoiceHandler := accountingHandler.NewInvoiceHandler(invoiceSvc)
	paymentHandler := accountingHandler.NewPaymentHandler(paymentSvc)
	pdcHandler := accountingHandler.NewPdcHandler(pdcSvc)
	taxPeriodHandler := accountingHandler.NewTaxPeriodHandler(taxPeriodSvc)
	bankStatementHandler := accountingHandler.NewBankStatementHandler(bankStatementSvc)
	reconcileHandler := accountingHandler.NewReconcileHandler(reconcileSvc)
	reminderHandler := accountingHandler.NewReminderHandler(reminderSvc)
	budgetHandler := accountingHandler.NewBudgetHandler(budgetSvc)
	taxRuleHandler := accountingHandler.NewTaxRuleHandler(taxRuleResolver)
	withholdingHandler := accountingHandler.NewWithholdingTaxHandler(withholdingSvc)
	taxReturnHandler := accountingHandler.NewTaxReturnHandler(taxReturnSvc)
	reconcileRuleHandler := accountingHandler.NewReconcileRuleHandler(reconcileRuleEngine)
	warehouseHandler := inventoryHandler.NewWarehouseHandler(warehouseSvc)
	stockHandler := inventoryHandler.NewStockHandler(stockSvc, ledgerSvc, valuationSvc)
	reservationHandler := inventoryHandler.NewHoldHandler(reservationSvc)
	lotHandler := inventoryHandler.NewBatchHandler(lotSvc)
	reorderHandler := inventoryHandler.NewReorderHandler(reorderSvc)
	countHandler := inventoryHandler.NewStockCountHandler(countSvc)
	transferHandler := inventoryHandler.NewTransferHandler(transferSvc)
	moHandler := manufacturingHandler.NewProductionOrderHandler(moSvc)
	productionHandler := manufacturingHandler.NewProductionHandler(productionSvc)
	contactInquiryHandler = inquiryHandler.NewContactInquiryHandler(contactInquirySvc)
	leadHandler := crmHandler.NewProspectHandler(crmStageDAO, leadSvc)
	opportunityHandler := crmHandler.NewOpportunityHandler(crmStageDAO, leadSvc)
	activityHandler := crmHandler.NewProspectActivityHandler(activitySvc)
	pipelineHandler := crmHandler.NewPipelineHandler(pipelineSvc)
	stageHandler := crmHandler.NewPipelineStageHandler(crmStageDAO)
	teamHandler := crmHandler.NewSalesGroupHandler(salesTeamDAO)
	saleOrderHandler := salesHandler.NewSaleOrderHandler(saleOrderSvc)
	saleQuoteHandler := salesHandler.NewSaleQuoteHandler(saleQuoteSvc)
	posConfigHandler := posHandler.NewPOSConfigHandler(posConfigDAO)
	posSessionHandler := posHandler.NewPOSSessionHandler(posSvc)
	posOrderHandler := posHandler.NewPOSOrderHandler(posSvc)
	posPaymentAccountHandler := posHandler.NewPaymentAccountHandler(posPaymentAccountSvc)
	approvalHandler := crosscuttingHandler.NewApprovalRequestHandler(approvalSvc)
	attachmentHandler := crosscuttingHandler.NewAttachmentHandler(attachmentSvc)
	messageHandler := crosscuttingHandler.NewMessageHandler(messageSvc)
	purchaseRequestHandler := procurementHandler.NewPurchaseRequestHandler(purchaseRequestSvc)
	purchaseOrderHandler := procurementHandler.NewPurchaseOrderHandler(purchaseOrderSvc)
	purchaseRFQHandler := procurementHandler.NewSupplierQuoteRequestHandler(purchaseRFQSvc)
	supplyAgreementHandler := procurementHandler.NewSupplyAgreementHandler(supplyAgreementSvc, purchaseOrderSvc)
	vendorScorecardHandler := procurementHandler.NewSupplierScorecardHandler(vendorScorecardSvc)
	costCenterHandler := procurementHandler.NewCostCenterHandler(costCenterSvc)
	purchasePaymentBatchHandler := procurementHandler.NewPaymentBatchHandler(purchaseOrderSvc)
	mrpHandler := manufacturingHandler.NewPlanningHandler(mrpSvc)
	subcontractHandler := manufacturingHandler.NewOutsideProcessingHandler(subcontractSvc)
	rmaHandler := returnsHandler.NewRMAHandler(rmaSvc)
	qualityPointHandler := qualityHandler.NewQualityPointHandler(qualityPointSvc)
	qualityCheckHandler := qualityHandler.NewQualityCheckHandler(qualitySvc)
	qualityAlertHandler := qualityHandler.NewQualityAlertHandler(qualitySvc)
	departmentHandler := payrollHandler.NewDepartmentHandler(hrSvc)
	jobPositionHandler := payrollHandler.NewJobPositionHandler(hrSvc)
	leaveTypeHandler := payrollHandler.NewLeaveTypeHandler(hrSvc)
	employeeHandler := payrollHandler.NewEmployeeHandler(hrSvc)
	contractHandler := payrollHandler.NewContractHandler(hrSvc)
	leaveRequestHandler := payrollHandler.NewLeaveRequestHandler(hrSvc)
	attendanceHandler := payrollHandler.NewAttendanceHandler(hrSvc)
	timesheetHandler := payrollHandler.NewTimesheetHandler(hrSvc)
	salaryRuleHandler := payrollHandler.NewSalaryRuleHandler(salaryRuleSvc)
	payrollRunHandler := payrollHandler.NewPayrollRunHandler(payrollSvc)
	payslipHandler := payrollHandler.NewPayslipHandler(payrollSvc)
	projectHandler := projectHandler.NewProjectHandler(projectSvc)
	expenseCategoryHandler := expenseHandler.NewExpenseCategoryHandler(expenseCategoryDAO)
	expenseReportHandler := expenseHandler.NewExpenseReportHandler(expenseSvc)
	inboundCostHandler := inventoryHandler.NewInboundCostHandler(inboundCostSvc)
	assetHandler := assetHandler.NewAssetCategoryHandler(assetCategoryDAO, assetSvc)
	paymentBatchHandler := accountingHandler.NewPaymentBatchHandler(paymentBatchSvc)
	subscriptionPlanHandler := subscriptionHandler.NewSubscriptionPlanHandler(subscriptionPlanDAO)
	subscriptionHandler := subscriptionHandler.NewSubscriptionHandler(subscriptionSvc)
	deferralHandler := accountingHandler.NewDeferralHandler(deferralSvc)
	commissionHandler := commissionHandler.NewCommissionHandler(
		commissionSvc,
	)
	giftCardHandler := giftcardHandler.NewGiftCardHandler(giftCardSvc)
	couponHandler := giftcardHandler.NewCouponHandler(couponSvc)
	serviceHandler := serviceHandler.NewServiceHandler(
		serviceSvc,
		maintenanceSvc,
	)
	dropshipHandler := interorganizationHandler.NewDropShipHandler(dropshipSvc)
	interorgHandler := interorganizationHandler.NewInterorganizationHandler(
		interorgSvc,
	)
	consolidationHandler := interorganizationHandler.NewConsolidationHandler(consolidationSvc)
	reportHandler := reportingHandler.NewReportHandler(reportSvc)
	kpiHandler := reportingHandler.NewKpiHandler(kpiSvc).WithLeadToCash(leadToCashSvc)
	fxRevaluationHandler := reportingHandler.NewFxRevaluationHandler(fxRevaluationSvc)
	accrualHandler := reportingHandler.NewAccrualHandler(accrualSvc)
	periodCloseHandler := reportingHandler.NewPeriodCloseHandler(periodCloseSvc)
	statementHandler := reportingHandler.NewStatementHandler(statementSvc)
	healthHandler := httpx.NewHealthHandler(cfg, d, queueHealth)

	authzMiddleware := httpx.NewAuthorizationMiddleware(permissionDAO)
	authnMiddleware := httpx.NewAuthenticationMiddleware(
		tokenSvc,
		userDAO,
		userSessionDAO,
	)

	guards := httpx.RouteGuards{
		AuthN:       authnMiddleware.AuthN,
		Guard:       authzMiddleware.Guard,
		Idempotency: idemSvc,
	}

	api := app.Group("/api/v1")
	orgAPI := api.Group("/organizations/:organization_id")

	contactInquiryHandler.RegisterPublic(api)
	authHandler.Register(api, guards)
	oauthHandler.Register(api, guards)
	userHandler.Register(api, guards)
	unitGroupHandler.Register(orgAPI, guards)
	uomHandler.Register(orgAPI, guards)
	paymentTermHandler.Register(api, guards)
	paymentTermHandler.RegisterOrg(orgAPI, guards)
	currencyHandler.Register(api)
	countryHandler.Register(api)
	fxRateHandler.Register(orgAPI, guards)
	dimensionHandler.Register(orgAPI, guards)
	accountHandler.Register(orgAPI, guards)
	journalHandler.Register(orgAPI, guards)
	taxHandler.Register(orgAPI, guards)
	taxYearHandler.Register(orgAPI, guards)
	systemConfigHandler.Register(orgAPI, guards)
	integrationEventHandler.Register(orgAPI, guards)
	webhookSubscriptionHandler.Register(orgAPI, guards)
	localizationProfileHandler.Register(api, guards)
	localizationProfileHandler.RegisterOrg(orgAPI, guards)
	auditLogHandler.Register(orgAPI, guards)
	orgHandler.Register(api, guards)
	memberHandler.Register(orgAPI, guards)
	contactHandler.Register(orgAPI, guards)
	contactAvatarHandler.Register(orgAPI, guards)
	contactRelationHandler.Register(orgAPI, guards)
	carrierHandler.RegisterOrg(orgAPI, guards)
	campaignHandler.RegisterOrg(orgAPI, guards)
	itemCategoryHandler.Register(orgAPI, guards)
	supplierProductHandler.Register(orgAPI, guards)
	productHandler.Register(orgAPI, guards)
	priceBookHandler.Register(orgAPI, guards)
	bomHandler.Register(orgAPI, guards)
	routingHandler.Register(orgAPI, guards)
	workCenterHandler.Register(orgAPI, guards)
	accountMoveHandler.Register(orgAPI, guards)
	invoiceHandler.Register(orgAPI, guards)
	invoiceHandler.RegisterSupplierBills(orgAPI, guards)
	paymentHandler.Register(orgAPI, guards)
	pdcHandler.Register(orgAPI, guards)
	taxPeriodHandler.Register(orgAPI, guards)
	bankStatementHandler.Register(orgAPI, guards)
	reconcileHandler.Register(orgAPI, guards)
	reminderHandler.Register(orgAPI, guards)
	budgetHandler.Register(orgAPI, guards)
	taxRuleHandler.Register(orgAPI, guards)
	withholdingHandler.Register(orgAPI, guards)
	taxReturnHandler.Register(orgAPI, guards)
	reconcileRuleHandler.Register(orgAPI, guards)
	trialBalanceHandler.Register(orgAPI, guards)
	cashFlowHandler.Register(orgAPI, guards)
	equityHandler.Register(orgAPI, guards)
	integrityHandler.Register(orgAPI, guards)
	generalLedgerHandler.Register(orgAPI, guards)
	moHandler.Register(orgAPI, guards)
	productionHandler.Register(orgAPI, guards)
	reservationHandler.Register(orgAPI, guards)
	lotHandler.Register(orgAPI, guards)
	reorderHandler.Register(orgAPI, guards)
	warehouseHandler.Register(orgAPI, guards)
	stockHandler.Register(orgAPI, guards)
	countHandler.Register(orgAPI, guards)
	transferHandler.Register(orgAPI, guards)
	contactInquiryHandler.RegisterOrg(orgAPI, guards)
	activityHandler.Register(orgAPI, guards)
	stageHandler.Register(orgAPI, guards)
	leadHandler.Register(orgAPI, guards)
	opportunityHandler.Register(orgAPI, guards)
	pipelineHandler.Register(orgAPI, guards)
	teamHandler.Register(orgAPI, guards)
	saleOrderHandler.Register(orgAPI, guards)
	saleQuoteHandler.Register(orgAPI, guards)
	posConfigHandler.Register(orgAPI, guards)
	posSessionHandler.Register(orgAPI, guards)
	posOrderHandler.Register(orgAPI, guards)
	posPaymentAccountHandler.Register(orgAPI, guards)
	approvalHandler.Register(orgAPI, guards)
	attachmentHandler.Register(orgAPI, guards)
	messageHandler.Register(orgAPI, guards)
	purchaseRequestHandler.Register(orgAPI, guards)
	purchaseOrderHandler.Register(orgAPI, guards)
	purchaseRFQHandler.Register(orgAPI, guards)
	supplyAgreementHandler.Register(orgAPI, guards)
	vendorScorecardHandler.Register(orgAPI, guards)
	costCenterHandler.Register(orgAPI, guards)
	purchasePaymentBatchHandler.Register(orgAPI, guards)
	mrpHandler.Register(orgAPI, guards)
	subcontractHandler.Register(orgAPI, guards)
	rmaHandler.Register(orgAPI, guards)
	qualityPointHandler.Register(orgAPI, guards)
	qualityCheckHandler.Register(orgAPI, guards)
	qualityAlertHandler.Register(orgAPI, guards)
	jobPositionHandler.Register(orgAPI, guards)
	leaveTypeHandler.Register(orgAPI, guards)
	contractHandler.Register(orgAPI, guards)
	salaryRuleHandler.Register(orgAPI, guards)
	departmentHandler.Register(orgAPI, guards)
	employeeHandler.Register(orgAPI, guards)
	leaveRequestHandler.Register(orgAPI, guards)
	attendanceHandler.Register(orgAPI, guards)
	timesheetHandler.Register(orgAPI, guards)
	payrollRunHandler.Register(orgAPI, guards)
	payslipHandler.Register(orgAPI, guards)
	projectHandler.Register(orgAPI, guards)
	expenseCategoryHandler.Register(orgAPI, guards)
	expenseReportHandler.Register(orgAPI, guards)
	inboundCostHandler.Register(orgAPI, guards)
	assetHandler.Register(orgAPI, guards)
	subscriptionPlanHandler.Register(orgAPI, guards)
	subscriptionHandler.Register(orgAPI, guards)
	deferralHandler.Register(orgAPI, guards)
	paymentBatchHandler.Register(orgAPI, guards)
	commissionHandler.Register(orgAPI, guards)
	giftCardHandler.Register(orgAPI, guards)
	couponHandler.Register(orgAPI, guards)
	serviceHandler.Register(orgAPI, guards)
	dropshipHandler.Register(orgAPI, guards)
	interorgHandler.Register(orgAPI, guards)
	consolidationHandler.Register(orgAPI, guards)
	reportHandler.Register(orgAPI, guards)
	kpiHandler.Register(orgAPI, guards)
	fxRevaluationHandler.Register(orgAPI, guards)
	accrualHandler.Register(orgAPI, guards)
	periodCloseHandler.Register(orgAPI, guards)
	statementHandler.Register(orgAPI, guards)

	api.Get("/health", healthHandler.Health)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		listenConfig := fiber.ListenConfig{
			EnablePrefork:         cfg.ApplicationPrefork,
			DisableStartupMessage: true,
		}
		errCh <- app.Listen(cfg.HTTPAddress(), listenConfig)
	}()

	select {
	case err := <-errCh:
		logger.Fatalf("Failed to run http server %v", err)
	case <-ctx.Done():
		slog.Info("Shutting down gracefully")
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	defer cancel()

	if err := app.ShutdownWithContext(shutdownCtx); err != nil {
		logger.Fatalf("Failed to shutdown http server gracefully %v", err)
	}

	if limiterStorage != nil {
		_ = limiterStorage.Close()
	}
}
