
import "./Layout.css";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "proposals", label: "Proposals", icon: "◇" },
  { id: "create", label: "Create Proposal", icon: "+" },
  { id: "profile", label: "My Profile", icon: "◎" },
];

export default function Layout({
  page,
  setPage,
  walletConnected,
  walletAddress,
  connectWallet,
  changeWallet,
  disconnectWallet,
  children,
}) {
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  const currentPage =
    menuItems.find((item) => item.id === page)?.label || "Dashboard";

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div
          className="layout-brand"
          onClick={() => setPage("dashboard")}
        >
          <span className="brand-icon">D</span>
          <span>
            Governance<span className="brand-highlight">DAO</span>
          </span>
        </div>

        <p className="sidebar-heading">WORKSPACE</p>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={
                page === item.id
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
              onClick={() => setPage(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-network">
          <span className="network-dot" />
          <div>
            <strong>Hardhat Local</strong>
            <small>Chain ID 31337</small>
          </div>
        </div>
      </aside>

      <div className="layout-main">
        <header className="layout-header">
          <div>
            <small className="breadcrumb">
              WORKSPACE / {currentPage.toUpperCase()}
            </small>
            <h1>{currentPage}</h1>
          </div>

          <div className="layout-wallet">
            <button
              className="layout-button primary"
              onClick={connectWallet}
            >
              {walletConnected ? shortWallet : "Connect MetaMask"}
            </button>

            {walletConnected && (
              <>
                <button
                  className="layout-button"
                  onClick={changeWallet}
                >
                  Change
                </button>
                <button
                  className="layout-button"
                  onClick={disconnectWallet}
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </header>

        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}
