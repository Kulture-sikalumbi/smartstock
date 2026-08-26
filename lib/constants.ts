import type { PaymentMethod } from "./types";

export const CATEGORIES = [
  "All",
  "Electronics",
  "Groceries",
  "Fashion",
  "Home & Living",
  "Beauty & Health",
  "Stationery",
] as const;

export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "MTN_MOMO",
    label: "MTN MoMo",
    description: "Pay with your MTN Mobile Money wallet",
    icon: "/mtn-logo.webp",
  },
  {
    value: "AIRTEL_MONEY",
    label: "Airtel Money",
    description: "Pay with your Airtel Money wallet",
    icon: "/airtel-logo.webp",
  },
  {
    value: "BANK_CARD",
    label: "Bank Card",
    description: "Pay with a Visa or Mastercard",
    icon: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg",
  },
];
