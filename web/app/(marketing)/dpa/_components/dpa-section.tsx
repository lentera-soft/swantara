"use client";

import { LegalDocument } from "../../_components/legal-document";
import { DPA_SECTIONS } from "./dpa-utils";

export function DpaSection() {
  return (
    <LegalDocument
      namespace="dpa"
      email="dpa@swantara.com"
      sections={DPA_SECTIONS}
      relatedLinks={[
        { labelKey: "privacy", href: "/privacy" },
        { labelKey: "terms", href: "/terms" },
      ]}
    />
  );
}
