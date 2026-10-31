"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { useOrgListQuery, useOrgQuery } from "@/lib/hooks/use-org-query";
import type {
  Coupon,
  Item,
  PosOrderLineRequest,
  PosPaymentRequest,
  PosSession,
} from "@/lib/services/swantara";
import { getSwantaraService } from "@/lib/services/swantara";
import { formatMoney } from "@/lib/utils";
import {
  canPlaceOrder,
  couponBlockReason,
  couponDiscount,
  findCouponByCode,
} from "../../../_components/pos-utils";
import { PosCart } from "./pos-cart";
import { PosPayment } from "./pos-payment";
import { PosProductGrid } from "./pos-product-grid";
import { PosReceipt } from "./pos-receipt";

export type CartLine = {
  key: string;
  itemId: number;
  productName: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  taxIds: number[];
};

export function PosRegister({ orgId, sessionId }: { orgId: string; sessionId: string }) {
  const t = useTranslations("Pos");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<{
    orderId: number;
    orderName: string | null;
    amountTotal: number;
    payments: { method: string; amount: number }[];
  } | null>(null);

  const sessionQuery = useOrgQuery<{ session: PosSession }>(
    "posSession",
    sessionId,
    (organizationId) => getSwantaraService().posSessions.get(organizationId, Number(sessionId)),
  );
  const productsQuery = useOrgListQuery<{ products: Item[] }, Record<string, never>>(
    "products",
    (organizationId) => getSwantaraService().products.list(organizationId),
  );
  const couponsQuery = useOrgListQuery<{ coupons: Coupon[] }, { size: number }>(
    "coupons",
    (organizationId, params) => getSwantaraService().coupons.list(organizationId, params),
    { size: 100 },
  );

  const session = sessionQuery.data?.session ?? null;
  const products = productsQuery.data?.products ?? [];

  const subtotal = cart.reduce(
    (sum, line) => sum + line.unitPrice * line.qty * (1 - line.discountPct / 100),
    0,
  );
  const discount = coupon ? couponDiscount(coupon, subtotal) : 0;
  const dueTotal = Math.max(0, subtotal - discount);

  const addItem = useCallback((item: Item) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.itemId === item.id);
      if (existing) {
        return prev.map((l) => (l.itemId === item.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [
        ...prev,
        {
          key: `line-${item.id}-${Date.now()}`,
          itemId: item.id,
          productName: item.name,
          qty: 1,
          unitPrice: item.listPrice,
          discountPct: 0,
          taxIds: [],
        },
      ];
    });
  }, []);

  const updateLine = useCallback((key: string, updates: Partial<CartLine>) => {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, ...updates } : l)));
  }, []);

  const removeLine = useCallback((key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    const found = findCouponByCode(couponsQuery.data?.coupons ?? [], code);
    if (!found) {
      setCoupon(null);
      setCouponError(t("couponNotFound"));
      return;
    }
    const reason = couponBlockReason(found);
    if (reason) {
      setCoupon(null);
      setCouponError(
        reason === "inactive"
          ? t("couponInactive")
          : reason === "expired"
            ? t("couponExpired")
            : t("couponOverLimit"),
      );
      return;
    }
    setCoupon(found);
    setCouponError(null);
  }

  function clearCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  function handlePayment(payments: PosPaymentRequest[]) {
    if (!session || cart.length === 0) return;

    const lines: PosOrderLineRequest[] = cart.map((line) => ({
      itemId: line.itemId,
      qty: line.qty,
      discountPct: line.discountPct,
      taxIds: line.taxIds,
    }));

    return getSwantaraService()
      .posOrders.create(Number(orgId), {
        sessionId: session.id,
        contactId: null,
        lines,
        payments,
        couponCode: coupon?.code,
      })
      .then(({ order }) => {
        toast.success(t("orderPlaced"));
        setPaymentOpen(false);
        setReceipt({
          orderId: order.id,
          orderName: order.name,
          amountTotal: order.amountTotal,
          payments,
        });
        clearCart();
        clearCoupon();
        void sessionQuery.refetch();
      })
      .catch(() => {});
  }

  if (receipt) {
    return (
      <PosReceipt
        orderId={receipt.orderId}
        orderName={receipt.orderName}
        amountTotal={receipt.amountTotal}
        payments={receipt.payments}
        onNewOrder={() => setReceipt(null)}
      />
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="text-sm">{t("registerTitle")}</h1>
          {session ? (
            <span className="text-xs text-muted-foreground">
              {t("session")}: {t("sessionFallback", { id: session.id })}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t("items")}:</span>
          <span className="text-sm tabular-nums">{cart.reduce((sum, l) => sum + l.qty, 0)}</span>
          <span className="text-sm text-muted-foreground ml-2">{t("colTotal")}:</span>
          <span className="text-base font-bold tabular-nums">{formatMoney(dueTotal)}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-3">
          <PosProductGrid
            products={products}
            onAddItem={addItem}
            searchPlaceholder={t("searchProducts")}
          />
        </div>

        <div className="flex w-80 flex-col border-l">
          <PosCart
            lines={cart}
            subtotal={subtotal}
            onUpdateLine={updateLine}
            onRemoveLine={removeLine}
            onClear={clearCart}
          />
          <div className="border-t p-3">
            <div className="flex flex-col gap-2">
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  applyCoupon();
                }}
              >
                <Input
                  value={couponInput}
                  onChange={(event) => {
                    setCouponInput(event.target.value);
                    setCouponError(null);
                  }}
                  placeholder={t("couponCode")}
                  disabled={coupon != null || couponsQuery.isLoading}
                  aria-label={t("couponCode")}
                />
                {coupon ? (
                  <Button type="button" variant="outline" onClick={clearCoupon}>
                    {t("removeCoupon")}
                  </Button>
                ) : (
                  <Button type="submit" disabled={!couponInput.trim() || couponsQuery.isLoading}>
                    {t("applyCoupon")}
                  </Button>
                )}
              </form>
              {couponError ? <p className="text-xs text-destructive">{couponError}</p> : null}
              {coupon && discount > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("discount")} · {coupon.code}
                  </span>
                  <span className="tabular-nums text-success">-{formatMoney(discount)}</span>
                </div>
              ) : null}
            </div>
            <Button
              className="mt-3 w-full"
              size="lg"
              disabled={cart.length === 0 || (session != null && !canPlaceOrder(session.state))}
              onClick={() => setPaymentOpen(true)}
            >
              {t("pay")} — {formatMoney(dueTotal)}
            </Button>
          </div>
        </div>
      </div>

      {paymentOpen ? (
        <PosPayment
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          total={dueTotal}
          onSubmit={handlePayment}
        />
      ) : null}
    </div>
  );
}
