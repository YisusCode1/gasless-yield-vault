import { useState, useEffect } from "react";
import { useVault } from "../hooks/useVault";
import { BLOCK_EXPLORER } from "../config/constants";
import "./VaultView.css";

function GasBadge() {
  return (
    <span className="gas-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 22h11" strokeLinecap="round" />
        <path d="M9 22V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v18" strokeLinecap="round" />
        <path d="M15 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9.5L19 6" strokeLinecap="round" />
        <path d="M2 2l20 20" strokeLinecap="round" />
      </svg>
      0 ETH requeridos
    </span>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="12" height="12" rx="2" strokeLinecap="round" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function VaultView() {
  const {
    address,
    usdcBalance,
    usdtBalance,
    vaultShares,
    totalAssets,
    lastTxHash,
    loading,
    error,
    connect,
    deposit,
    withdraw,
    getDepositQuote,
    getWithdrawQuote,
  } = useVault();

  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [quote, setQuote] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Si ya hay una wallet conectada previamente, podrias auto-reconectar aqui
  }, []);

  // Cotiza el fee en USD₮ cada vez que cambia el monto o el modo,
  // para mostrarlo ANTES de que el usuario confirme la transacción.
  useEffect(() => {
    if (!address || !amount || Number(amount) <= 0) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const fee =
          mode === "deposit"
            ? await getDepositQuote(amount)
            : await getWithdrawQuote(amount);
        if (!cancelled) setQuote(fee);
      } catch {
        if (!cancelled) setQuote(null);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 400); // pequeño debounce mientras el usuario escribe

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amount, mode, address, getDepositQuote, getWithdrawQuote]);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;
    try {
      if (mode === "deposit") {
        await deposit(amount);
      } else {
        await withdraw(amount);
      }
      setAmount("");
      setQuote(null);
    } catch (err) {
      // el error ya queda reflejado en el estado del hook
    }
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard puede fallar en contextos no-https o sin permiso; sin acción visual si falla
    }
  };

  if (!address) {
    return (
      <div className="vault-page">
        <div className="vault-card">
          <div className="vault-eyebrow">Gasless Yield Vault</div>
          <h1 className="vault-title">GasslessPilotVault</h1>

          <div className="vault-panel vault-panel--intro">
            <div style={{ marginBottom: 16 }}>
              <GasBadge />
            </div>
            <p>
              Conecta tu wallet para depositar en el vault y generar rendimiento
              vía Aave V3 — sin necesitar ETH para el gas.
            </p>
            <button className="vault-connect" onClick={connect} disabled={loading}>
              {loading ? "Conectando..." : "Conectar Wallet"}
            </button>
            {error && <p className="vault-error">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-page">
      <div className="vault-card">
        <div className="vault-eyebrow">Gasless Yield Vault</div>
        <h1 className="vault-title">GasslessPilotVault</h1>

        <div className="vault-panel">
          <div className="vault-address-row">
            <p className="vault-address">
              Cuenta <strong>{address.slice(0, 6)}...{address.slice(-4)}</strong>
              <button
                type="button"
                className="copy-address-btn"
                onClick={handleCopyAddress}
                aria-label="Copiar dirección completa"
                title="Copiar dirección completa"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </p>
            <GasBadge />
          </div>

          <div className="ledger">
            <div className="ledger-row">
              <span className="ledger-label">Balance USDC</span>
              <span className="ledger-fill" />
              <span className="ledger-value">{usdcBalance}</span>
            </div>
            <div className="ledger-row">
              <span className="ledger-label">Saldo USD₮ (gas)</span>
              <span className="ledger-fill" />
              <span className="ledger-value ledger-value--accent">{usdtBalance}</span>
            </div>
            <div className="ledger-row">
              <span className="ledger-label">Tus shares</span>
              <span className="ledger-fill" />
              <span className="ledger-value">{vaultShares}</span>
            </div>
            <div className="ledger-row">
              <span className="ledger-label">Total del vault</span>
              <span className="ledger-fill" />
              <span className="ledger-value">{totalAssets}</span>
            </div>
          </div>

          <div className="mode-tabs">
            <button
              className={`mode-tab ${mode === "deposit" ? "active" : ""}`}
              onClick={() => setMode("deposit")}
            >
              Depositar
            </button>
            <button
              className={`mode-tab ${mode === "withdraw" ? "active" : ""}`}
              onClick={() => setMode("withdraw")}
            >
              Retirar
            </button>
          </div>

          <div className="amount-field">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
            <span className="amount-suffix">USDC</span>
          </div>

          {amount && Number(amount) > 0 && (
            <p className={`quote-line ${quoteLoading ? "quote-line--loading" : ""}`}>
              {quoteLoading
                ? "Calculando comisión en USD₮..."
                : quote !== null
                  ? `≈ ${quote} USD₮ de comisión · 0 ETH necesarios`
                  : ""}
            </p>
          )}

          <button
            className="vault-submit"
            onClick={handleSubmit}
            disabled={loading || !amount}
          >
            {loading
              ? "Procesando..."
              : mode === "deposit"
                ? "Depositar"
                : "Retirar"}
          </button>

          {error && <p className="vault-error">{error}</p>}

          {lastTxHash && (
            <div className="vault-tx">
              <span>Transacción confirmada</span>
              <a
                href={`${BLOCK_EXPLORER}/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {lastTxHash.slice(0, 8)}...{lastTxHash.slice(-6)}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
