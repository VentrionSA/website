import { z } from "zod";
import { ENQUIRY_INTERESTS, ENQUIRY_ROLES } from "@/lib/content";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{6,32}$/;

/** Shared by the client form and the /api/enquiry route handler. */
export const enquiryFields = {
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "Please shorten your name to 120 characters."),
  company: z
    .string()
    .trim()
    .min(2, "Please enter your company name.")
    .max(160, "Please shorten the company name to 160 characters."),
  email: z
    .string()
    .trim()
    .max(200, "Please use a shorter email address.")
    .regex(EMAIL_PATTERN, "Please enter a valid business email address."),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Please enter a valid WhatsApp or phone number, including the country code."),
  country: z
    .string()
    .trim()
    .min(2, "Please enter your country.")
    .max(80, "Please shorten the country name."),
  role: z.enum(ENQUIRY_ROLES, { error: "Please select the option that best describes you." }),
  interest: z.enum(ENQUIRY_INTERESTS, { error: "Please select a commodity interest." }),
  volume: z.string().trim().max(160, "Please keep this under 160 characters.").optional().default(""),
  message: z
    .string()
    .trim()
    .min(10, "Please add a short message (at least 10 characters).")
    .max(4000, "Please keep your message under 4,000 characters."),
};

export const enquirySchema = z.object(enquiryFields);

export type EnquiryInput = z.input<typeof enquirySchema>;
export type Enquiry = z.output<typeof enquirySchema>;
export type EnquiryField = keyof typeof enquiryFields;

/** Spam-protection fields sent alongside the enquiry (never shown to people). */
export const spamFields = z.object({
  /** Honeypot — must stay empty. */
  website: z.string().max(0).optional().default(""),
  /** Epoch ms when the form was first rendered. */
  startedAt: z.number().int().positive(),
});

export const enquiryRequestSchema = enquirySchema.extend(spamFields.shape);

export type EnquiryResponse =
  | { ok: true; reference: string }
  | {
      ok: false;
      error: "validation" | "rate_limited" | "spam" | "not_configured" | "delivery_failed" | "bad_request";
      message: string;
      fieldErrors?: Partial<Record<EnquiryField, string>>;
    };

/** Flattens a zod error into one message per field. */
export function toFieldErrors(error: z.ZodError): Partial<Record<EnquiryField, string>> {
  const out: Partial<Record<EnquiryField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && key in enquiryFields && !out[key as EnquiryField]) {
      out[key as EnquiryField] = issue.message;
    }
  }
  return out;
}
