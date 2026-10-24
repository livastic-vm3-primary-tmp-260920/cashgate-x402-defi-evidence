import { useActionMutation } from "@agent-native/core/client/use-action";
import {
  IconActivityHeartbeat,
  IconArrowRight, IconArrowUpRight, IconBolt,
  IconCheck, IconCircleCheck, IconClipboardCheck, IconClock,
  IconExternalLink, IconFileSearch, IconFingerprint, IconLock,
  IconRefresh, IconSearch, IconShieldCheck, IconShieldExclamation,
  IconShieldX, IconWalletOff,
} from "@tabler/icons-react";
import { useState } from "react";
import {
  PRODUCTS, ORIGINAL_WALLET, CIRCLE_USDC_BASE,
  type Product, type QuoteResult, type ReceiptResult,
} from "../../../lib/cashgate";

const demoHashes = [
  { label: "BTC quote / paid canary", hash: "0x0cf2906aa5cc7fc8978b81307e61d2569e0759452b41c09f2dcae8cb87721edd" },
  { label: "X Layer diff / paid canary", hash: "0x7725c3545291b731b2075cadd1622f77ffe3342496bfba474055a4e97d1a8a7e" },
];

const palette: Record<string, { code: string; label: string; tint: string }> = {
  aave: { code: "AAVE / 1967", label: "On-chain code provenance", tint: "#A8D5FF" },
  funding: { code: "BTC / PERP", label: "Market-source integrity", tint: "#F7CB91" },
  diff: { code: "XL / DELTA", label: "Pinned-chain change report", tint: "#CEBBFF" },
  snapshot: { code: "XL / STATE", label: "Historical state observations", tint: "#A8E6D2" },
};

function shortHash(value: string, before = 12, after = 7) {
  if (!value || value.length <= before + after + 3) return value;
  return value.slice(0, before) + "…" + value.slice(-after);
}

function Readout({ name, value, accent }: { name: string; value: string; accent?: boolean }) {
  return (
    <div className="border-b border-[#244259] py-3 last:border-b-0">
      <div className="text-[11px] font-medium uppercase tracking-[.14em] text-[#7897A6]">{name}</div>
      <div className={`mt-1 break-all font-mono text-[13px] ${accent ? "text-[#BDF9E4]" : "text-[#EAF3F4]"}`}>{value}</div>
    </div>
  );
}

function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-[.19em] text-[#87B5B7]">
      <span className="grid h-6 w-6 place-items-center rounded-md border border-[#3B726E] bg-[#143634] text-[10px] text-[#B8FEE2]">{number}</span>
      {children}
    </p>
  );
}

export default function CashgateWorkbench() {
  const [selected, setSelected] = useState<Product>("aave");
  const [tx, setTx] = useState("");
  const [activePanel, setActivePanel] = useState<"quote" | "receipt">("quote");
  const quoteAction = useActionMutation("inspect-quote");
  const receiptAction = useActionMutation("verify-receipt");
  const quote = quoteAction.data as QuoteResult | undefined;
  const receipt = receiptAction.data as ReceiptResult | undefined;
  const validTx = /^0x[0-9a-fA-F]{64}$/.test(tx.trim());

  return (
    <main className="cashgate-shell relative mx-auto w-full max-w-[1230px] px-5 pb-20 pt-5 text-[#F0F5F6] sm:px-8 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#234456] pb-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#3D897E] bg-[#193B3D] text-[#C2FDE2]" aria-hidden="true"><IconShieldCheck size={23} stroke={1.7}/></span>
          <span className="text-lg font-semibold tracking-[.10em] text-[#F2F7F5]">CASHGATE <span className="font-mono text-[11px] font-normal tracking-[.12em] text-[#A8C1C4]">/ x402 LAB</span></span>
        </div>
        <nav className="flex items-center gap-5 text-[13px] font-medium text-[#9CBBBF]" aria-label="CashGate sections">
          <a className="transition hover:text-white" href="#quote">Quote desk</a>
          <a className="transition hover:text-white" href="#receipt">Receipt lab</a>
          <a className="hidden transition hover:text-white sm:inline" href="#assistant">Agent</a>
          <a className="flex items-center gap-1.5 text-[#CBFADB] hover:text-white" href="https://github.com/aave-dao/aave-address-book" target="_blank" rel="noreferrer">Sources <IconArrowUpRight size={15}/></a>
        </nav>
      </header>

      <section className="grid gap-7 py-10 lg:grid-cols-[1.35fr_.65fr] lg:gap-12">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#3B7C6D] bg-[#16392F] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.13em] text-[#C0F6D7]">LIVE EVIDENCE // BASE 8453</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#8EAFB7]"><span className="h-1.5 w-1.5 rounded-full bg-[#90EAC5]"/> READ ONLY / ZERO CUSTODY</span>
          </div>
          <h1 className="max-w-[820px] text-4xl font-semibold leading-[1.12] tracking-[-.05em] text-white sm:text-5xl lg:text-[60px]">
            Trust the evidence.<br/><span className="text-[#A0E8CB]">Not the payment prompt.</span>
          </h1>
          <p className="mt-5 max-w-[685px] text-[15px] leading-7 text-[#A4C0C6] sm:text-[16px]">
            One read-only decision desk for live x402 quotes and settled Base USDC transfers. Review the exact chain, asset, price and payee before using any external wallet — then independently check what actually landed on-chain.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#quote" className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#AEF4D2] px-5 text-sm font-semibold text-[#092B28] shadow-[0_0_22px_#80eac220] transition hover:bg-[#C8FFE5]">Inspect a quote <IconArrowRight size={17}/></a>
            <a href="#receipt" className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#335A62] bg-[#162C37] px-5 text-sm text-[#DDECEA] transition hover:border-[#80B8AD]">Verify a transfer <IconFileSearch size={17}/></a>
          </div>
        </div>
        <div className="relative min-h-[270px] overflow-hidden rounded-xl border border-[#335C63] bg-[#102831] p-5 shadow-[0_25px_80px_#020c1577]">
          <div className="absolute right-[-50px] top-[-60px] h-48 w-48 rounded-full bg-[#53C9AA] opacity-[0.08] blur-3xl"/>
          <div className="mb-5 flex items-center justify-between border-b border-[#2C5357] pb-4">
            <span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#A8CDCD]">PROOF OVER PROMISES</span>
            <IconActivityHeartbeat size={21} stroke={1.5} className="text-[#9DEBCB]"/>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div><p className="font-mono text-4xl font-medium tracking-tight text-white">04</p><p className="mt-1 text-xs leading-5 text-[#8CACB5]">Fixed x402 seller routes</p></div>
            <div><p className="font-mono text-4xl font-medium tracking-tight text-[#B9F5D9]">00</p><p className="mt-1 text-xs leading-5 text-[#8CACB5]">Connected wallets</p></div>
            <div><p className="font-mono text-4xl font-medium tracking-tight text-white">02</p><p className="mt-1 text-xs leading-5 text-[#8CACB5]">Independent read actions</p></div>
            <div><p className="font-mono text-4xl font-medium tracking-tight text-[#B9F5D9]">0</p><p className="mt-1 text-xs leading-5 text-[#8CACB5]">Transactions sent</p></div>
          </div>
          <div className="mt-5 rounded-lg border border-[#3B655F] bg-[#143830] px-3 py-2 text-[11px] text-[#B9F4D8]">No signing, custody, trading, gas or funds movement — by design.</div>
        </div>
      </section>

      <section id="quote" className="scroll-mt-8 border-t border-[#294550] pt-8">
        <SectionLabel number="01">X402 QUOTE INSPECTION</SectionLabel>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-semibold tracking-tight text-white">Choose a fixed data service.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#94B5B9]">Only allowlisted, original merchant routes. The app never accepts arbitrary payment URLs or contract addresses.</p></div>
          <div className="rounded-md border border-[#3A635D] px-3 py-2 font-mono text-[10px] tracking-wide text-[#A8D8C7]">EXPECTED PAYEE // {shortHash(ORIGINAL_WALLET, 10, 6)}</div>
        </div>
        <div role="radiogroup" aria-label="Select fixed public DeFi data product" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(PRODUCTS) as Product[]).map(product => {
            const info = PRODUCTS[product]; const design = palette[product]; const active = selected === product;
            return <button key={product} type="button" role="radio" aria-checked={active}
              onClick={() => { setSelected(product); quoteAction.reset(); setActivePanel("quote"); }}
              className={`group flex min-h-[168px] flex-col rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C0FFE1] ${active ? "border-[#8BDAB9] bg-[#1C393D] shadow-[inset_0_0_0_1px_#89e4bd33]" : "border-[#274A57] bg-[#112A35] hover:border-[#537A7C]"}`}>
              <span className="flex w-full items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.12em]" style={{ color: design.tint }}>{design.code}</span><span className={`h-3 w-3 rounded-full border ${active ? "border-[#AAF6D5] bg-[#AAF6D5]" : "border-[#5C8185]"}`}/></span>
              <span className="mt-7 block text-[14px] font-semibold text-[#F1F7F6]">{info.title}</span>
              <span className="mt-auto flex w-full items-center justify-between pt-3"><span className="text-[11px] text-[#88A9B1]">{design.label}</span><span className="font-mono text-xs text-[#CAECDB]">{(Number(info.expectedAmount)/1e6).toFixed(3)} USDC</span></span>
            </button>;
          })}
        </div>
        <div className="mt-5 grid gap-5 rounded-xl border border-[#32535B] bg-[#0F2631] p-5 lg:grid-cols-[1fr_1fr] lg:p-6">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[.18em] text-[#85AFAE]">FIXED MERCHANT HTTP GET</p>
            <p className="break-all font-mono text-[12px] leading-6 text-[#D8ECEC]">https://vm5-openapi-x402.onrender.com{PRODUCTS[selected].path}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => { quoteAction.mutate({ product: selected }); setActivePanel("quote"); }} disabled={quoteAction.isPending}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#A8EFD0] px-5 text-sm font-semibold text-[#092C29] transition hover:bg-[#C2FBE1] disabled:cursor-wait disabled:opacity-50">
                {quoteAction.isPending ? <IconRefresh size={18} className="animate-spin"/> : <IconSearch size={18}/>} {quoteAction.isPending ? "Reading seller…" : "Inspect unsigned 402"}
              </button>
              <a target="_blank" rel="noreferrer" href={`https://vm5-openapi-x402.onrender.com${PRODUCTS[selected].path}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-[#476570] px-4 text-sm text-[#D0E4E4] hover:border-[#8DBBB6]">Original endpoint <IconExternalLink size={15}/></a>
            </div>
            {quoteAction.isError && <p role="alert" className="mt-3 text-[13px] text-[#FFC4B1]">Read failed: {quoteAction.error.message}. No payment initiated.</p>}
          </div>
          <div className="rounded-lg border border-[#2E5057] bg-[#10232D] px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#8BAEB5]">VERIFICATION RESULT</p>
            {quote && quote.product === selected ? <>
              <div className={`mt-3 flex items-center gap-2 text-lg font-semibold ${quote.decision === "PASS" ? "text-[#A7F2CC]" : "text-[#FFC2AF]"}`}>
                {quote.decision === "PASS" ? <IconCircleCheck size={21}/> : <IconShieldX size={21}/>}
                {quote.decision === "PASS" ? "Published quote matches" : "Do not authorize funds"}
              </div>
              <p className="mt-2 text-[12px] leading-6 text-[#AAC6C8]">{quote.checks.filter(c => c.pass).length}/{quote.checks.length} public quote checks passed · HTTP {quote.httpStatus} · {quote.quotedUSDC || "—"} USDC</p>
              <p className="mt-2 text-[12px] text-[#85A9AC]">Checked {new Date(quote.atUTC).toLocaleString()}</p>
              <button type="button" onClick={() => setActivePanel(activePanel === "quote" ? "receipt" : "quote")} className="mt-4 text-[12px] font-semibold text-[#B5F5D5] hover:underline">{activePanel === "quote" ? "Hide detailed checks below ↑" : "View every check ↓"}</button>
            </> : <p className="mt-4 text-[13px] leading-6 text-[#819FAB]">Inspection is opt-in. Choose a product, then read the seller's actual uncharged HTTP 402 challenge. Nothing is signed, connected, bought or transferred.</p>}
          </div>
        </div>
        {quote && quote.product === selected && activePanel === "quote" && <div className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Individual payment quote verification checks">
          {quote.checks.map((test, index) => <div key={index} className="flex gap-3 rounded-lg border border-[#2F4D58] bg-[#142A35] p-3">
            <span className={test.pass ? "text-[#A4EBC7]" : "text-[#FFB6A3]"}>{test.pass ? <IconCheck size={17}/> : <IconShieldExclamation size={17}/>}</span>
            <div className="min-w-0"><p className="text-[13px] font-semibold text-[#E8F1F0]">{test.label}</p><p className="mt-1 break-all font-mono text-[10px] leading-5 text-[#91ABB2]">{test.detail}</p></div>
          </div>)}
          <div className="col-span-full rounded-lg border border-[#506056] bg-[#252E30] px-4 py-3 text-xs leading-6 text-[#C2D1CC]"><IconLock size={16} className="mr-2 inline-block text-[#B4D8BE]"/>{quote.guidance}</div>
        </div>}
      </section>

      <section id="receipt" className="mt-14 scroll-mt-8 border-t border-[#294550] pt-8">
        <SectionLabel number="02">BASE USDC RECEIPT EVIDENCE</SectionLabel>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div><h2 className="text-2xl font-semibold tracking-tight text-white">Prove a transfer. Not a profit.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#99B6BE]">Enter any public Base transaction hash. CashGate checks chain identity, successful receipt, canonical block, the real Circle USDC contract and Transfer log to the fixed disclosed seller wallet. It cannot infer why someone paid.</p>
            <label htmlFor="tx-hash" className="mt-7 block font-mono text-[10px] uppercase tracking-[.16em] text-[#AAC6CA]">Base transaction hash (public only)</label>
            <input id="tx-hash" type="text" autoCapitalize="none" autoComplete="off" autoCorrect="off" spellCheck={false}
              value={tx} onChange={e => setTx(e.target.value.trim())} placeholder="0x… 64 hex characters" maxLength={66}
              className="mt-2 block h-12 w-full rounded-lg border border-[#3D6470] bg-[#0E2733] px-4 font-mono text-[12px] text-white outline-none placeholder:text-[#64868D] focus:border-[#A9F2D3]"/>
            <div className="mt-3 flex flex-wrap gap-2">
              {demoHashes.map(x => <button type="button" key={x.hash} onClick={() => { setTx(x.hash);receiptAction.reset(); }}
                className="rounded-full border border-[#3A5662] px-3 py-1.5 text-[11px] text-[#ADC5C8] hover:border-[#9ADBC9]">{x.label} ↗</button>)}
            </div>
            <button type="button" disabled={!validTx || receiptAction.isPending} onClick={() => receiptAction.mutate({ txHash: tx.trim() })}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-[#ACF0D2] px-5 text-sm font-semibold text-[#092B28] hover:bg-[#C7FFE4] disabled:cursor-not-allowed disabled:opacity-40">
              {receiptAction.isPending ? <IconRefresh size={17} className="animate-spin"/> : <IconFingerprint size={18}/>} {receiptAction.isPending ? "Checking Base chain…" : "Check public receipt"}
            </button>
            {receiptAction.isError && <p role="alert" className="mt-3 text-xs text-[#FFBEA9]">Read failed: {receiptAction.error.message}. No transaction created.</p>}
          </div>
          <div className="rounded-xl border border-[#32535C] bg-[#102631] p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><p className="font-mono text-[10px] uppercase tracking-[.15em] text-[#93B9BE]">BLOCK EXPLORER / PROOF</p><IconClipboardCheck size={21} className="text-[#9EE3C9]"/></div>
            {receipt ? <>
              <div className={`flex items-center gap-2 text-lg font-semibold ${receipt.decision === "CONFIRMED" ? "text-[#B8F7DB]" : receipt.decision === "UNKNOWN" ? "text-[#F4D3A8]" : "text-[#F9C3B8]"}`}>
                {receipt.decision === "CONFIRMED" ? <IconShieldCheck size={22}/> : <IconShieldExclamation size={22}/>}
                {receipt.decision === "CONFIRMED" ? "Real transfer confirmed" : receipt.decision === "NO_MATCH" ? "No qualifying transfer" : "Unable to verify"}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-6">
                <Readout name="Circle Base USDC to seller" value={receipt.incomingUSDC + " USDC"} accent/>
                <Readout name="Block confirmations" value={receipt.confirmations?.toString() || "—"}/>
                <Readout name="Transfer log indices" value={receipt.logIndices.join(", ") || "—"}/>
                <Readout name="Status / chain" value={receipt.receiptStatus === 1 ? "SUCCESS / Base 8453" : "Unverified"}/>
              </div>
              <a href={receipt.explorer} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#A7F2D5] hover:underline">Open independent explorer <IconExternalLink size={15}/></a>
              <p className="mt-4 text-[11px] leading-5 text-[#91ADB2]">{receipt.warnings.join(" ") || "Transfers do not prove customer identity, sales, scope acceptance or net revenue."}</p>
            </> : <div className="py-5"><IconLock size={28} stroke={1.35} className="text-[#88B3B5]"/><p className="mt-3 text-sm font-medium text-[#C1D8DA]">No on-chain proof loaded</p><p className="mt-2 text-xs leading-6 text-[#83A7AE]">Only a public hash is read. No signature, RPC injection, wallet connection, gas, deposit or private key required.</p></div>}
          </div>
        </div>
      </section>

      <section id="assistant" className="mt-14 scroll-mt-8 border-t border-[#294550] pt-8">
        <SectionLabel number="03">SHARED AGENT ACTIONS</SectionLabel>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-xl border border-[#355E62] bg-[#122F35] p-5 lg:col-span-2">
            <IconBolt size={23} className="text-[#B5F5D3]"/>
            <h2 className="mt-3 text-lg font-semibold">A UI both humans and agents can inspect.</h2>
            <p className="mt-2 text-[13px] leading-6 text-[#A0BCC0]">The exact same bounded <code className="text-[#B7E9D5]">inspect-quote</code> and <code className="text-[#B7E9D5]">verify-receipt</code> actions power these buttons and the Agent-Native tool registry. An AI agent may gather and analyze evidence, but cannot buy assets, sign transfers or certify an unaudited contract.</p>
          </div>
          <div className="rounded-xl border border-[#355E62] bg-[#122F35] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[.13em] text-[#AAC4C0]">DATA POLICY</p>
            <div className="mt-5 flex items-start gap-2"><IconWalletOff size={20} className="text-[#A5ECCD]"/><span className="text-[13px] leading-6 text-[#C9E0DF]">Public quotes + public chain receipts only.</span></div>
            <div className="mt-3 flex items-start gap-2"><IconClock size={20} className="text-[#A5ECCD]"/><span className="text-[13px] leading-6 text-[#C9E0DF]">Fresh observations, no invented revenue.</span></div>
          </div>
        </div>
      </section>
      <footer className="mt-14 flex flex-wrap justify-between gap-4 border-t border-[#2E4F58] pt-5 text-[11px] leading-5 text-[#90AEB3]">
        <span>CashGate / v0.1 • Agent-Native actions • One accountable operator • AI-assisted, human-verified work</span>
        <span><IconLock size={13} className="mr-1 inline-block"/>No wallet connect. No custody. Not an audit or financial advice.</span>
      </footer>
    </main>
  );
}
