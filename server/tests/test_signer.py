from app.signer import sign_eip712_rebalance_signal, HAS_ETH_ACCOUNT
from app.config import settings

def test_eip712_signature_recovery():
    amount_supply = 100000000
    amount_withdraw = 0
    profit = 140000
    nonce = 1700000000
    deadline = 1700003600

    sig = sign_eip712_rebalance_signal(
        amount_to_supply=amount_supply,
        amount_to_withdraw=amount_withdraw,
        profit_generated=profit,
        nonce=nonce,
        deadline=deadline
    )

    assert sig.startswith("0x")
    assert len(sig) == 132  # 65 bytes in hex + 0x = 132 chars

    if HAS_ETH_ACCOUNT:
        from eth_account import Account
        from eth_account.messages import encode_typed_data

        domain_data = {
            "name": "FlowFiVault",
            "version": "1",
            "chainId": settings.CHAIN_ID,
            "verifyingContract": settings.VAULT_CONTRACT_ADDRESS
        }

        message_types = {
            "RebalanceSignal": [
                {"name": "amountToSupply", "type": "uint256"},
                {"name": "amountToWithdraw", "type": "uint256"},
                {"name": "profitGenerated", "type": "uint256"},
                {"name": "nonce", "type": "uint256"},
                {"name": "deadline", "type": "uint256"}
            ]
        }

        message_data = {
            "amountToSupply": amount_supply,
            "amountToWithdraw": amount_withdraw,
            "profitGenerated": profit,
            "nonce": nonce,
            "deadline": deadline
        }

        signable_message = encode_typed_data(domain_data, message_types, message_data)
        recovered_signer = Account.recover_message(signable_message, signature=sig)

        assert recovered_signer.lower() == settings.AI_AGENT_ADDRESS.lower()
