import HomePage from "@/components/home/HomePage";

export function meta() {
  return [
    { title: "CashGate — Read-only x402 & Base USDC evidence" },
    { name: "description", content: "Review live x402 USDC price, token and payout terms, or verify public Base Circle USDC receipts. No keys, no signing, no transfers." },
    { property: "og:title", content: "CashGate — Know what you're paying for" },
    { property: "og:description", content: "Agent-native read-only crypto payment evidence: fixed DeFi APIs and public Base receipts." },
  ];
}
export default function HomeRoute() { return <HomePage />; }
