"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, CircleAlert, LoaderCircle } from "lucide-react";
import { enquiryFields, enquirySchema, toFieldErrors, type EnquiryField, type EnquiryResponse } from "@/lib/enquiry";
import { getWhatsAppHref } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";

type Values = Record<EnquiryField, string>;
type Status = "idle" | "submitting" | "success" | "error";

const INITIAL: Values = {
  fullName: "",
  company: "",
  email: "",
  phone: "",
  country: "",
  message: "",
};

const EASE = [0.22, 1, 0.36, 1] as const;

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p
          id={id}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-2 text-[12.5px] text-alert"
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

export function EnquiryForm() {
  const uid = useId();
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<EnquiryField, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverMessage, setServerMessage] = useState("");
  const [reference, setReference] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const startedAt = useRef<number>(0);
  const formRef = useRef<HTMLFormElement>(null);
  const whatsapp = getWhatsAppHref();

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const id = (name: string) => `${uid}-${name}`;

  const validateField = (name: EnquiryField, value: string) => {
    const result = enquiryFields[name].safeParse(value);
    setErrors((e) => ({ ...e, [name]: result.success ? undefined : result.error.issues[0]?.message }));
  };

  const onChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = event.target.name as EnquiryField;
    const value = event.target.value;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) validateField(name, value);
  };

  const onBlur = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const name = event.target.name as EnquiryField;
    if (event.target.value) validateField(name, event.target.value);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    const parsed = enquirySchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      setErrors(fieldErrors);
      setStatus("idle");
      const first = Object.keys(fieldErrors)[0];
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus("submitting");
    setServerMessage("");
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, website: honeypot, startedAt: startedAt.current }),
      });
      const data = (await response.json().catch(() => null)) as EnquiryResponse | null;
      if (response.ok && data?.ok) {
        setReference(data.reference);
        setStatus("success");
        setValues(INITIAL);
        return;
      }
      if (data && !data.ok && data.fieldErrors) setErrors(data.fieldErrors);
      setServerMessage(
        data && !data.ok ? data.message : "We could not submit your enquiry right now. Please try again, or contact us on WhatsApp.",
      );
      setStatus("error");
    } catch {
      setServerMessage("We could not reach our servers. Please check your connection and try again, or contact us on WhatsApp.");
      setStatus("error");
    }
  };

  const inputProps = (name: EnquiryField) => ({
    id: id(name),
    name,
    value: values[name],
    onChange,
    onBlur,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? id(`${name}-error`) : undefined,
    className: "field-input",
  });

  const label = (name: EnquiryField, text: string) => (
    <label htmlFor={id(name)} className="eyebrow block text-[10px] text-mist">
      {text}
      <span className="text-mist"> *</span>
    </label>
  );

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="flex min-h-[520px] flex-col justify-center border border-line bg-graphite/60 p-8 sm:p-12"
        role="status"
        aria-live="polite"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-mark text-mark">
          <Check className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h3 className="display-md mt-8 text-ivory">Thank you. Your enquiry has been received.</h3>
        <p className="mt-5 max-w-md leading-relaxed text-mist">
          We will be in touch using the details you provided.
        </p>
        {reference ? (
          <p className="eyebrow mt-8 text-[10px] text-mist">
            Reference <span className="ml-2 font-mono text-[12px] normal-case tracking-normal text-ivory">{reference}</span>
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setReference("");
            startedAt.current = Date.now();
          }}
          className="link-draw mt-10 self-start text-[11px] font-semibold uppercase tracking-[0.24em] text-ivory"
        >
          Submit another enquiry
        </button>
      </motion.div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative border border-line bg-graphite/60 p-6 sm:p-10 lg:p-12" aria-describedby={id("form-note")}>
      {/* Honeypot — hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={id("website")}>Website</label>
        <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
        <div>
          {label("fullName", "Full name")}
          <input {...inputProps("fullName")} type="text" autoComplete="name" placeholder="Your full name" />
          <FieldError id={id("fullName-error")} message={errors.fullName} />
        </div>
        <div>
          {label("company", "Company name")}
          <input {...inputProps("company")} type="text" autoComplete="organization" placeholder="Company" />
          <FieldError id={id("company-error")} message={errors.company} />
        </div>
        <div>
          {label("email", "Business email")}
          <input {...inputProps("email")} type="email" autoComplete="email" inputMode="email" placeholder="name@company.com" />
          <FieldError id={id("email-error")} message={errors.email} />
        </div>
        <div>
          {label("phone", "WhatsApp / phone number")}
          <input {...inputProps("phone")} type="tel" autoComplete="tel" inputMode="tel" placeholder="+ country code and number" />
          <FieldError id={id("phone-error")} message={errors.phone} />
        </div>
        <div className="sm:col-span-2">
          {label("country", "Country")}
          <input {...inputProps("country")} type="text" autoComplete="country-name" placeholder="Country of operation" />
          <FieldError id={id("country-error")} message={errors.country} />
        </div>

        <div className="sm:col-span-2">
          {label("message", "Message")}
          <textarea {...inputProps("message")} rows={4} placeholder="Your message" />
          <FieldError id={id("message-error")} message={errors.message} />
        </div>
      </div>

      <AnimatePresence>
        {status === "error" && serverMessage ? (
          <motion.div
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-10 flex gap-4 border border-alert/40 bg-alert/[0.06] p-5 text-sm leading-relaxed text-ivory/90">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-alert" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <p>{serverMessage}</p>
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="link-draw mt-3 inline-flex text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory">
                    Continue on WhatsApp
                  </a>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-10 flex flex-col-reverse gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p id={id("form-note")} className="max-w-sm text-[12px] leading-relaxed text-mist/80">
          Fields marked <span className="text-ivory">*</span> are required. Your details are used only to respond to this
          enquiry — see our{" "}
          <a href="/privacy" className="underline decoration-line-strong underline-offset-4 hover:text-ivory">
            Privacy Policy
          </a>
          .
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="group inline-flex items-center justify-center gap-4 bg-burgundy px-8 py-[1.1rem] text-[11px] font-semibold uppercase tracking-[0.24em] text-paper transition-colors duration-500 hover:bg-burgundy-deep disabled:cursor-wait disabled:opacity-70"
        >
          {status === "submitting" ? (
            <>
              Submitting
              <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
            </>
          ) : (
            <>
              Request an Introduction
              <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={1.5} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {status === "submitting" ? "Submitting your enquiry…" : ""}
      </p>
      {!whatsapp ? null : (
        <p className="mt-8 flex items-center gap-3 border-t border-line pt-6 text-[13px] text-mist sm:hidden">
          <WhatsAppIcon className="h-4 w-4 text-whatsapp" /> Prefer to chat?{" "}
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-ivory underline underline-offset-4">
            Message us on WhatsApp
          </a>
        </p>
      )}
    </form>
  );
}
