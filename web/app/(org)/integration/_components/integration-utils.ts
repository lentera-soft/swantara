import type {
  IntegrationEvent,
  WebhookDelivery,
  WebhookSubscription,
} from "@/lib/services/swantara";

export type IntegrationTab = "webhooks" | "events" | "deliveries";
export type EventStatusFilter = "all" | IntegrationEvent["status"];
export type DeliveryStatusFilter = "all" | WebhookDelivery["status"];

export function eventStatusTone(
  status: IntegrationEvent["status"],
): "success" | "warning" | "info" | "neutral" {
  switch (status) {
    case "sent":
      return "success";
    case "pending":
      return "info";
    case "failed":
      return "warning";
    default:
      return "neutral";
  }
}

export function deliveryStatusTone(
  status: WebhookDelivery["status"],
): "success" | "info" | "neutral" | "warning" {
  switch (status) {
    case "delivered":
      return "success";
    case "failed":
      return "warning";
    default:
      return "neutral";
  }
}

export function filterWebhooks(
  webhooks: WebhookSubscription[],
  query: string,
): WebhookSubscription[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return webhooks;
  return webhooks.filter((webhook) => webhook.url.toLowerCase().includes(normalized));
}

export function filterEvents(
  events: IntegrationEvent[],
  status: EventStatusFilter,
  query: string,
): IntegrationEvent[] {
  const normalized = query.trim().toLowerCase();
  return events.filter((event) => {
    if (status !== "all" && event.status !== status) return false;
    if (normalized.length === 0) return true;
    return event.topic.toLowerCase().includes(normalized);
  });
}

export function filterDeliveries(
  deliveries: WebhookDelivery[],
  status: DeliveryStatusFilter,
  query: string,
): WebhookDelivery[] {
  const normalized = query.trim().toLowerCase();
  return deliveries.filter((delivery) => {
    if (status !== "all" && delivery.status !== status) return false;
    if (normalized.length === 0) return true;
    return [String(delivery.eventId), String(delivery.subscriptionId ?? ""), delivery.status]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
  });
}

export function formatPayload(payload: unknown): string {
  if (payload === null || payload === undefined) return "";
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}
