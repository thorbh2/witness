# Witness V2

A GenLayer attestation court.

This repo packages the public casework UI and the GenLayer contract behind it: filings, evidence, review windows, challenge paths and final resolution.

## Witness Brief

Witness V2 (# v0.2.16), 38164 bytes, 15 write + 23 view.

The important files are:

- `contracts/witness_v2.py` - GenLayer contract source
- `deployment.json` - Studionet address, deploy transaction and smoke transaction hashes
- `index.html` and `app.js` - static frontend
- `README.md` - this operator and reviewer guide

## Network Record

- Network: studionet (61999)
- Contract: [0xdD32b18f974E954930BFD06860a5790Ba50C29D4](https://explorer-studio.genlayer.com/contracts/0xdD32b18f974E954930BFD06860a5790Ba50C29D4)
- Deploy tx: [0xf4458fc4...c98f22](https://explorer-studio.genlayer.com/tx/0xf4458fc4708402e9467639e8e5596669f4cd9db5a9242bcad22b0bf691c98f22)
- Deployed at: 2026-06-23T17:18:11.618Z
- Smoke writes recorded: 15

## Adjudication Mechanics

Typical flow: `create_attestation` -> `open_verification` -> `submit_challenge` -> `resolve_challenge_with_genlayer` -> `open_challenge_window` -> `submit_appeal` -> `archive_attestation`

Useful reads: `get_attestation_count`, `get_attestation`, `get_attestation_record`, `get_recent_attestations`, `get_attestations_by_status`, `get_attester_attestations`, `get_subject_attestations`, `get_sources`

- Primary source: `contracts/witness_v2.py` (38,164 bytes)
- Public write/action methods: 17
- Read methods: 20
- GenLayer features: live web rendering, LLM adjudication, validator-comparative consensus, indexed storage, append-only collections

## Smoke Trail

- set_witness_standard: [0x1fa9892b...f9d9fc](https://explorer-studio.genlayer.com/tx/0x1fa9892bdc35640fa38d85c06a77421542280c3a07efe589c0263705c3f9d9fc)
- create_attestation: [0xe4e96ab1...e5b78d](https://explorer-studio.genlayer.com/tx/0xe4e96ab14b3e8961b728087bd419381a447dc3b037a8a57960f40714c3e5b78d)
- add_source_wiki: [0x7b0fa8b9...e13b7d](https://explorer-studio.genlayer.com/tx/0x7b0fa8b9d0b12429ae861ca37ad4d3e7cd6fdf18705b610c1311b593ede13b7d)
- add_source_britannica: [0x7afd52c0...173406](https://explorer-studio.genlayer.com/tx/0x7afd52c00b1961c5484271b28d855ba5c36961cea738319f3006123a7e173406)
- add_context: [0xcfbe39c0...255bfb](https://explorer-studio.genlayer.com/tx/0xcfbe39c025cf73a28ac3dce67db517cfca3cc18c86ecefb93052e920fb255bfb)
- open_verification: [0xc9271489...f34211](https://explorer-studio.genlayer.com/tx/0xc9271489ada4aec90b9776555b3ae3316c96aa42d60f6501f33cde1b1ff34211)
- verify: [0x471d8da2...db80cc](https://explorer-studio.genlayer.com/tx/0x471d8da2435ea9764c415a20006c39f1d29f1c3f53752c2bfe8212aa3edb80cc)
- open_challenge_window: [0xad6686d5...5dab87](https://explorer-studio.genlayer.com/tx/0xad6686d57d293180fee871aa661468297b0503a41f5743d201293272155dab87)

## Run Witness Locally

```powershell
cd C:\Users\aspronim\Desktop\design-skills
npm run preview:start
npm run preview:project -- 09-witness
```

Open http://localhost:8080/09-witness/.

## Publish Witness

```powershell
cd C:\Users\aspronim\Desktop\design-skills
npm run publish:project -- -Project 09-witness -Repo https://github.com/aspro45/<repo-name>.git
```

## Keys And Boundaries

- This repository should contain no decrypted wallet material.
- The Studionet deployer private key stays in the local encrypted vault.
- Vercel deployment should use the project folder only.

- QA notes: Upgraded from a small attest/verify MVP into Witness V2. Smoke: set_witness_standard / create_attestation / two add_source calls / add_context / open_verification / verify_attestation_with_genlayer / open_challenge_window / submit_challenge / resolve_challe...
