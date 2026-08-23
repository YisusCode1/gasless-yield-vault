import { useState, useEffect } from "react";
import { useVault } from "../hooks/useVault";

export default function VaultView() {
  const {
    address,
    usdcBalance,
    vaultShares,
    totalAssets,
    loading,
    error,
    connect,
    deposit,
    withdraw,
  } = useVault();

  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");

  useEffect(() => {
    // Si ya hay una wallet conectada previamente, podrias auto-reconectar aqui
  }, []);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;
    try {
      if (mode === "deposit") {
        await deposit(amount);
      } else {
        await withdraw(amount);
      }
      setAmount("");
    } catch (err) {
      // el error ya queda reflejado en el estado del hook
    }
  };

  if (!address) {
    return (
      <div className="vault-container">
        <h2>GasslessPilotVault</h2>
        <p>Conecta tu wallet para depositar en el vault (yield via Aave V3)</p>
        <button onClick={connect} disabled={loading}>
          {loading ? "Conectando..." : "Conectar Wallet"}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="vault-container">
      <h2>GasslessPilotVault</h2>
      <p className="address">Cuenta: {address.slice(0, 6)}...{address.slice(-4)}</p>

      <div className="stats">
        <div>
          <span>Balance USDC</span>
          <strong>{usdcBalance}</strong>
        </div>
        <div>
          <span>Tus shares en el vault</span>
          <strong>{vaultShares}</strong>
        </div>
        <div>
          <span>Total gestionado por el vault</span>
          <strong>{totalAssets}</strong>
        </div>
      </div>

      <div className="tabs">
        <button
          className={mode === "deposit" ? "active" : ""}
          onClick={() => setMode("deposit")}
        >
          Depositar
        </button>
        <button
          className={mode === "withdraw" ? "active" : ""}
          onClick={() => setMode("withdraw")}
        >
          Retirar
        </button>
      </div>

      <input
        type="number"
        placeholder="Cantidad en USDC"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0"
        step="0.01"
      />

      <button onClick={handleSubmit} disabled={loading || !amount}>
        {loading ? "Procesando..." : mode === "deposit" ? "Depositar" : "Retirar"}
      </button>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
