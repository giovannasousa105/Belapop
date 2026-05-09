import Stripe from "stripe";

const normalizeEnvValue = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  return trimmed.startsWith("\"") && trimmed.endsWith("\"")
    ? trimmed.slice(1, -1).trim()
    : trimmed;
};

const secretKey = normalizeEnvValue(process.env.STRIPE_SECRET_KEY);
let stripeInstance: Stripe | null = null;

export const getStripe = () => {
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not defined.");
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-12-15.clover"
    });
  }
  return stripeInstance;
};

export const getNormalizedEnvValue = normalizeEnvValue;
