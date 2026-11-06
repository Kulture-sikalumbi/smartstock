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
    value: "MOBILE_MONEY",
    label: "Mobile Money",
    description: "MTN, Airtel, or Zamtel. Lipila detects your network from your number.",
    icon: "/mobile-money.svg",
  },
  {
    value: "BANK_CARD",
    label: "Bank Card",
    description: "Pay with a Visa or Mastercard",
    icon: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg",
  },
];
