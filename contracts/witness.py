# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
WITNESS - On-Chain Attestation Registry
========================================
Anyone makes an attestation: a factual claim that something is true (a milestone
was hit, a credential was earned, an event happened) backed by a public source
URL. The contract reads the source and the validator set agrees (Equivalence
Principle) whether the source actually confirms the attestation. Confirmed
attestations become part of a permanent, auditable trust record; unconfirmed
ones are marked disputed. Each attester builds a public confirmation count.

Lifecycle for an attestation:
    SUBMITTED  -> claim posted with a source, awaiting verification
    CONFIRMED  -> source confirms the claim, recorded as verified truth
    DISPUTED   -> source does not confirm the claim
"""

from genlayer import *
from dataclasses import dataclass
import json
import typing


STATUS_SUBMITTED = 0
STATUS_CONFIRMED = 1
STATUS_DISPUTED = 2


@allow_storage
@dataclass
class Attestation:
    attester: Address
    subject: str
    claim: str
    source_url: str
    status: u8
    rationale: str


class Witness(gl.Contract):
    attestations: DynArray[Attestation]

    def __init__(self) -> None:
        pass

    @gl.public.write
    def attest(self, subject: str, claim: str, source_url: str) -> int:
        if len(subject.strip()) == 0:
            raise gl.vm.UserError("a subject is required")
        if len(claim.strip()) == 0:
            raise gl.vm.UserError("a claim is required")
        if len(source_url.strip()) == 0:
            raise gl.vm.UserError("a source URL is required")
        a = self.attestations.append_new_get()
        a.attester = gl.message.sender_address
        a.subject = subject
        a.claim = claim
        a.source_url = source_url
        a.status = u8(STATUS_SUBMITTED)
        a.rationale = ""
        return len(self.attestations) - 1

    @gl.public.write
    def verify(self, attestation_id: int) -> None:
        """The contract reads the source and the validator set agrees whether it
        confirms the attestation."""
        a = self._get(attestation_id)
        if a.status != STATUS_SUBMITTED:
            raise gl.vm.UserError("attestation already verified")

        url = a.source_url
        subject = a.subject
        claim = a.claim

        def leader_fn() -> str:
            page = gl.nondet.web.get(url).body.decode("utf-8")[:6000]
            prompt = (
                f"Subject: {subject}\n"
                f"Attested claim: {claim}\n\n"
                f"Source page content:\n{page}\n\n"
                "Does the source page CONFIRM the attested claim about the "
                "subject? Judge strictly on what the page actually says. Reply "
                'with ONLY JSON: {"confirmed": true} if the page confirms it, '
                '{"confirmed": false} if it does not, plus a short "reason".'
            )
            return gl.nondet.exec_prompt(prompt)

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            return self._decision_of(leader_res.calldata)[0] == self._decision_of(leader_fn())[0]

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        confirmed, reason = self._decision_of(result)
        a.rationale = reason[:300]
        a.status = u8(STATUS_CONFIRMED if confirmed else STATUS_DISPUTED)

    # ------------------------------------------------------------------ views
    @gl.public.view
    def get_attestation_count(self) -> int:
        return len(self.attestations)

    @gl.public.view
    def get_attestation(self, attestation_id: int) -> dict:
        a = self._get(attestation_id)
        return {
            "attester": a.attester.as_hex,
            "subject": a.subject,
            "claim": a.claim,
            "source_url": a.source_url,
            "status": int(a.status),
            "rationale": a.rationale,
        }

    @gl.public.view
    def confirmed_count(self, attester_hex: str) -> int:
        """How many confirmed attestations a given address has made."""
        target = attester_hex.strip().lower()
        n = 0
        for i in range(len(self.attestations)):
            a = self.attestations[i]
            if int(a.status) == STATUS_CONFIRMED and a.attester.as_hex.lower() == target:
                n += 1
        return n

    # -------------------------------------------------------------- internals
    def _get(self, attestation_id: int) -> Attestation:
        if attestation_id < 0 or attestation_id >= len(self.attestations):
            raise gl.vm.UserError("no such attestation")
        return self.attestations[attestation_id]

    def _decision_of(self, result: typing.Any) -> tuple:
        data = result
        if isinstance(data, str):
            data = self._extract_json(data)
        if not isinstance(data, dict):
            return (False, "")
        raw = data.get("confirmed", None)
        reason = str(data.get("reason", ""))
        if isinstance(raw, bool):
            return (raw, reason)
        if isinstance(raw, str):
            return (raw.strip().lower() == "true", reason)
        return (False, reason)

    def _extract_json(self, text: str) -> typing.Any:
        try:
            return json.loads(text)
        except (ValueError, TypeError):
            pass
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except (ValueError, TypeError):
                return None
        return None
