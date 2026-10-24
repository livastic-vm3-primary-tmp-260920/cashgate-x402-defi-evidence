# CashGate — x402 DeFi Evidence Desk

**An Agent-Native app for inspecting unpaid cryptocurrency payment quotes and reading actual Base USDC receipts.** It never connects a wallet, signs, transfers, approves, trades, or calls a paid API with payment credentials.

Built after 19 October 2026, with AI assistance, by one real beneficial owner. Candidate for the [2026 Builder.io Agent-Native Hackathon](https://www.builder.io/hackathon); **not yet entered, awarded, or deployed publicly**. Entrant eligibility and the public Clips demonstration must be verified before any official submission. Builder.io's [rules](https://www.builder.io/hackathon/rules) require an actual eligible human participant and truthful project provenance.

## Original functionality

CashGate offers two **shared Agent-Native `defineAction` tools** and an evidence-first React UI:

1. **`inspect-quote`** makes one *unpaid* GET to one of four strictly fixed existing merchant endpoints: Aave V3 Base proxy facts, BTC perpetual funding quotes, X Layer state diff, or X Layer state snapshot. It reads the canonical `PAYMENT-REQUIRED` header and the HTTP 402 body and checks x402 protocol v2, exact resource URL, one `exact` payment acceptance, Base chain ID 8453, the **original Circle USDC on Base contract**, approved original receiving address, fixed micro-price, and EIP-712 token identity. Changes or invalid data fail closed. **It never authorizes or executes a purchase.**
2. **`verify-receipt`** reads a public Base mainnet transaction by *transaction hash only*. It checks correct Base chain, status 1, a matching canonical block hash, adequate block depth, original Circle native Base USDC contract, Transfer topic, normalized receiver, sender, exact log index, and atomic amounts. It warns that a matching transfer **does not establish** which product was purchased, customer identity, fulfillment, or business profit. Incorrect/missing data fails closed.

Both tools use a fixed merchant origin and fixed RPC; they accept **no arbitrary URLs, contract addresses, shell commands, secrets, or private keys**. Published demonstration hashes are previously recorded genuine transactions, not new sales.

## Evidence and verification

- **8/8 Vitest cases passed**, including wrong recipient, token, chain, block hash, amount, and malformed public transaction data.
- `pnpm typecheck` and `pnpm agent-native:doctor` passed; `pnpm build` finished with exit 0. The framework warned about missing **production deployment configuration** (`BETTER_AUTH_SECRET` and persistent `DATABASE_URL`); a built bundle is **not** a healthy publicly hosted app.
- Read-only public smoke run: **all four live merchant HTTP 402 quotes passed 15 checks each**. A previously recorded original VM1 Base Circle USDC 0.010000 transfer (transaction `0x0cf2906aa5cc7fc8978b81307e61d2569e0759452b41c09f2dcae8cb87721edd`, Transfer log index 90) independently verified with confirmed block data. This is **old income**, never a newly earned amount.
- Local read-only action exposed on Agent-Native's actual `POST /mcp/tool/inspect-quote` or `POST /_agent-native/actions/inspect-quote` surfaces; HTTP 200 was observed in the local dev-only test. An earlier guess at `/api/actions/...` was **not** a valid framework endpoint.
- Framework terminal features emitted a nonfatal `node-pty` optional native-module warning because installation used `--ignore-scripts`. The CashGate evidence tools do not require shell terminals.

## Run safely

Prerequisites: Node.js 22.22+, pnpm. Run `pnpm install`, `pnpm test`, `pnpm typecheck`, `pnpm agent-native:doctor`, and `pnpm build`. For local development on the designated machine, use a free loopback port **other than 5005**, which is reserved by the VM control runtime: `PORT=4187 NODE_ENV=development pnpm exec vite --host 127.0.0.1 --port 4187 --strictPort`. Developer convenience `AUTH_DISABLED=true` is **local-only**, never a production setting. Public production hosting requires persistent Postgres, an independently generated strong authentication secret, deployment domain and permission review, limits on public RPC reads, and working HTTPS before going live. **Do not publish local credentials or personal information.**

The action sources live in `actions/inspect-quote.ts` and `actions/verify-receipt.ts`. Core checks live in `lib/cashgate.ts`; tests in `lib/cashgate.test.ts`. Read-only external diagnostic is `pnpm exec tsx scripts/cashgate-live-readonly-smoke.ts`.

## Provenance and scope

This project was scaffolded with the **MIT-licensed** [BuilderIO/agent-native](https://github.com/BuilderIO/agent-native) chat template. The original participant's prior merchant APIs, seller catalog, public EVM payment address, and prior transactions all **predate** this hackathon project and are reused only as publicly verifiable test inputs. CashGate's domain workflow, branded evidence UI, receipt/quote validation, and tests are newly developed here. The full scaffold retains features (chat, auth, collaborative storage) that would need real production infrastructure and are **not** represented as publicly deployed.

The project is a convenience/evidence reviewer, **not a security audit, financial recommendation, custody wallet, customer-identity verification, certified DeFi safety screen, or guaranteed profit generator**. Passing seller-offered fields cannot prove the seller or smart contracts are safe. Prize competition and crypto API discovery are **conditional prospects**, not booked revenue.
