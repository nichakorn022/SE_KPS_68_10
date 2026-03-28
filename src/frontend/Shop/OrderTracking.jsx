const ORDER = {
  id: "TEA-2024-7891",
  status: "Preparing",
  placedAt: "March 26, 2026 at 2:30 PM",
  estimatedDelivery: "Today at 3:45 PM",
  paymentStatus: "Paid",
  deliveryMethod: "Delivery",
  note: "Please include extra napkins. Looking forward to trying the new blend!",
  summary: {
    subtotal: 31.5,
    deliveryFee: 3.5,
    discount: -5.0,
    total: 30.0,
  },
  items: [
    {
      id: 1,
      name: "Premium Sencha Green Tea",
      options: ["Size: Large", "Temperature: Hot", "Sweetness: Light"],
      qty: 2,
      price: 13.0,
      img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=120&h=120&fit=crop",
    },
    {
      id: 2,
      name: "Ceremonial Matcha Latte",
      options: ["Size: Medium", "Milk: Oat", "Temperature: Iced"],
      qty: 1,
      price: 8.0,
      img: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?w=120&h=120&fit=crop",
    },
    {
      id: 3,
      name: "Chamomile Dreams Herbal",
      options: ["Size: Large", "Temperature: Hot", "Add: Honey"],
      qty: 1,
      price: 5.5,
      img: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=120&h=120&fit=crop",
    },
    {
      id: 4,
      name: "Earl Grey Supreme",
      options: ["Size: Small", "Temperature: Hot", "Add: Lemon"],
      qty: 1,
      price: 5.0,
      img: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=120&h=120&fit=crop",
    },
  ],
};

const STEPS = [
  {
    key: "placed",
    label: "Order Placed",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    key: "preparing",
    label: "Preparing",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    key: "delivery",
    label: "Out for Delivery",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    key: "completed",
    label: "Completed",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 8 12 12 14 14" />
      </svg>
    ),
  },
];

const STATUS_ORDER = ["placed", "preparing", "delivery", "completed"];
const ACTIVE_STEP = "preparing";
const activeIdx = STATUS_ORDER.indexOf(ACTIVE_STEP);

// Icons
const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-3.99" />
  </svg>
);
const MessageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const NoteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default function OrderTracking() {
  const { summary, items } = ORDER;

  return (
    <div style={s.page}>
      <div style={s.layout}>
        {/* ── LEFT / MAIN COLUMN ── */}
        <div style={s.main}>

          {/* Order header card */}
          <div style={s.card}>
            <div style={s.orderHeaderRow}>
              <div>
                <p style={s.orderNumLabel}>Order Number</p>
                <h2 style={s.orderNum}>{ORDER.id}</h2>
              </div>
              <span style={s.statusBadge}>
                <CheckCircleIcon />
                {ORDER.status}
              </span>
            </div>
            <div style={s.orderMeta}>
              <div>
                <p style={s.metaLabel}>Order Placed</p>
                <p style={s.metaValue}>{ORDER.placedAt}</p>
              </div>
              <div>
                <p style={s.metaLabel}>Estimated Delivery</p>
                <p style={s.metaValue}>
                  <span style={s.clockInline}><ClockIcon /></span>
                  {ORDER.estimatedDelivery}
                </p>
              </div>
            </div>
          </div>

          {/* Order Status steps */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Order Status</h3>
            <div style={s.stepsRow}>
              {STEPS.map((step, i) => {
                const stepIdx = STATUS_ORDER.indexOf(step.key);
                const isDone = stepIdx < activeIdx;
                const isActive = stepIdx === activeIdx;
                const isPending = stepIdx > activeIdx;
                return (
                  <div key={step.key} style={s.stepWrapper}>
                    {/* connector line before */}
                    {i > 0 && (
                      <div
                        style={{
                          ...s.connector,
                          background: stepIdx <= activeIdx ? "#5a7a52" : "#d6d0c8",
                        }}
                      />
                    )}
                    <div style={s.stepContent}>
                      <div
                        style={{
                          ...s.stepCircle,
                          background: isDone
                            ? "#5a7a52"
                            : isActive
                            ? "#3d5a37"
                            : "#ffffff",
                          border: isPending
                            ? "2px solid #d6d0c8"
                            : "2px solid #3d5a37",
                          color: isDone || isActive ? "#ffffff" : "#a8a29e",
                          boxShadow: isActive
                            ? "0 0 0 4px rgba(61,90,55,0.15)"
                            : "none",
                        }}
                      >
                        {step.icon}
                      </div>
                      <span
                        style={{
                          ...s.stepLabel,
                          color: isPending ? "#a8a29e" : "#1c1917",
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Delivery */}
          <div style={s.twoColRow}>
            <div style={s.card}>
              <p style={s.metaLabel}>Payment Status</p>
              <p style={s.infoValue}>
                <span style={s.greenCheck}><CheckCircleIcon /></span>
                {ORDER.paymentStatus}
              </p>
            </div>
            <div style={s.card}>
              <p style={s.metaLabel}>Delivery Method</p>
              <p style={s.infoValue}>{ORDER.deliveryMethod}</p>
            </div>
          </div>

          {/* Note to shop */}
          <div style={s.noteCard}>
            <p style={s.noteHeader}>
              <NoteIcon />
              Your Note to Shop
            </p>
            <p style={s.noteText}>"{ORDER.note}"</p>
          </div>

          {/* Order Items */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Order Items</h3>
            <div style={s.itemsList}>
              {items.map((item, i) => (
                <div key={item.id}>
                  {i > 0 && <div style={s.itemDivider} />}
                  <div style={s.itemRow}>
                    <div style={s.itemImgWrapper}>
                      <img
                        src={item.img}
                        alt={item.name}
                        style={s.itemImg}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentNode.style.background = "#e8ede6";
                        }}
                      />
                    </div>
                    <div style={s.itemInfo}>
                      <p style={s.itemName}>{item.name}</p>
                      {item.options.map((opt) => (
                        <p key={opt} style={s.itemOption}>{opt}</p>
                      ))}
                      <div style={s.itemFooter}>
                        <span style={s.itemQty}>Qty: {item.qty}</span>
                        <span style={s.itemPrice}>${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT / SIDEBAR ── */}
        <div style={s.sidebar}>

          {/* Order Summary */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Order Summary</h3>
            <div style={s.summaryRows}>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>Subtotal</span>
                <span style={s.summaryVal}>${summary.subtotal.toFixed(2)}</span>
              </div>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>Delivery Fee</span>
                <span style={s.summaryVal}>${summary.deliveryFee.toFixed(2)}</span>
              </div>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>Discount</span>
                <span style={{ ...s.summaryVal, color: "#16a34a" }}>
                  -${Math.abs(summary.discount).toFixed(2)}
                </span>
              </div>
              <div style={s.totalDivider} />
              <div style={s.summaryRow}>
                <span style={s.totalLabel}>Total</span>
                <span style={s.totalVal}>${summary.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shop Contact */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Shop Contact</h3>
            <div style={s.contactList}>
              <div style={s.contactRow}>
                <span style={s.contactIcon}><PinIcon /></span>
                <div>
                  <p style={s.contactLine}>123 Tea Garden Lane</p>
                  <p style={s.contactLine}>Portland, OR 97201</p>
                </div>
              </div>
              <div style={s.contactRow}>
                <span style={s.contactIcon}><PhoneIcon /></span>
                <p style={s.contactLine}>(503) 555-0123</p>
              </div>
              <div style={s.contactRow}>
                <span style={s.contactIcon}><MailIcon /></span>
                <p style={s.contactLine}>hello@leafandsteep.com</p>
              </div>
              <div style={s.contactRow}>
                <span style={s.contactIcon}><ClockIcon /></span>
                <div>
                  <p style={s.contactLine}>Mon-Fri: 8am - 7pm</p>
                  <p style={s.contactLine}>Sat-Sun: 9am - 6pm</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <button
            style={s.btnPrimary}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2d4428")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#3d5a37")}
          >
            <RefreshIcon />
            Order Again
          </button>
          <button
            style={s.btnOutline}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#a8a29e")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d6d0c8")}
          >
            <MessageIcon />
            Contact Shop
          </button>
        </div>
      </div>
    </div>
  );
}

const FONT_SANS = "'Helvetica Neue', Arial, sans-serif";
const FONT_SERIF = "'Georgia', 'Times New Roman', serif";

const s = {
  page: {
    minHeight: "100vh",
    background: "#f0ece4",
    padding: "32px 24px 48px",
    fontFamily: FONT_SANS,
    boxSizing: "border-box",
  },
  layout: {
    maxWidth: 1160,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 24,
    alignItems: "start",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  card: {
    background: "#ffffff",
    borderRadius: 14,
    padding: "20px 24px",
    border: "1px solid #ede9e0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  // Order header
  orderHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  orderNumLabel: {
    margin: "0 0 4px",
    fontSize: 13,
    color: "#78716c",
  },
  orderNum: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "#1c1917",
    fontFamily: FONT_SERIF,
    letterSpacing: "-0.3px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    color: "#3d5a37",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
  },
  orderMeta: {
    display: "flex",
    gap: 48,
  },
  metaLabel: {
    margin: "0 0 2px",
    fontSize: 12,
    color: "#78716c",
  },
  metaValue: {
    margin: 0,
    fontSize: 14,
    color: "#1c1917",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
  clockInline: {
    color: "#78716c",
    display: "flex",
    alignItems: "center",
  },
  // Section title
  sectionTitle: {
    margin: "0 0 18px",
    fontSize: 16,
    fontWeight: 700,
    color: "#1c1917",
    fontFamily: FONT_SERIF,
    letterSpacing: "-0.1px",
  },
  // Steps
  stepsRow: {
    display: "flex",
    alignItems: "center",
    position: "relative",
  },
  stepWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    position: "relative",
  },
  connector: {
    position: "absolute",
    left: "-50%",
    right: "50%",
    height: 2,
    top: 22,
    zIndex: 0,
    width: "100%",
    marginLeft: "-50%",
  },
  stepContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  stepLabel: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 1.3,
  },
  // Two-col row
  twoColRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  infoValue: {
    margin: "8px 0 0",
    fontSize: 15,
    fontWeight: 600,
    color: "#1c1917",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  greenCheck: {
    color: "#22c55e",
    display: "flex",
    alignItems: "center",
  },
  // Note
  noteCard: {
    background: "#eaf0e7",
    border: "1px solid #d4e0cf",
    borderRadius: 14,
    padding: "18px 22px",
  },
  noteHeader: {
    margin: "0 0 8px",
    fontSize: 14,
    fontWeight: 700,
    color: "#3d5a37",
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  noteText: {
    margin: 0,
    fontSize: 14,
    color: "#4a6644",
    fontStyle: "italic",
    lineHeight: 1.6,
  },
  // Items
  itemsList: {
    display: "flex",
    flexDirection: "column",
  },
  itemDivider: {
    height: 1,
    background: "#f3f0e8",
    margin: "12px 0",
  },
  itemRow: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },
  itemImgWrapper: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    background: "#f3f0e8",
    flexShrink: 0,
    border: "1px solid #ede9e0",
  },
  itemImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    margin: "0 0 4px",
    fontSize: 15,
    fontWeight: 700,
    color: "#1c1917",
    fontFamily: FONT_SERIF,
  },
  itemOption: {
    margin: "2px 0",
    fontSize: 13,
    color: "#78716c",
  },
  itemFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  itemQty: {
    fontSize: 13,
    color: "#78716c",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1c1917",
  },
  // Summary
  summaryRows: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#78716c",
  },
  summaryVal: {
    fontSize: 14,
    color: "#1c1917",
    fontWeight: 500,
  },
  totalDivider: {
    height: 1,
    background: "#ede9e0",
    margin: "4px 0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1c1917",
    fontFamily: FONT_SERIF,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1c1917",
    fontFamily: FONT_SERIF,
    letterSpacing: "-0.2px",
  },
  // Contact
  contactList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  contactRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  contactIcon: {
    color: "#78716c",
    display: "flex",
    alignItems: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  contactLine: {
    margin: "0 0 2px",
    fontSize: 13,
    color: "#44403c",
    lineHeight: 1.5,
  },
  // Buttons
  btnPrimary: {
    width: "100%",
    padding: "13px 0",
    border: "none",
    borderRadius: 10,
    background: "#3d5a37",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONT_SANS,
    letterSpacing: "0.01em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "background 0.15s",
  },
  btnOutline: {
    width: "100%",
    padding: "12px 0",
    border: "1.5px solid #d6d0c8",
    borderRadius: 10,
    background: "transparent",
    color: "#44403c",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: FONT_SANS,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "border-color 0.15s",
  },
};