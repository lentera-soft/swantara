import type { AxiosInstance } from "axios";
import { endpoints } from "./endpoints";
import type { ContactInquiry, ContactInquiryRequest, SuccessEnvelope } from "./types";
import { withListMeta } from "./types";

export class Marketing {
  constructor(private readonly axios: AxiosInstance) {}

  async submitContactInquiry(request: ContactInquiryRequest): Promise<{ inquiry: ContactInquiry }> {
    const response = await this.axios.post<SuccessEnvelope<{ inquiry: ContactInquiry }>>(
      endpoints.contactInquiries,
      request,
    );
    return withListMeta(response.data);
  }
}
