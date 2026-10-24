/**
 * Optional read-only production merchant/RPC diagnostic.
 * WARNING: Never runs at build or on a schedule; no payment client.
 * Reports actual observations, not independent customer sales or audit.
 */
import { inspectQuote, verifyReceipt, PRODUCTS } from "../lib/cashgate";

let failures = 0;
for (const product of Object.keys(PRODUCTS) as (keyof typeof PRODUCTS)[]) {
  try {
    const q = await inspectQuote(product);
    console.log(JSON.stringify({
      action: "inspect-quote", product, decision: q.decision,
      http: q.httpStatus, amount: q.quotedUSDC,
      passed: q.checks.filter(c => c.pass).length,
      total: q.checks.length, paid: q.paid, errorReasons: q.reasons,
    }));
    if (q.decision !== "PASS" || q.paid !== false) failures++;
  } catch (e) {
    failures++;
    console.log(JSON.stringify({action: "inspect-quote",product,error:e instanceof Error?e.message:"unknown"}));
  }
}
const historicalTx = "0x0cf2906aa5cc7fc8978b81307e61d2569e0759452b41c09f2dcae8cb87721edd";
try {
  const r = await verifyReceipt(historicalTx);
  console.log(JSON.stringify({
    action:"verify-receipt", tx: historicalTx, decision: r.decision,
    incomingUSDC: r.incomingUSDC, confirmations:r.confirmations,
    indices:r.logIndices, sources:r.incomingSources,
    walletSigning:false, receiptIsNotProfit:r.receiptIsNotProfit,
    warnings:r.warnings,
  }));
  if(r.decision !== "CONFIRMED" || r.incomingUSDC!=="0.010000" || !r.receiptIsNotProfit) failures++;
} catch(e) {
  failures++;
  console.log(JSON.stringify({action:"verify-receipt",error:e instanceof Error?e.message:"unknown"}));
}
console.log(JSON.stringify({totalProducts:4, priorHistoricalReceiptChecked:true,
  newUSDCProduced:0, outflowUSDC:0, failures}));
process.exitCode=failures===0?0:1;
