"use client";

import { LegalDocument } from "../../_components/legal-document";
import { PRIVACY_SECTIONS } from "./privacy-utils";

export function PrivacySection() {
  return (
    <LegalDocument
      namespace="privacy"
      email="privacy@swantara.com"
      sections={PRIVACY_SECTIONS}
      relatedLinks={[
        { labelKey: "terms", href: "/terms" },
        { labelKey: "dpa", href: "/dpa" },
      ]}
    />
  );
}
