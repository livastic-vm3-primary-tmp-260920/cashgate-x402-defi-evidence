import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { inspectQuote } from "../lib/cashgate";

// Only four server-owned, fixed-route public reads; no caller-supplied URLs.
// No wallet connection, transaction submission or other payment capability.
export default defineAction({
  description: "Read one of four fixed public x402 HTTP 402 payment quotes and validate chain, genuine Base Circle USDC contract, amount and original owner recipient. Strictly read-only; never signs, pays or invokes arbitrary URLs.",
  mcpTool: true,
  requiresAuth: false,
  publicAgent: { expose: true, readOnly: true, requiresAuth: false, isConsequential: false },
  http: { method: "POST" },
  schema: z.object({ product: z.enum(["aave", "funding", "diff", "snapshot"]) }),
  run: async ({ product }) => inspectQuote(product),
});
