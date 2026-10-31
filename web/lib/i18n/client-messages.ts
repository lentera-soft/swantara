import type { AbstractIntlMessages } from "next-intl";
import { getMessages } from "next-intl/server";
import type enMessages from "@/messages/en.json";

export type MessageNamespace = keyof typeof enMessages;

export async function getClientMessages(
  namespaces: readonly MessageNamespace[],
): Promise<AbstractIntlMessages> {
  const messages = (await getMessages()) as unknown as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const namespace of namespaces) {
    const value = messages[namespace];
    if (value === undefined) {
      throw new Error(`Missing messages namespace: ${namespace}`);
    }
    result[namespace] = value;
  }
  return result as AbstractIntlMessages;
}
