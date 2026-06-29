"""Seed WITNESS with real attestations on studionet (burner wallet)."""
from pathlib import Path
from gltest_cli.config.general import get_general_config
from gltest_cli.config.user import load_user_config
from gltest import get_contract_factory, get_default_account

ROOT = Path(__file__).resolve().parents[1]
cfg = load_user_config(str(ROOT / "gltest.config.yaml"))
get_general_config().user_config = cfg

ADDR = "0x3da1dc2050e769549BaaD197d353Ee53100a7534"

acct = get_default_account()
factory = get_contract_factory(contract_file_path=str(ROOT / "contracts" / "witness.py"))
contract = factory.build_contract(ADDR, account=acct)

attestations = [
    ("GenLayer", "GenLayer is a Layer 1 blockchain for Intelligent Contracts that can access the web and run LLMs.",
     "https://docs.genlayer.com/"),
    ("Ethereum", "Ethereum is a decentralized blockchain with smart contract functionality.",
     "https://ethereum.org/en/"),
    ("Bitcoin whitepaper", "Bitcoin: A Peer-to-Peer Electronic Cash System was published by Satoshi Nakamoto.",
     "https://bitcoin.org/bitcoin.pdf"),
    ("The Moon is made of cheese", "The Moon is composed primarily of dairy cheese.",
     "https://en.wikipedia.org/wiki/Moon"),
]

for subject, claim, url in attestations:
    try:
        contract.attest(args=[subject, claim, url]).transact()
        print(f"attested: {subject[:40]}", flush=True)
    except Exception as e:
        print(f"FAILED {subject[:30]}: {e}", flush=True)

print("count=" + str(contract.get_attestation_count().call()), flush=True)
