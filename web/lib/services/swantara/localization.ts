import type { AxiosInstance } from "axios";
import { endpoints } from "./endpoints";
import type {
  CreateLocalizationProfileRequest,
  ListQuery,
  LocalizationProfile,
  LocalizationTaxTemplateLine,
  LocalizationTaxTemplateLineRequest,
  SuccessEnvelope,
  UpdateLocalizationProfileRequest,
} from "./types";
import { withListMeta } from "./types";

export class LocalizationProfiles {
  constructor(private readonly axios: AxiosInstance) {}

  async list(params?: ListQuery): Promise<{ localizationProfiles: LocalizationProfile[] }> {
    const response = await this.axios.get<
      SuccessEnvelope<{ localizationProfiles: LocalizationProfile[] }>
    >(endpoints.localizationProfiles.list, { params });
    return withListMeta(response.data);
  }

  async get(id: number): Promise<{ localizationProfile: LocalizationProfile }> {
    const response = await this.axios.get<
      SuccessEnvelope<{ localizationProfile: LocalizationProfile }>
    >(endpoints.localizationProfiles.get(String(id)));
    return withListMeta(response.data);
  }

  async create(
    body: CreateLocalizationProfileRequest,
  ): Promise<{ localizationProfile: LocalizationProfile }> {
    const response = await this.axios.post<
      SuccessEnvelope<{ localizationProfile: LocalizationProfile }>
    >(endpoints.localizationProfiles.create, body);
    return withListMeta(response.data);
  }

  async update(
    id: number,
    body: UpdateLocalizationProfileRequest,
  ): Promise<{ localizationProfile: LocalizationProfile }> {
    const response = await this.axios.put<
      SuccessEnvelope<{ localizationProfile: LocalizationProfile }>
    >(endpoints.localizationProfiles.update(String(id)), body);
    return withListMeta(response.data);
  }

  async delete(id: number): Promise<void> {
    await this.axios.delete(endpoints.localizationProfiles.delete(String(id)));
  }

  async taxTemplates(id: number): Promise<{ taxTemplateLines: LocalizationTaxTemplateLine[] }> {
    const response = await this.axios.get<
      SuccessEnvelope<{ taxTemplateLines: LocalizationTaxTemplateLine[] }>
    >(endpoints.localizationProfiles.taxTemplates(String(id)));
    return withListMeta(response.data);
  }

  async replaceTaxTemplates(
    id: number,
    lines: LocalizationTaxTemplateLineRequest[],
  ): Promise<{ taxTemplateLines: LocalizationTaxTemplateLine[] }> {
    const response = await this.axios.put<
      SuccessEnvelope<{ taxTemplateLines: LocalizationTaxTemplateLine[] }>
    >(endpoints.localizationProfiles.taxTemplates(String(id)), { lines });
    return withListMeta(response.data);
  }

  async apply(
    organizationId: number,
    id: number,
  ): Promise<{ localizationProfile: LocalizationProfile }> {
    const response = await this.axios.post<
      SuccessEnvelope<{ localizationProfile: LocalizationProfile }>
    >(endpoints.localizationProfiles.apply(String(organizationId), String(id)));
    return withListMeta(response.data);
  }
}
