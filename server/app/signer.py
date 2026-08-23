import logging
import secrets

logger = logging.getLogger(__name__)

try:
    from eth_account import Account
    from eth_account.messages import encode_typed_data
    HAS_ETH_ACCOUNT = True
except ImportError:
    HAS_ETH_ACCOUNT = False

from app.config import settings

def sign_eip712_rebalance_signal(
    amount_to_supply: int,
    amount_to_withdraw: int,
    profit_generated: int,
    nonce: int,
    deadline: int,
    vault_address: str = None,
    private_key: str = None
) -> str:
    """
    Genera una firma criptografica EIP-712 real y valida usando la clave privada del Agente IA
    para ser verificada on-chain en el contrato de FlowFi.
    """
    target_vault = vault_address or settings.VAULT_CONTRACT_ADDRESS
    pk = private_key or settings.AI_AGENT_PRIVATE_KEY
    if not pk.startswith("0x"):
        pk = "0x" + pk

    # FIX: Validar instalacion de eth_account antes de intentar firmar
    if not HAS_ETH_ACCOUNT:
        raise RuntimeError(
            "eth_account no esta instalado. Instalar con: pip install eth-account"
        )

    try:
        domain_data = {
            "name": "FlowFiVault",
            "version": "1",
            "chainId": int(settings.CHAIN_ID),
            "verifyingContract": target_vault
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
            "amountToSupply": int(amount_to_supply),
            "amountToWithdraw": int(amount_to_withdraw),
            "profitGenerated": int(profit_generated),
            "nonce": int(nonce),
            "deadline": int(deadline)
        }

        signable_message = encode_typed_data(
            domain_data=domain_data,
            message_types=message_types,
            message_data=message_data
        )
        signed_message = Account.sign_message(signable_message, private_key=pk)
        sig_hex = signed_message.signature.hex()
        return sig_hex if sig_hex.startswith("0x") else "0x" + sig_hex
        
    except Exception as e:
        logger.error(f"Error al calcular firma EIP-712 con eth_account: {e}")
        raise  # FIX: Relanzar el error en vez de devolver una firma falsa
