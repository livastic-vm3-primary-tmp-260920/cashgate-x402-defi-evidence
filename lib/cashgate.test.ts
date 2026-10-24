import { describe, expect, it } from "vitest";
import {
  inspectQuote, verifyReceipt, PRODUCTS, ORIGINAL_WALLET, CIRCLE_USDC_BASE,
} from "./cashgate";

const origin = "https://vm5-openapi-x402.onrender.com";
const demoHash = "0x0cf2906aa5cc7fc8978b81307e61d2569e0759452b41c09f2dcae8cb87721edd";
const digest = "0x" + "7b".repeat(32);
const payAddressTopic = "0x" + "0".repeat(24) + ORIGINAL_WALLET.slice(2).toLowerCase();
const otherTopic = "0x" + "0".repeat(24) + "171d8021b98c53dcbb3c9c30cbbbeb1b01850fca";
const transfer = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function quoteFor(route: keyof typeof PRODUCTS) {
  return {
    x402Version: 2, resource: { url: origin + PRODUCTS[route].path },
    accepts: [{
      scheme: "exact", network: "eip155:8453", asset: CIRCLE_USDC_BASE, amount: PRODUCTS[route].expectedAmount,
      payTo: ORIGINAL_WALLET, extra: { name: "USD Coin", version: "2" },
    }],
  };
}
function quoteFetch(product: keyof typeof PRODUCTS, mutate?: (j: ReturnType<typeof quoteFor>) => void) {
  const quote = quoteFor(product);
  if (mutate) mutate(quote);
  const wire = Buffer.from(JSON.stringify(quote)).toString("base64");
  return async (url: RequestInfo | URL, opts?: RequestInit) => {
    expect(url).toBe(origin + PRODUCTS[product].path);
    expect(opts?.method).toBe("GET");
    expect(opts?.redirect).toBe("error");
    expect(JSON.stringify(opts)).not.toContain("private");
    return new Response(JSON.stringify(quote), { status: 402, headers: {
      "content-type": "application/json", "PAYMENT-REQUIRED": wire, "X-Payment-Required": wire,
    } });
  };
}
function rpcMock(config: { chain?: string; token?: string; dst?: string; success?: string; blockHash?: string; logs?: unknown[] } = {}) {
  const seen: string[] = [];
  const fn = async (url: RequestInfo | URL, opts?: RequestInit) => {
    expect(url).toBe("https://base-rpc.publicnode.com");
    expect(opts?.method).toBe("POST");
    const data = JSON.parse(String(opts?.body));
    seen.push(data.method);
    const log = { transactionHash: demoHash, address: config.token || CIRCLE_USDC_BASE,
      topics: [transfer, otherTopic, config.dst || payAddressTopic], data: "0x2710", logIndex: "0x5a" };
    let result: unknown = null;
    switch (data.method) {
      case "eth_chainId": result = config.chain ?? "0x2105"; break;
      case "eth_getTransactionReceipt": result = { transactionHash: demoHash, status: config.success ?? "0x1",
        blockNumber: "0x100", blockHash: digest, logs: config.logs ?? [log] }; break;
      case "eth_blockNumber": result = "0x110"; break;
      case "eth_getBlockByNumber": result = { hash: config.blockHash ?? digest, number: "0x100", timestamp: "0x68a0cb00" }; break;
      default: throw new Error("Unexpected RPC method " + data.method);
    }
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: data.id, result }), { status: 200, headers: { "content-type": "application/json" } });
  };
  return { fn, seen };
}
describe("CashGate fixed x402 quote desk", () => {
  it("accepts each of 4 canonical unpaid original-vendor quotes, never pays", async () => {
    for (const product of ["aave","funding","diff","snapshot"] as const) {
      const outcome = await inspectQuote(product, quoteFetch(product));
      expect(outcome.decision).toBe("PASS");
      expect(outcome.httpStatus).toBe(402);
      expect(outcome.quotedUSDC).toBe(product === "snapshot" ? "0.005000" : "0.010000");
      expect(outcome.paid).toBe(false);
      expect(outcome.newSale).toBe(false);
    }
  });
  it("blocks price substitution before wallet approval", async () => {
    const outcome = await inspectQuote("aave", quoteFetch("aave", q => q.accepts[0].amount = "20000"));
    expect(outcome.decision).toBe("BLOCK");
    expect(outcome.reasons.join("|")).toContain("Listed micro-price unchanged");
  });
  it("blocks a substituted payee or wrong chain even with valid 402", async () => {
    for (const key of ["payTo","network"] as const) {
      const outcome = await inspectQuote("funding", quoteFetch("funding", q => {
        if (key === "payTo") q.accepts[0].payTo = "0x" + "1".repeat(40);
        else q.accepts[0].network = "eip155:1";
      }));
      expect(outcome.decision).toBe("BLOCK");
    }
  });
  it("rejects arbitrary product IDs without requesting network", async () => {
    await expect(inspectQuote("http://evil" as never, async () => { throw Error("network called"); })).rejects.toThrow(/four selected/);
  });
});
describe("CashGate on-chain receipts, no custody", () => {
  it("confirms known-shaped Base USDC transfer only after canonical block checks", async () => {
    const f = rpcMock();
    const outcome = await verifyReceipt(demoHash, f.fn);
    expect(outcome.decision).toBe("CONFIRMED");
    expect(outcome.incomingUSDC).toBe("0.010000");
    expect(outcome.logIndices).toEqual([90]);
    expect(outcome.confirmations).toBe(16);
    expect(outcome.verifiedPublicTransfer).toBe(true);
    expect(outcome.receiptIsNotProfit).toBe(true);
    expect(f.seen).toEqual(["eth_chainId", "eth_getTransactionReceipt","eth_blockNumber","eth_getBlockByNumber"]);
  });
  it("rejects malformed transaction hashes without network", async () => {
    await expect(verifyReceipt("my private key", async () => { throw Error("network called"); })).rejects.toThrow(/transaction hash/);
  });
  it("does not count wrong Circle token, destination, or 0x0 transaction", async () => {
    for (const config of [{ token: "0x" + "2".repeat(40) }, { dst: "0x" + "0".repeat(24) + "a".repeat(40) }, { success:"0x0" }]) {
      const outcome = await verifyReceipt(demoHash,rpcMock(config).fn);
      expect(outcome.decision).toBe("NO_MATCH");
      expect(outcome.verifiedPublicTransfer).toBe(false);
    }
  });
  it("rejects a receipt with a mismatched block hash or wrong RPC chain", async () => {
    for (const config of [{ blockHash: "0x" + "1".repeat(64) }, { chain: "0x1" }]) {
      const outcome = await verifyReceipt(demoHash,rpcMock(config).fn);
      expect(outcome.decision).toBe("UNKNOWN");
      expect(outcome.verifiedPublicTransfer).toBe(false);
    }
  });
});
