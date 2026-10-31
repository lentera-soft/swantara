import { z } from "zod";

export const contactInquiryFormSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  company: z.string().trim(),
  message: z.string().trim().min(1),
});

export type ContactInquiryFormValues = z.infer<typeof contactInquiryFormSchema>;

export const CONTACT_DEFAULT_VALUES: ContactInquiryFormValues = {
  name: "",
  email: "",
  company: "",
  message: "",
};

export const CONTACT_DIRECTORY_CELLS = [
  {
    id: "sales",
    index: "01",
    titleKey: "salesTitle",
    descriptionKey: "salesDescription",
    detailKey: "salesEmail",
    isEmail: true,
  },
  {
    id: "support",
    index: "02",
    titleKey: "supportTitle",
    descriptionKey: "supportDescription",
    detailKey: "supportEmail",
    isEmail: true,
  },
  {
    id: "visit",
    index: "03",
    titleKey: "visitTitle",
    descriptionKey: "visitDescription",
    detailKey: "responseTime",
    isEmail: false,
  },
  {
    id: "hours",
    index: "04",
    titleKey: "hoursTitle",
    descriptionKey: "hoursDescription",
    detailKey: "responseTime",
    isEmail: false,
  },
] as const;
