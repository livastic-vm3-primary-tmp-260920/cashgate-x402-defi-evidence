/**
 * CashGate — inspect Base-native USDC x402 terms and independently verify
 * a public ERC20 transfer without wallet privileges.
 *
 * All seller URLs and both RPC endpoints are statically allowlisted.
 * No arbitrary URL fetches, seeds, signatures, wallet connections, API keys,
 * custody, payment execution, on-chain writes or irreversible operations.
 * This software is an advisory proof-reading UI, not a safety certification.
 */
export const ORIGINAL_WALLET = "0x4e3106520E40af30870caFE78da1B1e7110eD98E";
export const CIRCLE_USDC_BASE = "0x833589fCD6eDb6E08f4C7C32D4f71b54bdA02913";
export const BASE_CHAIN = "eip155:8453";
const ORIGIN = "https://vm5-openapi-x402.onrender.com";
export const PRODUCTS = Object.freeze({
  aave: { title: "Aave V3 · upgradeability facts", path: "/v1/aave-base-proxy-facts", expectedAmount: "10000", kind: "DeFi / Security" },
  funding: { title: "BTC funding · 4 live venues", path: "/v1/btc-funding-four-venues", expectedAmount: "10000", kind: "DeFi / Markets" },
  diff: { title: "X Layer · CPU0 state diff", path: "/v1/tapeout-cpu0-diff", expectedAmount: "10000", kind: "DeFi / On-chain" },
  snapshot: { title: "X Layer · source-pinned snapshot", path: "/v1/tapeout-cpu0-report", expectedAmount: "5000", kind: "On-chain / Evidence" },
});
export type Product = keyof typeof PRODUCTS;
const hex40 = /^0x[\da-fA-F]{40}$/;
const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const RPC = "https://base-rpc.publicnode.com";
const MAX_QUOTE_BYTES = 20000;
const MAX_RPC_BYTES = 210000;
const READ_TIMEOUT = 14000;

export function isProduct(p: string): p is Product { return Object.prototype.hasOwnProperty.call(PRODUCTS, p); }
export type SafetyDecision = "PASS" | "REVIEW" | "BLOCK";
export type QuoteResult = {
  product: Product;
  title: string;
  method: "GET";
  url: string;
  httpStatus: number;
  decision: SafetyDecision;
  reasons: string[];
  checks: { label: string; pass: boolean; detail: string }[];
  quotedUSDC: string | null;
  payTo: string | null;
  token: string | null;
  network: string | null;
  canonicalChallenge: boolean;
  paid: false;
  newSale: false;
  atUTC: string;
  guidance: string;
};

function safeJSON(raw: string): unknown { try { return JSON.parse(raw); } catch { return null; } }
function toString(value: unknown): string | null { return typeof value === "string" ? value : null; }
function withinSize(raw: string, cap: number) { return raw.length <= cap; }

/** Decode strict base64 without a Buffer dependency in browser routes. */
function decodeCanonicalQuote(header: string) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(header) || header.length > MAX_QUOTE_BYTES || header.length % 4 !== 0)
    throw new Error("Malformed canonical x402 header");
  const text = Buffer.from(header, "base64").toString("utf8");
  if (text.length > MAX_QUOTE_BYTES) throw new Error("Oversized payment challenge");
  return safeJSON(text);
}

export async function inspectQuote(product: Product, request: typeof fetch = fetch): Promise<QuoteResult> {
  if (!isProduct(product)) throw new Error("Only the four selected, fixed merchant routes are permitted");
  const info = PRODUCTS[product];
  const url = ORIGIN + info.path;
  const checks: QuoteResult["checks"] = [];
  const reasons: string[] = [];
  let httpStatus = 0;
  let quotedUSDC: string | null = null;
  let payTo: string | null = null;
  let token: string | null = null;
  let network: string | null = null;
  let canonicalChallenge = false;
  const check = (label: string, pass: boolean, detail: string) => { checks.push({ label, pass, detail }); if (!pass) reasons.push(label + ": " + detail); };
  try {
    const response = await request(url, {
      method: "GET", redirect: "error", signal: AbortSignal.timeout(READ_TIMEOUT),
      headers: { Accept: "application/json", "User-Agent": "CashGate-one-human-public-readonly-v0.1" },
    });
    httpStatus = response.status;
    check("Unpaid HTTP 402", httpStatus === 402, `Got HTTP ${httpStatus}; never treat a non-402 response as permission to spend.`);
    const header = response.headers.get("PAYMENT-REQUIRED");
    check("Canonical payment header", !!header, header ? "Present" : "Missing PAYMENT-REQUIRED");
    if (!header) throw new Error("Cannot inspect absent payment challenge");
    const rawBody = await response.text();
    check("Bounded response", withinSize(rawBody, MAX_QUOTE_BYTES), `${rawBody.length} characters`);
    if (!withinSize(rawBody, MAX_QUOTE_BYTES)) throw new Error("Oversized payment challenge body");
    const quote = decodeCanonicalQuote(header);
    const object = quote && typeof quote === "object" && !Array.isArray(quote) ? quote as Record<string, any> : null;
    check("Parseable canonical JSON", !!object, object ? "Valid JSON" : "Missing/invalid JSON");
    if (!object) throw new Error("Invalid canonical quote");
    check("x402 protocol version", object.x402Version === 2, `Received version ${String(object.x402Version)}`);
    const resource = toString(object.resource?.url);
    check("Bound to exact published route", resource === url, `Quote resource ${resource || "missing"}`);
    const accepts = Array.isArray(object.accepts) ? object.accepts : [];
    check("Exactly one accepted payment", accepts.length === 1, `Found ${accepts.length} alternatives`);
    const acceptance = accepts.length === 1 && accepts[0] && typeof accepts[0] === "object" ? accepts[0] as Record<string, unknown> : {};
    const scheme = toString(acceptance.scheme);
    check("Exact-value payment scheme", scheme === "exact", scheme || "missing");
    network = toString(acceptance.network);
    check("Pinned Base mainnet", network === BASE_CHAIN, network || "missing");
    token = toString(acceptance.asset);
    check("Genuine Circle USDC", !!token && hex40.test(token) && token.toLowerCase() === CIRCLE_USDC_BASE.toLowerCase(), token || "missing");
    payTo = toString(acceptance.payTo);
    check("Original merchant's disclosed wallet", !!payTo && hex40.test(payTo) && payTo.toLowerCase() === ORIGINAL_WALLET.toLowerCase(), payTo || "missing");
    const atomic = toString(acceptance.amount);
    check("Listed micro-price unchanged", atomic === info.expectedAmount, `${atomic || "missing"} atomic units; expected ${info.expectedAmount}`);
    quotedUSDC = atomic && /^\d{1,9}$/.test(atomic) ? (Number(atomic) / 1_000_000).toFixed(6) : null;
    const eip712 = acceptance.extra && typeof acceptance.extra === "object" ? acceptance.extra as Record<string, unknown> : {};
    check("Circle USDC EIP-712 identity", eip712.name === "USD Coin" && eip712.version === "2", `${String(eip712.name)} / ${String(eip712.version)}`);
    const legacy = response.headers.get("X-Payment-Required");
    check("Legacy header alias, if any", !legacy || legacy === header, legacy ? "Compared to canonical header" : "Absent (optional)");
    const parsedBody = safeJSON(rawBody);
    canonicalChallenge = parsedBody !== null && JSON.stringify(parsedBody) === JSON.stringify(object);
    check("402 body mirrors canonical quote", canonicalChallenge, canonicalChallenge ? "Identical public terms" : "Body differs or cannot be decoded");
  } catch (error) {
    check("Network and JSON-RPC preflight", false, error instanceof Error ? error.message : "Unknown merchant response error");
  }
  const decision: SafetyDecision = checks.every(c => c.pass) ? "PASS" : "BLOCK";
  return { product, title: info.title, method: "GET", url, httpStatus, decision, checks, reasons,
    quotedUSDC, payTo, token, network, canonicalChallenge, paid: false, newSale: false,
    atUTC: new Date().toISOString(),
    guidance: decision === "PASS"
      ? "Read-only quote verified against publicly disclosed seller terms. This is NOT a recommendation or proof of safety. Any purchase needs separate, explicit buyer authorization, not available in CashGate."
      : "Do not authorize or send funds. The fixed quote is incomplete, modified or unavailable. Recheck the original seller and your own risk limits outside this app.",
  };
}

export type ReceiptResult = {
  txHash: string; decision: "CONFIRMED" | "NO_MATCH" | "UNKNOWN";
  chain: typeof BASE_CHAIN; receiptStatus: number | null;
  blockNumber: number | null; confirmations: number | null; timestampUTC: string | null;
  payee: typeof ORIGINAL_WALLET; token: typeof CIRCLE_USDC_BASE;
  incomingAtomic: string; incomingUSDC: string; logIndices: number[];
  incomingSources: string[]; verifiedPublicTransfer: boolean;
  receiptIsNotProfit: true; atUTC: string;
  warnings: string[]; explorer: string;
};

export async function verifyReceipt(txHash: string, request: typeof fetch = fetch): Promise<ReceiptResult> {
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) throw new Error("Enter a full 0x-prefixed 32-byte transaction hash. Never enter a private key.");
  const hash = txHash.toLowerCase();
  let id = 0;
  const rpc = async (method: string, params: unknown[]) => {
    // Each in-flight request must retain its OWN ID. A mutable global id in
    // post-await validation misclassifies legitimate parallel RPC responses.
    const requestId = ++id;
    const result = await request(RPC, { method: "POST", redirect: "error", signal: AbortSignal.timeout(READ_TIMEOUT),
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params }) });
    if (result.status !== 200 || !(result.headers.get("content-type") || "").includes("json")) throw new Error("Public Base RPC unavailable");
    const raw = await result.text();
    if (!withinSize(raw, MAX_RPC_BYTES)) throw new Error("Oversized RPC response");
    const data = safeJSON(raw) as { jsonrpc?: string; id?: number; result?: unknown; error?: unknown } | null;
    if (!data || data.id !== requestId || data.jsonrpc !== "2.0" || data.error) throw new Error("Bad RPC identity/result");
    return data.result;
  };
  const now = new Date().toISOString();
  const base: ReceiptResult = { txHash: hash, decision: "UNKNOWN", chain: BASE_CHAIN, receiptStatus: null, blockNumber: null,
    confirmations: null, timestampUTC: null, payee: ORIGINAL_WALLET, token: CIRCLE_USDC_BASE,
    incomingAtomic: "0", incomingUSDC: "0.000000", logIndices: [], incomingSources: [],
    verifiedPublicTransfer: false, receiptIsNotProfit: true, atUTC: now,
    warnings: [], explorer: `https://basescan.org/tx/${hash}` };
  try {
    const chain = await rpc("eth_chainId", []);
    if (chain !== "0x2105") throw new Error("RPC chain is not Base mainnet 8453");
    const result = await rpc("eth_getTransactionReceipt", [hash]);
    if (!result || typeof result !== "object") { base.decision = "NO_MATCH"; base.warnings.push("No confirmed on-chain receipt exists for this hash yet."); return base; }
    const receipt = result as Record<string, unknown>;
    if (toString(receipt.transactionHash)?.toLowerCase() !== hash) throw new Error("RPC receipt hash mismatch");
    const hexStatus = toString(receipt.status);
    base.receiptStatus = hexStatus === "0x1" ? 1 : hexStatus === "0x0" ? 0 : null;
    if (base.receiptStatus !== 1) { base.decision = "NO_MATCH"; base.warnings.push("Transaction failed or was not successful. No settled payment can be claimed."); return base; }
    const blockText = toString(receipt.blockNumber);
    if (!blockText || !/^0x[\da-fA-F]{1,14}$/.test(blockText)) throw new Error("No canonical finalized block number");
    base.blockNumber = Number(BigInt(blockText));
    const logs = Array.isArray(receipt.logs) ? receipt.logs : [];
    if (logs.length > 3000) throw new Error("Receipt log count exceeds safe parsing limit");
    const sources = new Set<string>();
    let sum = 0n;
    for (const value of logs) {
      if (!value || typeof value !== "object") continue;
      const log = value as Record<string, unknown>;
      const topics = Array.isArray(log.topics) ? log.topics as unknown[] : [];
      const destinationTopic = toString(topics[2]);
      const sourceTopic = toString(topics[1]);
      const logIndex = toString(log.logIndex);
      if (toString(log.address)?.toLowerCase() !== CIRCLE_USDC_BASE.toLowerCase() || !Array.isArray(log.topics) || log.topics.length !== 3 ||
        toString(log.topics[0])?.toLowerCase() !== transferTopic.toLowerCase() ||
        !destinationTopic || !/^0x0{24}[0-9a-fA-F]{40}$/.test(destinationTopic) ||
        destinationTopic.slice(-40).toLowerCase() !== ORIGINAL_WALLET.slice(2).toLowerCase() ||
        !sourceTopic || !/^0x0{24}[0-9a-fA-F]{40}$/.test(sourceTopic) ||
        !logIndex || !/^0x[0-9a-fA-F]{1,8}$/.test(logIndex) ||
        toString(log.transactionHash)?.toLowerCase() !== hash) continue;
      const rawAmount = toString(log.data);
      if (!rawAmount || !/^0x[\da-fA-F]{1,64}$/.test(rawAmount)) continue;
      const amount = BigInt(rawAmount);
      if (amount <= 0n || amount >= 100_000_000_000_000_000n) continue;
      sum += amount;
      base.logIndices.push(Number(BigInt(logIndex)));
      sources.add("0x" + sourceTopic.slice(-40).toLowerCase());
    }
    base.incomingAtomic = sum.toString();
    base.incomingUSDC = (sum / 1000000n).toString() + "." + (sum % 1000000n).toString().padStart(6, "0");
    base.incomingSources = [...sources];
    const [head, block] = await Promise.all([rpc("eth_blockNumber", []), rpc("eth_getBlockByNumber", [blockText, false])]);
    if (typeof head !== "string" || !/^0x[\da-fA-F]{1,14}$/.test(head)) throw new Error("Unverifiable Base head");
    const confirmations = Number(BigInt(head) - BigInt(blockText));
    if (!Number.isSafeInteger(confirmations) || confirmations < 0) throw new Error("Block is not on the observed Base head");
    base.confirmations = confirmations;
    if (!block || typeof block !== "object" ||
        toString((block as Record<string, unknown>).number)?.toLowerCase() !== blockText.toLowerCase() ||
        !/^0x[0-9a-fA-F]{64}$/.test(toString((block as Record<string, unknown>).hash) || "") ||
        toString((block as Record<string, unknown>).hash)?.toLowerCase() !== toString(receipt.blockHash)?.toLowerCase())
      throw new Error("Canonical block hash mismatch; cannot confirm receipt against Base head");
    const timestamp = toString((block as Record<string, unknown>).timestamp);
    if (!timestamp || !/^0x[\da-fA-F]{1,14}$/.test(timestamp)) throw new Error("Malformed block timestamp");
    base.timestampUTC = new Date(Number(BigInt(timestamp)) * 1000).toISOString();
    if (sum > 0n && confirmations >= 6) { base.decision = "CONFIRMED"; base.verifiedPublicTransfer = true; }
    else { base.decision = "NO_MATCH"; base.warnings.push(sum === 0n ? "No native Base Circle USDC transfer to the disclosed seller wallet in this transaction." : "Too few Base confirmation blocks; re-check without signing or transferring funds."); }
  } catch (error) { base.decision = "UNKNOWN"; base.warnings.push(error instanceof Error ? error.message : "Public RPC unavailable"); }
  base.warnings.push("A valid incoming USDC transfer is not proof of the paid product, customer identity, accepted delivery or after-cost profit. Correlate with seller records before recording revenue. This tool never creates or sends transactions.");
  return base;
}
