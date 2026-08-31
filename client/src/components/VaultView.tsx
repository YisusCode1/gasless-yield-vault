import { useState, useEffect } from "react";
import { useVault } from "../hooks/useVault";
import { BLOCK_EXPLORER, CHAIN_NAME } from "../config/constants";
import "./VaultView.css";

const GITHUB_REPO_URL = "https://github.com/YisusCode1/gasless-yield-vault";

function GasBadge() {
  return (
    <span className="gas-badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 22h11" strokeLinecap="round" />
        <path d="M9 22V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v18" strokeLinecap="round" />
        <path d="M15 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9.5L19 6" strokeLinecap="round" />
        <path d="M2 2l20 20" strokeLinecap="round" />
      </svg>
      0 ETH required
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

function NoGasIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 22h11" strokeLinecap="round" />
      <path d="M9 22V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v18" strokeLinecap="round" />
      <path d="M15 8h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9.5L19 6" strokeLinecap="round" />
      <path d="M2 2l20 20" strokeLinecap="round" />
    </svg>
  );
}

function SignatureIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 17c2-3 3.5-5 5-5s2 2 3 4 2 3 3 1 2-6 3-6 1.5 3 4 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 21h18" strokeLinecap="round" />
    </svg>
  );
}

function YieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 17l5-5 4 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.67.8.56A10.51 10.51 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5Z" />
    </svg>
  );
}

function IntroFeatures() {
  return (
    <div className="feature-grid">
      <div className="feature-card">
        <NoGasIcon />
        <strong>No ETH</strong>
        <span>Your wallet never needs native gas to get started.</span>
      </div>
      <div className="feature-card">
        <SignatureIcon />
        <strong>One signature</strong>
        <span>Approval and deposit are sent together, in a single operation.</span>
      </div>
      <div className="feature-card">
        <YieldIcon />
        <strong>Earns yield on Aave V3</strong>
        <span>Capital is automatically deployed to generate yield.</span>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <header className="page-header">
      <div className="page-header-brand">
        <span className="brand-mark">◆</span>
        <span>Gasless Yield Vault</span>
      </div>
      <span className="network-pill">{CHAIN_NAME} · Testnet</span>
    </header>
  );
}

function PageFooter() {
  return (
    <footer className="page-footer">
      <p>
        Built for the <strong>WDK Aleph Hackathon — Track 2</strong> (Gasless Onboarding).
        Runs on {CHAIN_NAME}, uses no real funds.
      </p>
      <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="footer-link">
        <GithubIcon />
        View code on GitHub
      </a>
    </footer>
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
    // If a wallet was already connected previously, auto-reconnect could go here
  }, []);

  // Quote the USD₮ fee whenever the amount or mode changes,
  // so it shows BEFORE the user confirms the transaction.
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
    }, 400); // small debounce while the user types

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
      // the error is already reflected in the hook's state
    }
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard can fail in non-https contexts or without permission; no visual action if it fails
    }
  };

  if (!address) {
    return (
      <div className="vault-page">
        <PageHeader />

        <div className="vault-page-content">
          <div className="vault-card">
            <div className="vault-eyebrow">Gasless Yield Vault</div>
            <h1 className="vault-title">GasslessPilotVault</h1>

            <div className="vault-panel vault-panel--intro">
              <div style={{ marginBottom: 16 }}>
                <GasBadge />
              </div>
              <p>
                Connect your wallet to deposit into the vault and earn yield
                via Aave V3 — no ETH required for gas.
              </p>
              <button className="vault-connect" onClick={connect} disabled={loading}>
                {loading ? "Connecting..." : "Connect Wallet"}
              </button>
              {error && <p className="vault-error">{error}</p>}
            </div>

            <IntroFeatures />
          </div>
        </div>

        <PageFooter />
      </div>
    );
  }

  return (
    <div className="vault-page">
      <PageHeader />

      <div className="vault-page-content">
        <div className="vault-card">
          <div className="vault-eyebrow">Gasless Yield Vault</div>
          <h1 className="vault-title">GasslessPilotVault</h1>

          <div className="vault-panel">
            <div className="vault-address-row">
              <p className="vault-address">
                Account <strong>{address.slice(0, 6)}...{address.slice(-4)}</strong>
                <button
                  type="button"
                  className="copy-address-btn"
                  onClick={handleCopyAddress}
                  aria-label="Copy full address"
                  title="Copy full address"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </button>
              </p>
              <GasBadge />
            </div>

            <div className="ledger">
              <div className="ledger-row">
                <span className="ledger-label">USDC balance</span>
                <span className="ledger-fill" />
                <span className="ledger-value">{usdcBalance}</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-label">USD₮ balance (gas)</span>
                <span className="ledger-fill" />
                <span className="ledger-value ledger-value--accent">{usdtBalance}</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-label">Your shares</span>
                <span className="ledger-fill" />
                <span className="ledger-value">{vaultShares}</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-label">Vault total</span>
                <span className="ledger-fill" />
                <span className="ledger-value">{totalAssets}</span>
              </div>
            </div>

            <div className="mode-tabs">
              <button
                className={`mode-tab ${mode === "deposit" ? "active" : ""}`}
                onClick={() => setMode("deposit")}
              >
                Deposit
              </button>
              <button
                className={`mode-tab ${mode === "withdraw" ? "active" : ""}`}
                onClick={() => setMode("withdraw")}
              >
                Withdraw
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
                  ? "Calculating USD₮ fee..."
                  : quote !== null
                    ? `≈ ${quote} USD₮ fee · 0 ETH needed`
                    : ""}
              </p>
            )}

            <button
              className="vault-submit"
              onClick={handleSubmit}
              disabled={loading || !amount}
            >
              {loading
                ? "Processing..."
                : mode === "deposit"
                  ? "Deposit"
                  : "Withdraw"}
            </button>

            {error && <p className="vault-error">{error}</p>}

            {lastTxHash && (
              <div className="vault-tx">
                <span>Transaction confirmed</span>
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

      <PageFooter />
    </div>
  );
}
