import { useState, useEffect } from "react";
import { fetchUserOrders } from "../../lib/api";
import { getStoredToken, getUserIdFromToken } from "./authClient";

// Color and emoji mapping for products
const PRODUCT_STYLES = {
  "Organic Sencha Green Tea": { color: "#6b8f5e", emoji: "🌿" },
  "Premium Matcha Powder": { color: "#8fad6a", emoji: "🍵" },
  "Earl Grey Reserve": { color: "#7a6b5a", emoji: "🍃" },
  "Jasmine Pearl": { color: "#9e8b6f", emoji: "🌸" },
  "Chamomile Herbal Blend": { color: "#c9a84c", emoji: "🌼" },
  "Imperial Oolong": { color: "#7c6e5b", emoji: "🫖" },
};

const STATUS_STYLES = {
  Preparing: { bg: "#fff8ec", color: "#c07d2a", border: "#f0c97a" },
  Completed: { bg: "#edf5ef", color: "#3a7d52", border: "#a3cba9" },
  Cancelled: { bg: "#fdf0f0", color: "#c0392b", border: "#f0a3a3" },
};

const PAYMENT_COLORS = {
  Paid: "#3a7d52",
  Refunded: "#c0392b",
};

export default function OrderHistory() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const userId = getUserIdFromToken();
        const token = getStoredToken();

        // Check if user is authenticated
        if (!userId || !token) {
          setError("Please log in to view your orders");
          setLoading(false);
          return;
        }

        const data = await fetchUserOrders(userId, token);
        setOrders(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err.message || "Failed to load orders. Please try again.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const tabs = ["All", "Preparing", "Completed", "Cancelled"];

  const filtered = orders.filter((o) => {
    const matchTab = activeTab === "All" || o.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.order_id?.toString().toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
    <div style={styles.page}>
      <style>{css}</style>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>My Orders</h1>
        <p style={styles.subtitle}>Track and manage your tea orders</p>
      </div>

      <div style={styles.content}>
        {/* Tabs */}
        <div style={styles.tabBar}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.tabActive : {}),
              }}
              className="tab-btn"
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a09080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            style={styles.searchInput}
            placeholder="Search by order number or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Order Cards */}
        <div style={styles.cardList}>
          {loading && (
            <div style={styles.empty}>
              <span style={{ fontSize: 40 }}>⏳</span>
              <p style={{ marginTop: 12, color: "#b0a090", fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>
                Loading your orders...
              </p>
            </div>
          )}
          {error && !loading && (
            <div style={styles.empty}>
              <span style={{ fontSize: 40 }}>⚠️</span>
              <p style={{ marginTop: 12, color: "#b0a090", fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>
                {error}
              </p>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={styles.empty}>
              <span style={{ fontSize: 40 }}>🍃</span>
              <p style={{ marginTop: 12, color: "#b0a090", fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>
                No orders found
              </p>
            </div>
          )}
          {!loading && !error && filtered.map((order) => {
            const s = STATUS_STYLES[order.status] || STATUS_STYLES["Preparing"];
            
            return (
              <div key={order.order_id} style={styles.card} className="order-card">
                {/* Card Header */}
                <div style={styles.cardHeader}>
                  <div style={styles.orderMeta}>
                    <div style={styles.orderIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a8f6e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10H3M16 2v4M8 2v4M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                    <div>
                      <span style={styles.orderLabel}>Order</span>
                      <div style={styles.orderId}>#{order.order_id}</div>
                    </div>
                  </div>
                  <span
                    style={{
                      ...styles.badge,
                      background: s.bg,
                      color: s.color,
                      border: `1px solid ${s.border}`,
                    }}
                  >
                    {order.status || "pending"}
                  </span>
                </div>

                <div style={styles.divider} />

                {/* Date / Payment */}
                <div style={styles.metaRow}>
                  <span style={styles.metaItem}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a09080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {new Date(order.order_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                  <span style={styles.metaItem}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a09080" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                      <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    <span style={{ color: PAYMENT_COLORS["Paid"], fontWeight: 600 }}>
                      Paid
                    </span>
                  </span>
                </div>

                {/* Total Amount */}
                <div style={styles.cardFooter}>
                  <div>
                    <div style={styles.totalLabel}>Total Amount</div>
                    <div style={styles.totalAmount}>${parseFloat(order.total_amount || 0).toFixed(2)}</div>
                  </div>
                  <div style={styles.actions}>
                    <button style={styles.btnOutline} className="btn-outline">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f0e8",
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    padding: "40px 48px 32px",
    background: "#faf8f3",
    borderBottom: "1px solid #e8e0d0",
  },
  title: {
    margin: 0,
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 36,
    fontWeight: 700,
    color: "#2c2416",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "#8a7d6a",
  },
  content: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "32px 24px",
  },
  tabBar: {
    display: "flex",
    background: "#ede8df",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "transparent",
    borderRadius: 9,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: "#7a6f60",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "#ffffff",
    color: "#2c2416",
    fontWeight: 600,
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  searchWrap: {
    position: "relative",
    marginBottom: 24,
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
  },
  searchInput: {
    width: "100%",
    padding: "12px 14px 12px 42px",
    border: "1.5px solid #e0d8cc",
    borderRadius: 10,
    background: "#fff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: "#3c2e1e",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "24px 28px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
    border: "1px solid #ede8df",
    transition: "box-shadow 0.2s, transform 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderMeta: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "#edf3ea",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  orderLabel: {
    fontSize: 12,
    color: "#a09080",
    display: "block",
    marginBottom: 1,
  },
  orderId: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 20,
    fontWeight: 700,
    color: "#2c2416",
    letterSpacing: "0.3px",
  },
  badge: {
    padding: "5px 14px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.3px",
  },
  divider: {
    height: 1,
    background: "#f0ebe2",
    margin: "16px 0",
  },
  metaRow: {
    display: "flex",
    gap: 20,
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    fontSize: 13,
    color: "#7a6f60",
  },
  itemsLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#a09080",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    display: "block",
    marginBottom: 10,
  },
  thumbRow: {
    display: "flex",
    marginBottom: 10,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#5a7a4e",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #fff",
  },
  itemNames: {
    margin: 0,
    fontSize: 13,
    color: "#6a5f52",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
    paddingTop: 16,
    borderTop: "1px solid #f0ebe2",
  },
  totalLabel: {
    fontSize: 12,
    color: "#a09080",
    marginBottom: 2,
  },
  totalAmount: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 26,
    fontWeight: 700,
    color: "#2c2416",
    letterSpacing: "-0.5px",
  },
  actions: {
    display: "flex",
    gap: 10,
  },
  btnOutline: {
    padding: "9px 20px",
    border: "1.5px solid #c8bfb0",
    borderRadius: 9,
    background: "transparent",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: "#5a5048",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnFilled: {
    padding: "9px 20px",
    border: "none",
    borderRadius: 9,
    background: "#4a6b3e",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: "#ffffff",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  empty: {
    textAlign: "center",
    padding: "60px 0",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

  .tab-btn:hover {
    color: #2c2416 !important;
    background: rgba(255,255,255,0.5) !important;
  }
  .order-card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
    transform: translateY(-2px);
  }
  .btn-outline:hover {
    background: #f5f0e8 !important;
    border-color: #a09080 !important;
  }
  .btn-filled:hover {
    background: #3a5530 !important;
  }
  input:focus {
    border-color: #8aad7a !important;
    box-shadow: 0 0 0 3px rgba(138,173,122,0.15);
  }
`;