/**
 * FlexPay (flexpay.cd) — Mobile Money RDC client.
 *
 * Env:
 *   FLEXPAY_TOKEN          Bearer token (sandbox/prod)
 *   FLEXPAY_MERCHANT_CODE  merchant identifier
 *   FLEXPAY_BASE_URL       defaults to the sandbox payment service
 *   FLEXPAY_CURRENCY       USD | CDF (default USD)
 *   API_PUBLIC_URL         public base URL used for the webhook callback
 *
 * When the token/merchant are absent we run in MOCK mode: payments are
 * "initiated" and reported successful locally so the flow is testable without
 * real credentials (useful for sandbox dev and CI).
 */

const BASE_URL = process.env.FLEXPAY_BASE_URL || 'https://backend.flexpay.cd/api/rest/v1/paymentService';
const TOKEN = process.env.FLEXPAY_TOKEN || '';
const MERCHANT = process.env.FLEXPAY_MERCHANT_CODE || '';
const CURRENCY = process.env.FLEXPAY_CURRENCY || 'USD';
const CALLBACK_URL = (process.env.API_PUBLIC_URL || 'http://localhost:3001') + '/webhooks/flexpay';

export const FLEXPAY_CALLBACK_URL = CALLBACK_URL;
export function isFlexPayConfigured(): boolean {
  return Boolean(TOKEN && MERCHANT);
}

export type FlexPayStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface InitiateInput {
  phone: string;       // international, e.g. 243810000000
  amount: number;
  reference: string;   // our internal reference
}
export interface InitiateResult {
  orderNumber: string;
  mock: boolean;
  message?: string;
}

/** Push a Mobile Money payment request to the customer's phone. */
export async function initiatePayment(input: InitiateInput): Promise<InitiateResult> {
  if (!isFlexPayConfigured()) {
    return { orderNumber: `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, mock: true, message: 'Mode mock (FlexPay non configuré)' };
  }
  const res = await fetch(`${BASE_URL}/vers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({
      merchant: MERCHANT,
      type: '1', // 1 = mobile money
      phone: input.phone,
      reference: input.reference,
      amount: String(input.amount),
      currency: CURRENCY,
      callbackUrl: CALLBACK_URL,
    }),
  });
  const data = (await res.json()) as { code?: string; message?: string; orderNumber?: string };
  if (!res.ok || data.code !== '0' || !data.orderNumber) {
    throw new Error(data.message || `FlexPay a refusé l'initiation (HTTP ${res.status})`);
  }
  return { orderNumber: data.orderNumber, mock: false, message: data.message };
}

/** Poll a transaction's status by orderNumber. */
export async function checkStatus(orderNumber: string): Promise<FlexPayStatus> {
  if (!isFlexPayConfigured() || orderNumber.startsWith('MOCK-')) {
    return 'SUCCESS'; // mock transactions settle immediately
  }
  const res = await fetch(`${BASE_URL}/check/${encodeURIComponent(orderNumber)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const data = (await res.json()) as { code?: string; transaction?: { status?: string } };
  return mapStatus(data.code, data.transaction?.status);
}

/** Normalise a FlexPay callback/check payload to our status enum. */
export function mapStatus(code?: string, transactionStatus?: string): FlexPayStatus {
  // FlexPay convention: "0" = success. A transaction object present with a
  // non-zero status means the attempt failed; otherwise it's still pending.
  if (transactionStatus === '0' || code === '0') return 'SUCCESS';
  if (transactionStatus !== undefined && transactionStatus !== '0') return 'FAILED';
  return 'PENDING';
}
