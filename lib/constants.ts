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
  networks?: { label: string; icon: string }[];
}[] = [
  {
    value: "MOBILE_MONEY",
    label: "Mobile Money",
    description: "MTN, Airtel, or Zamtel. Lipila detects your network from your number.",
    icon: "/mobile-money.svg",
    networks: [
      { label: "MTN MoMo", icon: "/mtn-logo.webp" },
      { label: "Airtel Money", icon: "/airtel-logo.webp" },
      { label: "Zamtel Kwacha", icon: "/zamtel-logo.webp" },
    ],
  },
];
