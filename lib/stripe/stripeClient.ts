import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
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
