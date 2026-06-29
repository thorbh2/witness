"""Tests for WITNESS (direct runner, no network)."""
from pathlib import Path

CONTRACT = str(Path(__file__).resolve().parents[1] / "contracts" / "witness.py")
SUBMITTED = 0; CONFIRMED = 1; DISPUTED = 2


def _attest(w, vm, who, subject="Alice Dev", claim="Completed the GenLayer hackathon", url="https://example.com/proof"):
    vm.sender = who
    return w.attest(subject, claim, url)


def test_attest(deploy, direct_vm, direct_alice):
    w = deploy(CONTRACT)
    aid = _attest(w, direct_vm, direct_alice)
    assert aid == 0
    assert w.get_attestation_count() == 1
    a = w.get_attestation(0)
    assert a["status"] == SUBMITTED
    assert a["subject"] == "Alice Dev"
    assert a["claim"] == "Completed the GenLayer hackathon"


def test_attest_requires_subject(deploy, direct_vm, direct_alice):
    w = deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("subject is required"):
        w.attest("", "claim", "https://x.com")


def test_attest_requires_claim(deploy, direct_vm, direct_alice):
    w = deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("claim is required"):
        w.attest("subject", "  ", "https://x.com")


def test_attest_requires_source(deploy, direct_vm, direct_alice):
    w = deploy(CONTRACT)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("source URL is required"):
        w.attest("subject", "claim", "")


def test_multiple_attestations(deploy, direct_vm, direct_alice, direct_bob):
    w = deploy(CONTRACT)
    _attest(w, direct_vm, direct_alice, subject="Project A")
    _attest(w, direct_vm, direct_bob, subject="Project B")
    _attest(w, direct_vm, direct_alice, subject="Project C")
    assert w.get_attestation_count() == 3
    assert w.get_attestation(1)["subject"] == "Project B"


def test_confirmed_count_zero(deploy, direct_vm, direct_alice):
    w = deploy(CONTRACT)
    a = w.get_attestation_count()
    assert a == 0
    # nobody confirmed yet
    addr = "0x" + "00" * 20
    assert w.confirmed_count(addr) == 0


def test_no_such_attestation(deploy, direct_vm, direct_alice):
    w = deploy(CONTRACT)
    _attest(w, direct_vm, direct_alice)
    with direct_vm.expect_revert("no such attestation"):
        w.get_attestation(50)
