import type { ContactInquiry, Message } from "@/lib/services/swantara";

export type InboxKind = "inquiry" | "message";

export type InboxStatusKey =
  | "status_new"
  | "status_reviewed"
  | "status_archived"
  | "messageType_note"
  | "messageType_system";

export type InboxItem = {
  id: string;
  kind: InboxKind;
  title: string;
  preview: string;
  meta: string;
  createdAt: Date;
  status: string;
  statusKey: InboxStatusKey;
  inquiry?: ContactInquiry;
  message?: Message;
};

const inquiryStatusKeys = {
  new: "status_new",
  reviewed: "status_reviewed",
  archived: "status_archived",
} as const;

const messageTypeKeys = {
  note: "messageType_note",
  system: "messageType_system",
} as const;

export type InboxTab = "all" | InboxKind;

export function humanizeRecordType(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function inquiryToItem(inquiry: ContactInquiry): InboxItem {
  const metaParts = [inquiry.company, inquiry.email].filter((part): part is string =>
    Boolean(part),
  );

  return {
    id: `inquiry-${inquiry.id}`,
    kind: "inquiry",
    title: inquiry.name,
    preview: inquiry.message,
    meta: metaParts.join(" · "),
    createdAt: new Date(inquiry.createdAt),
    status: inquiry.status,
    statusKey: inquiryStatusKeys[inquiry.status],
    inquiry,
  };
}

export function messageToItem(message: Message): InboxItem {
  return {
    id: `message-${message.id}`,
    kind: "message",
    title: humanizeRecordType(message.ownerType),
    preview: message.body,
    meta: `${message.ownerType} #${message.ownerId}`,
    createdAt: new Date(message.createdAt),
    status: message.messageType,
    statusKey: messageTypeKeys[message.messageType],
    message,
  };
}

export function buildInboxItems(inquiries: ContactInquiry[], messages: Message[]): InboxItem[] {
  return [...inquiries.map(inquiryToItem), ...messages.map(messageToItem)].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export function filterInboxItems(items: InboxItem[], tab: InboxTab, query: string): InboxItem[] {
  const normalized = query.trim().toLowerCase();
  return items.filter((item) => {
    if (tab !== "all" && item.kind !== tab) return false;
    if (normalized.length === 0) return true;
    return [item.title, item.preview, item.meta].join(" ").toLowerCase().includes(normalized);
  });
}

export function inboxStatusTone(
  kind: InboxKind,
  status: string,
): "success" | "info" | "warning" | "neutral" {
  if (kind === "message") {
    return status === "system" ? "info" : "neutral";
  }

  switch (status) {
    case "new":
      return "warning";
    case "reviewed":
      return "success";
    case "archived":
      return "neutral";
    default:
      return "neutral";
  }
}
