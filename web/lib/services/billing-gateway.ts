export type GatewayInvoiceStatus = "paid" | "open" | "overdue" | "void";

export type GatewayInvoice = {
  id: string;
  number: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  dueAt: string;
  amount: number;
  paidAmount: number;
  currency: string;
  status: GatewayInvoiceStatus;
  paidAt: string | null;
  receiptUrl: string | null;
};

export type BillingFeature = "unlimited_organizations" | "priority_support" | "advanced_reporting";

export type GatewayPlan = {
  id: string;
  name: string;
  status: "active" | "trialing" | "past_due" | "canceled";
  pricePerPeriod: number;
  currency: string;
  interval: "monthly" | "yearly";
  intervalCount: number;
  renewsAt: string;
  seatsUsed: number;
  seatsLimit: number;
  features: BillingFeature[];
};

export type GatewayPaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
};

export type BillingSummary = {
  plan: GatewayPlan;
  invoices: GatewayInvoice[];
  paymentMethods: GatewayPaymentMethod[];
};

export interface BillingGateway {
  fetchSummary(organizationId: number): Promise<BillingSummary>;
}

const PLAN: GatewayPlan = {
  id: "plan_swantara_pro",
  name: "Swantara Pro",
  status: "active",
  pricePerPeriod: 2_500_000,
  currency: "IDR",
  interval: "monthly",
  intervalCount: 1,
  renewsAt: "2026-12-01",
  seatsUsed: 18,
  seatsLimit: 25,
  features: ["unlimited_organizations", "priority_support", "advanced_reporting"],
};

const INVOICES: GatewayInvoice[] = [
  {
    id: "in_3",
    number: "INV/2026/0003",
    description: "Swantara Pro subscription",
    periodStart: "2026-10-01",
    periodEnd: "2026-10-31",
    issuedAt: "2026-10-01",
    dueAt: "2026-10-15",
    amount: 2_500_000,
    paidAmount: 0,
    currency: "IDR",
    status: "overdue",
    paidAt: null,
    receiptUrl: null,
  },
  {
    id: "in_2",
    number: "INV/2026/0002",
    description: "Swantara Pro subscription",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-30",
    issuedAt: "2026-09-01",
    dueAt: "2026-09-15",
    amount: 2_500_000,
    paidAmount: 2_500_000,
    currency: "IDR",
    status: "paid",
    paidAt: "2026-09-03",
    receiptUrl: null,
  },
  {
    id: "in_1",
    number: "INV/2026/0001",
    description: "Swantara Pro subscription",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    issuedAt: "2026-08-01",
    dueAt: "2026-08-15",
    amount: 2_500_000,
    paidAmount: 2_500_000,
    currency: "IDR",
    status: "paid",
    paidAt: "2026-08-02",
    receiptUrl: null,
  },
];

const PAYMENT_METHODS: GatewayPaymentMethod[] = [
  { id: "pm_1", brand: "visa", last4: "4242", expiryMonth: 8, expiryYear: 2028, isDefault: true },
  {
    id: "pm_2",
    brand: "mastercard",
    last4: "5517",
    expiryMonth: 2,
    expiryYear: 2027,
    isDefault: false,
  },
];

export class MockBillingGateway implements BillingGateway {
  private readonly latencyMs: number;

  constructor(latencyMs = 300) {
    this.latencyMs = latencyMs;
  }

  async fetchSummary(_organizationId: number): Promise<BillingSummary> {
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    return { plan: PLAN, invoices: INVOICES, paymentMethods: PAYMENT_METHODS };
  }
}

let gatewayInstance: BillingGateway | null = null;

export function getBillingGateway(): BillingGateway {
  if (gatewayInstance == null) {
    gatewayInstance = new MockBillingGateway();
  }
  return gatewayInstance;
}

export function openOutstandingInvoices(invoices: GatewayInvoice[]): GatewayInvoice[] {
  return invoices.filter((invoice) => invoice.status === "open" || invoice.status === "overdue");
}

export function outstandingTotal(invoices: GatewayInvoice[]): number {
  return openOutstandingInvoices(invoices).reduce(
    (total, invoice) => total + (invoice.amount - invoice.paidAmount),
    0,
  );
}

export function paidThisYear(invoices: GatewayInvoice[], year = new Date().getFullYear()): number {
  return invoices
    .filter((invoice) => invoice.paidAt != null && new Date(invoice.paidAt).getFullYear() === year)
    .reduce((total, invoice) => total + invoice.paidAmount, 0);
}
