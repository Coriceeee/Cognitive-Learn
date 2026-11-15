/** Student-facing product-consent contract (not research enrolment or verified guardian consent). */
export const STUDENT_NOTICE_VERSION = "cla-student-privacy-v1" as const;

export type ProductConsentState = "accepted" | "withdrawn" | "outdated" | "missing";

type UnknownDocument = Record<string, unknown> | null | undefined;

export function readProductConsent(value: UnknownDocument, uid: string): ProductConsentState {
  if (!value || value.userId !== uid || value.schemaVersion !== 1) return "missing";
  if (value.noticeVersion !== STUDENT_NOTICE_VERSION) return "outdated";
  if (value.productAccepted === true && value.researchConsent === false) return "accepted";
  return "withdrawn";
}

export function createProductConsentRecord(uid: string, accepted: boolean, updatedAt: unknown) {
  if (!uid.trim()) throw new Error("Missing authenticated student UID");
  return {
    userId: uid,
    schemaVersion: 1,
    noticeVersion: STUDENT_NOTICE_VERSION,
    productAccepted: accepted,
    // Intentional: research enrollment is a separate, not-yet-implemented workflow.
    researchConsent: false,
    updatedAt,
  };
}
