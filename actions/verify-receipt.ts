import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { verifyReceipt } from "../lib/cashgate";

// One public Base RPC, one fixed genuine Circle Base USDC contract, one seller.
// A caller can supply ONLY a public 32-byte transaction hash, not an RPC URL.
export default defineAction({
  description: "Read-only, independently confirm one public Base transaction's finalized native Circle USDC Transfer log to the seller's disclosed receiving wallet. Does not certify customers, delivery or net profit. Never signs, sends or receives private keys.",
  mcpTool: true,
  requiresAuth: false,
  publicAgent: { expose: true, readOnly: true, requiresAuth: false, isConsequential: false },
  http: { method: "POST" },
  schema: z.object({ txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/) }),
  run: async ({ txHash }) => verifyReceipt(txHash),
});
