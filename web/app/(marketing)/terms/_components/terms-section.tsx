"use client";

import { LegalDocument } from "../../_components/legal-document";
import { TERMS_SECTIONS } from "./terms-utils";

export function TermsSection() {
  return (
    <LegalDocument
      namespace="terms"
      email="legal@swantara.com"
      sections={TERMS_SECTIONS}
      relatedLinks={[
        { labelKey: "privacy", href: "/privacy" },
        { labelKey: "dpa", href: "/dpa" },
      ]}
    />
  );
}
