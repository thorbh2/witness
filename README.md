# Witness

Witness is a GenLayer attestation protocol for source-backed claims, verification, challenge handling and reputation.

This repository is a public proof package: it includes the product UI, the deployed GenLayer Studionet contract source, deployment metadata, finalized smoke transactions, and test evidence. Local wallet secrets are not included.

## Live System

| Surface | Link |
| --- | --- |
| App | https://witness-murex.vercel.app |
| GitHub | https://github.com/thorbh2/witness |
| Contract | https://explorer-studio.genlayer.com/contracts/0xdD32b18f974E954930BFD06860a5790Ba50C29D4 |
| Deploy tx | https://explorer-studio.genlayer.com/tx/0xf4458fc4708402e9467639e8e5596669f4cd9db5a9242bcad22b0bf691c98f22 |
| Vercel inspect | https://vercel.com/aspros-projects-07dbbeb8/witness/HP4E8DSLsfT4h5wc2GdRUpkzFFa5 |

## Why Witness Exists

A GenLayer attestation court. Users submit public claims with primary evidence; the contract scores sources, verifies claims with validator-agreed web/LLM reasoning, then supports challenge windows, appeals, finalization, archival, reputation and audit logs.

The frontend keeps the original product experience, while the contract adds a reviewable on-chain lifecycle: source records, GenLayer reasoning, challenge and appeal paths, indexed reads, and an audit trail that can be inspected after deployment.

## Contract Architecture

| Area | Detail |
| --- | --- |
| Contract | `contracts/witness_v2.py` |
| Size | 38164 bytes |
| Network | GenLayer Studionet, chain id `61999` |
| Write methods | 15 |
| Read methods | 23 |
| GenLayer features | live web rendering, LLM execution, validator-comparative consensus |
| Deployment wallet | 0x34e718d6E0aCf961c40851d282E74B84f700b1Aa |
| Contract address | 0xdD32b18f974E954930BFD06860a5790Ba50C29D4 |

Architecture note:

> Witness V2 (# v0.2.16), 38164 bytes, 15 write + 23 view. Objects: Attestation, Source, Context, Verification, Challenge, Appeal, Reputation + AuditEntry. Lifecycle SUBMITTED->VERIFYING->VERIFIED->CHALLENGE_WINDOW->APPEALED->FINALIZED->ARCHIVED. DynArray[str] stores + TreeMap status/attester/subject/attestation-source/context/verification/challenge/appeal/audit indexes + recent ids + clock. GenLayer nondet (web.render + exec_prompt inside eq_principle.prompt_comparative) for claim verification, challenge rulings and appeal rulings; strict JSON normalization, confidence/support/dispute bps, source credibility scoring, URL validation and prompt-injection guardrails. Backward-compatible attest/verify/get_attestation/get_attestation_count/confirmed_count keep the existing static app working.

Core smoke flow:

```text
set_witness_standard
  -> create_attestation
  -> add_source_wiki
  -> add_source_britannica
  -> add_context
  -> open_verification
  -> verify
  -> open_challenge_window
  -> submit_challenge
  -> resolve_challenge
  -> submit_appeal
  -> resolve_appeal
  -> finalize_attestation
```

## Verification Trail

| Step | Transaction |
| --- | --- |
| Set Witness Standard | https://explorer-studio.genlayer.com/tx/0x1fa9892bdc35640fa38d85c06a77421542280c3a07efe589c0263705c3f9d9fc |
| Create Attestation | https://explorer-studio.genlayer.com/tx/0xe4e96ab14b3e8961b728087bd419381a447dc3b037a8a57960f40714c3e5b78d |
| Add Source Wiki | https://explorer-studio.genlayer.com/tx/0x7b0fa8b9d0b12429ae861ca37ad4d3e7cd6fdf18705b610c1311b593ede13b7d |
| Add Source Britannica | https://explorer-studio.genlayer.com/tx/0x7afd52c00b1961c5484271b28d855ba5c36961cea738319f3006123a7e173406 |
| Add Context | https://explorer-studio.genlayer.com/tx/0xcfbe39c025cf73a28ac3dce67db517cfca3cc18c86ecefb93052e920fb255bfb |
| Open Verification | https://explorer-studio.genlayer.com/tx/0xc9271489ada4aec90b9776555b3ae3316c96aa42d60f6501f33cde1b1ff34211 |
| Verify | https://explorer-studio.genlayer.com/tx/0x471d8da2435ea9764c415a20006c39f1d29f1c3f53752c2bfe8212aa3edb80cc |
| Open Challenge Window | https://explorer-studio.genlayer.com/tx/0xad6686d57d293180fee871aa661468297b0503a41f5743d201293272155dab87 |
| Submit Challenge | https://explorer-studio.genlayer.com/tx/0xa305d0a77827d8d825b63d157b4e9ac38b4da1fafe46efa550dce660f9898c84 |
| Resolve Challenge | https://explorer-studio.genlayer.com/tx/0xd2b38597a935807d4d0ac2ee69ad4b471cc6eb39b6990ea741723c264b11c2e1 |
| Submit Appeal | https://explorer-studio.genlayer.com/tx/0x42560c1667da80e82fb2fa1c4ae963e0f46c520a272a8633fcd1b889525e92c8 |
| Resolve Appeal | https://explorer-studio.genlayer.com/tx/0xc92ef8f333ea254feefabd3a5d66671e6247378d2b80b0314e6a2232280c8d56 |
| Finalize Attestation | https://explorer-studio.genlayer.com/tx/0xe93394c17be5a80ef02efa97882c189bd13ddd4c5a300ed5dc5030e19aa43860 |
| Archive Attestation | https://explorer-studio.genlayer.com/tx/0xfbe001be67ffa2febfb7cffd92f0bb14d83f05b33d2060c80e8efd3af4acc62e |

Test result:

```text
Schema valid
15 smoke writes finalized
37/37
Static frontend bundled for standalone Vercel deployment
```

## Frontend

Witness ships as a standalone static app:

- wallet connection through the bundled browser client
- GenLayer reads through `genlayer-js`
- writes routed through the connected EVM wallet
- local `shared/` client files included so Vercel does not depend on the private workspace router
- deployed contract address pinned in `app.js` and `deployment.json`

## Run Locally

From the private workspace:

```powershell
cd <private-workspace-root>
npm run preview:start
npm run preview:project -- 09-witness
```

Open:

```text
http://localhost:8080/09-witness/
```

## Publish / Redeploy

```powershell
cd <private-workspace-root>
npm run publish:project -- -Project 09-witness -Repo https://github.com/thorbh2/witness.git
```

Vercel production redeploy from a clean project folder:

```powershell
npx --yes vercel@latest --prod --yes
```

## Repository Safety

This public repository intentionally excludes local secrets:

- no private keys
- no vault files
- no `.env` files
- no `.vercel` project state
- no local dashboard data

Public files include frontend code, contract source, deployment metadata, tests, and non-sensitive proof links.
