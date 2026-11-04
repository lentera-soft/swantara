export type IntegrationCategory =
  | "marketplace"
  | "delivery"
  | "payment"
  | "communication"
  | "business";

export type IntegrationStatus = "connected" | "not_connected" | "error";

export type IntegrationScope =
  | "orders"
  | "products"
  | "inventory"
  | "shipping"
  | "payments"
  | "chats"
  | "reports"
  | "account";

export type IntegrationProvider = {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  status: IntegrationStatus;
  accent: string;
  autoSync: boolean;
  lastSyncAt: string | null;
  accountLabel: string | null;
  scopes: IntegrationScope[];
};

export interface IntegrationCatalog {
  list(): Promise<IntegrationProvider[]>;
  connect(id: string, accountLabel: string): Promise<IntegrationProvider>;
  disconnect(id: string): Promise<IntegrationProvider>;
  reconnect(id: string): Promise<IntegrationProvider>;
  setAutoSync(id: string, enabled: boolean): Promise<IntegrationProvider>;
}

const CATALOG: IntegrationProvider[] = [
  {
    id: "tokopedia",
    name: "Tokopedia",
    category: "marketplace",
    description: "Sync sales orders, products, and stock between your Tokopedia Seller account.",
    status: "connected",
    accent: "#42b549",
    autoSync: true,
    lastSyncAt: "2026-11-04T06:30:00",
    accountLabel: "Toko Makmur — Seller ID 1234567",
    scopes: ["orders", "products", "inventory", "reports"],
  },
  {
    id: "shopee",
    name: "Shopee",
    category: "marketplace",
    description: "Push products and import Shopee orders with automatic stock updates.",
    status: "not_connected",
    accent: "#ee4d2d",
    autoSync: false,
    lastSyncAt: null,
    accountLabel: null,
    scopes: ["orders", "products", "inventory"],
  },
  {
    id: "tiktok-shop",
    name: "TikTok Shop",
    category: "marketplace",
    description: "Import TikTok Shop orders and keep listings in sync with your catalog.",
    status: "error",
    accent: "#000000",
    autoSync: true,
    lastSyncAt: "2026-10-28T11:05:00",
    accountLabel: "swantara.official",
    scopes: ["orders", "products"],
  },
  {
    id: "lazada",
    name: "Lazada",
    category: "marketplace",
    description: "Manage Lazada listings, orders, and warehouse stock from one place.",
    status: "not_connected",
    accent: "#0f146e",
    autoSync: false,
    lastSyncAt: null,
    accountLabel: null,
    scopes: ["orders", "products", "inventory"],
  },
  {
    id: "gojek",
    name: "Gojek Business",
    category: "delivery",
    description: "Dispatch GoSend and GoBox deliveries directly from sale orders.",
    status: "connected",
    accent: "#00aa12",
    autoSync: true,
    lastSyncAt: "2026-11-04T08:12:00",
    accountLabel: "Gojek Business — acct gojek-98",
    scopes: ["shipping", "orders"],
  },
  {
    id: "grab",
    name: "Grab",
    category: "delivery",
    description: "Compare GrabExpress rates and track deliveries in real time.",
    status: "not_connected",
    accent: "#00b14f",
    autoSync: false,
    lastSyncAt: null,
    accountLabel: null,
    scopes: ["shipping", "account"],
  },
  {
    id: "midtrans",
    name: "Midtrans",
    category: "payment",
    description: "Accept cards, GoPay, and bank transfers with automatic reconciliation.",
    status: "connected",
    accent: "#703df5",
    autoSync: true,
    lastSyncAt: "2026-11-04T07:45:00",
    accountLabel: "Midtrans — Merchant 0012345678",
    scopes: ["payments", "reports"],
  },
  {
    id: "xendit",
    name: "Xendit",
    category: "payment",
    description: "Payouts, virtual accounts, and e-wallet payments for your store.",
    status: "not_connected",
    accent: "#0d256e",
    autoSync: false,
    lastSyncAt: null,
    accountLabel: null,
    scopes: ["payments", "account"],
  },
  {
    id: "whatsapp-business",
    name: "WhatsApp Business",
    category: "communication",
    description: "Send order updates and reply to customer chats from the shared inbox.",
    status: "not_connected",
    accent: "#128c7e",
    autoSync: false,
    lastSyncAt: null,
    accountLabel: null,
    scopes: ["chats", "account"],
  },
  {
    id: "google-business",
    name: "Google Business Profile",
    category: "business",
    description: "Publish store info, reviews, and local inventory to Google.",
    status: "not_connected",
    accent: "#4285f4",
    autoSync: false,
    lastSyncAt: null,
    accountLabel: null,
    scopes: ["account", "products"],
  },
];

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockIntegrationCatalog implements IntegrationCatalog {
  private providers: IntegrationProvider[] = CATALOG.map((provider) => ({ ...provider }));

  async list(): Promise<IntegrationProvider[]> {
    return delay(
      this.providers.map((provider) => ({ ...provider })),
      400,
    );
  }

  async connect(id: string, accountLabel: string): Promise<IntegrationProvider> {
    const provider = this.find(id);
    provider.status = "connected";
    provider.accountLabel = accountLabel;
    provider.autoSync = true;
    provider.lastSyncAt = new Date().toISOString();
    return delay({ ...provider }, 800);
  }

  async disconnect(id: string): Promise<IntegrationProvider> {
    const provider = this.find(id);
    provider.status = "not_connected";
    provider.accountLabel = null;
    provider.autoSync = false;
    return delay({ ...provider }, 400);
  }

  async reconnect(id: string): Promise<IntegrationProvider> {
    const provider = this.find(id);
    provider.status = "connected";
    provider.lastSyncAt = new Date().toISOString();
    return delay({ ...provider }, 800);
  }

  async setAutoSync(id: string, enabled: boolean): Promise<IntegrationProvider> {
    const provider = this.find(id);
    provider.autoSync = enabled;
    return delay({ ...provider }, 150);
  }

  private find(id: string): IntegrationProvider {
    const provider = this.providers.find((entry) => entry.id === id);
    if (provider == null) {
      throw new Error(`Unknown integration: ${id}`);
    }
    return provider;
  }
}

let catalogInstance: IntegrationCatalog | null = null;

export function getIntegrationCatalog(): IntegrationCatalog {
  if (catalogInstance == null) {
    catalogInstance = new MockIntegrationCatalog();
  }
  return catalogInstance;
}

export function filterProviders(
  providers: IntegrationProvider[],
  category: IntegrationCategory | "all",
  search: string,
): IntegrationProvider[] {
  const query = search.trim().toLowerCase();
  return providers.filter(
    (provider) =>
      (category === "all" || provider.category === category) &&
      (query === "" ||
        provider.name.toLowerCase().includes(query) ||
        provider.description.toLowerCase().includes(query)),
  );
}
