import { getCsrfToken } from "@/lib/constants/cookies";

export type ContactInquiryInput = {
  name: string;
  email: string;
  company: string | null;
  message: string;
};

export async function submitContactInquiry(input: ContactInquiryInput): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const csrfToken = getCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  const response = await fetch("/api/v1/contact-inquiries", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Contact inquiry failed with status ${response.status}`);
  }
}
