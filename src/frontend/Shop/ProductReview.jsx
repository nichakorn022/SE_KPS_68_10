import { useState } from "react";

const REVIEWS = [
  {
    id: 1,
    name: "Sarah Chen",
    verified: true,
    date: "March 15, 2026",
    rating: 5,
    text: "Absolutely divine! The premium sencha has a delicate sweetness with subtle umami notes. The leaves are vibrant and fresh. This has become my daily ritual, and I've noticed a wonderful calm energy throughout my day.",
    photo: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    helpful: 24,
    featured: true,
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    verified: true,
    date: "March 12, 2026",
    rating: 5,
    text: "As a tea sommelier, I'm incredibly particular about quality. This matcha exceeds all expectations - vibrant color, smooth texture, and authentic ceremonial grade. Worth every penny for the craftsmanship.",
    photo: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?w=200&h=200&fit=crop",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    helpful: 31,
    featured: true,
  },
  {
    id: 3,
    name: "Emily Tanaka",
    verified: true,
    date: "March 8, 2026",
    rating: 4,
    text: "Beautiful tea with a lovely floral aroma. The packaging is elegant and the leaves are clearly high quality. Steep time is a bit finicky but once you get it right, the flavor is wonderful.",
    photo: null,
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    helpful: 12,
    featured: false,
  },
  {
    id: 4,
    name: "James Park",
    verified: true,
    date: "March 5, 2026",
    rating: 5,
    text: "I've tried many premium teas and this is genuinely exceptional. The depth of flavor is remarkable and it holds up beautifully for multiple steeps. My entire household is now converted.",
    photo: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200&h=200&fit=crop",
    avatar: "https://randomuser.me/api/portraits/men/54.jpg",
    helpful: 18,
    featured: false,
  },
  {
    id: 5,
    name: "Priya Sharma",
    verified: false,
    date: "Feb 28, 2026",
    rating: 4,
    text: "Great taste and aroma. Delivery was fast and the tea arrived in perfect condition. Will definitely be ordering again!",
    photo: null,
    avatar: "https://randomuser.me/api/portraits/women/29.jpg",
    helpful: 7,
    featured: false,
  },
];

const RATING_DIST = { 5: 6, 4: 2, 3: 0, 2: 0, 1: 0 };
const TOTAL = Object.values(RATING_DIST).reduce((a, b) => a + b, 0);
const AVG = 4.6;

// ── Icons ──────────────────────────────────────────
const StarFull = ({ size = 16, color = "#d97706" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const StarHalf = ({ size = 16, color = "#d97706" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="none">
    <defs>
      <linearGradient id="half">
        <stop offset="50%" stopColor={color} />
        <stop offset="50%" stopColor="#e7e3db" />
      </linearGradient>
    </defs>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="url(#half)" />
  </svg>
);
const StarEmpty = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#e7e3db" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function StarRow({ rating, size = 16 }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) =>
        rating >= i ? (
          <StarFull key={i} size={size} />
        ) : rating >= i - 0.5 ? (
          <StarHalf key={i} size={size} />
        ) : (
          <StarEmpty key={i} size={size} />
        )
      )}
    </span>
  );
}

const PencilIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const AwardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);
const StarOutlineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const ImageIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const ChevronIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const ChatIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const FILTERS = ["All Reviews", "5 Stars", "4 Stars", "With Photos"];
const SORTS = ["Latest", "Most Helpful", "Highest Rated", "Lowest Rated"];

// ── Main Component ─────────────────────────────────
export default function ProductReview({ isEmpty = false }) {
  const [activeFilter, setActiveFilter] = useState("All Reviews");
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState("Latest");
  const [showDemo, setShowDemo] = useState(false);

  const displayEmpty = isEmpty && !showDemo;

  const filtered = REVIEWS.filter((r) => {
    if (activeFilter === "5 Stars") return r.rating === 5;
    if (activeFilter === "4 Stars") return r.rating === 4;
    if (activeFilter === "With Photos") return !!r.photo;
    return true;
  });

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* ── Rating Summary ── */}
        <div style={s.ratingCard}>
          <div style={s.ratingLeft}>
            <div style={s.avgScore}>{AVG}</div>
            <StarRow rating={AVG} size={22} />
            <p style={s.basedOn}>Based on {TOTAL} reviews</p>
          </div>
          <div style={s.ratingBars}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = RATING_DIST[star] || 0;
              const pct = TOTAL > 0 ? (count / TOTAL) * 100 : 0;
              return (
                <div key={star} style={s.barRow}>
                  <span style={s.barLabel}>{star} {star === 1 ? "star" : "stars"}</span>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${pct}%` }} />
                  </div>
                  <span style={s.barCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Write a Review CTA ── */}
        <div style={s.ctaCard}>
          <div style={s.ctaLeft}>
            <div style={s.ctaIconBox}>
              <PencilIcon />
            </div>
            <div>
              <h3 style={s.ctaTitle}>Share Your Tea Experience</h3>
              <p style={s.ctaSub}>Help fellow tea lovers discover their perfect blend. Your honest review matters.</p>
            </div>
          </div>
          <button
            style={s.ctaBtn}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2d4428")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#3d5a37")}
          >
            <StarOutlineIcon />
            Write a Review
          </button>
        </div>

        {/* ── Featured Reviews ── */}
        <div style={s.featuredSection}>
          <div style={s.featuredHeader}>
            <div style={s.featuredIconBox}>
              <AwardIcon />
            </div>
            <div>
              <h3 style={s.featuredTitle}>Featured Reviews</h3>
              <p style={s.featuredSub}>Handpicked by our tea experts</p>
            </div>
          </div>
          <div style={s.featuredGrid}>
            {REVIEWS.filter((r) => r.featured).map((review) => (
              <div key={review.id} style={s.featuredCard}>
                <div style={s.reviewHeader}>
                  <div style={s.reviewerInfo}>
                    <img
                      src={review.avatar}
                      alt={review.name}
                      style={s.avatar}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <div>
                      <div style={s.nameRow}>
                        <span style={s.reviewerName}>{review.name}</span>
                        {review.verified && <span style={s.verifiedBadge}>Verified Buyer</span>}
                      </div>
                      <p style={s.reviewDate}>{review.date}</p>
                    </div>
                  </div>
                  <StarRow rating={review.rating} size={16} />
                </div>
                <p style={s.reviewText}>{review.text}</p>
                {review.photo && (
                  <div style={s.photoThumb}>
                    <img
                      src={review.photo}
                      alt="Review"
                      style={s.reviewPhoto}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                )}
                <p style={s.helpfulText}>{review.helpful} people found this helpful</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filter + Sort Bar ── */}
        <div style={s.filterBar}>
          <div style={s.filterTabs}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  ...s.filterTab,
                  ...(activeFilter === f ? s.filterTabActive : s.filterTabInactive),
                }}
              >
                {f === "With Photos" && <ImageIcon />}
                {f}
              </button>
            ))}
          </div>
          <div style={{ position: "relative" }}>
            <button
              style={s.sortBtn}
              onClick={() => setSortOpen(!sortOpen)}
            >
              Sort: {sort}
              <ChevronIcon />
            </button>
            {sortOpen && (
              <div style={s.sortDropdown}>
                {SORTS.map((opt) => (
                  <div
                    key={opt}
                    style={{
                      ...s.sortOption,
                      fontWeight: sort === opt ? 600 : 400,
                      color: sort === opt ? "#3d5a37" : "#44403c",
                    }}
                    onClick={() => { setSort(opt); setSortOpen(false); }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── All Reviews List / Empty ── */}
        {displayEmpty ? (
          <div style={s.emptyCard}>
            <div style={s.emptyIconCircle}>
              <ChatIcon />
            </div>
            <h3 style={s.emptyTitle}>No Reviews Yet</h3>
            <p style={s.emptyText}>
              Be the first to share your experience with our premium teas.<br />
              Your review helps our community make informed choices.
            </p>
            <button
              style={s.emptyBtn}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2d4428")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#3d5a37")}
            >
              <StarOutlineIcon />
              Write the First Review
            </button>
          </div>
        ) : (
          <div style={s.reviewsList}>
            {filtered.map((review) => (
              <div key={review.id} style={s.reviewCard}>
                <div style={s.reviewHeader}>
                  <div style={s.reviewerInfo}>
                    <img
                      src={review.avatar}
                      alt={review.name}
                      style={s.avatar}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <div>
                      <div style={s.nameRow}>
                        <span style={s.reviewerName}>{review.name}</span>
                        {review.verified && <span style={s.verifiedBadgeDark}>Verified Buyer</span>}
                      </div>
                      <p style={s.reviewDate}>{review.date}</p>
                    </div>
                  </div>
                  <StarRow rating={review.rating} size={16} />
                </div>
                <p style={{ ...s.reviewText, color: "#374151", marginTop: 12 }}>{review.text}</p>
                {review.photo && (
                  <div style={{ ...s.photoThumb, marginTop: 14, marginBottom: 0 }}>
                    <img
                      src={review.photo}
                      alt="Review"
                      style={{ ...s.reviewPhoto, width: 120, height: 120 }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                )}
                <p style={{ ...s.helpfulText, color: "#78716c", marginTop: 16 }}>
                  {review.helpful} people found this helpful
                </p>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#a8a29e", fontFamily: "sans-serif" }}>
                No reviews match this filter.
              </div>
            )}
          </div>
        )}

        {/* ── Demo toggle ── */}
        <div style={s.demoRow}>
          <div style={s.demoDivider} />
          <button
            style={s.demoBtn}
            onClick={() => setShowDemo(!showDemo)}
          >
            ← {showDemo ? "Hide reviews demo" : "Show reviews demo"}
          </button>
          <div style={s.demoDivider} />
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
    background: "#f7f5f0",
    padding: "32px 24px 48px",
    fontFamily: FONT_SANS,
    boxSizing: "border-box",
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  // Rating summary card
  ratingCard: {
    background: "#ffffff",
    borderRadius: 14,
    padding: "24px 32px",
    border: "1px solid #ede9e0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    display: "flex",
    gap: 40,
    alignItems: "center",
  },
  ratingLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    minWidth: 120,
  },
  avgScore: {
    fontSize: 52,
    fontWeight: 700,
    color: "#1c1917",
    fontFamily: FONT_SERIF,
    lineHeight: 1,
    letterSpacing: "-1px",
  },
  basedOn: {
    margin: 0,
    fontSize: 12,
    color: "#78716c",
    textAlign: "center",
  },
  ratingBars: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  barRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  barLabel: {
    fontSize: 13,
    color: "#78716c",
    width: 52,
    flexShrink: 0,
    textAlign: "right",
  },
  barTrack: {
    flex: 1,
    height: 10,
    background: "#f3f0e8",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "#4a7a42",
    borderRadius: 6,
    transition: "width 0.4s ease",
  },
  barCount: {
    fontSize: 13,
    color: "#78716c",
    width: 20,
    textAlign: "right",
    flexShrink: 0,
  },
  // CTA card
  ctaCard: {
    background: "#f0ece4",
    borderRadius: 14,
    padding: "20px 28px",
    border: "1px solid #e0dbd0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
  },
  ctaLeft: {
    display: "flex",
    alignItems: "center",
    gap: 18,
  },
  ctaIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    background: "#5a7a52",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  ctaTitle: {
    margin: "0 0 4px",
    fontSize: 17,
    fontWeight: 700,
    color: "#1c1917",
    fontFamily: FONT_SERIF,
  },
  ctaSub: {
    margin: 0,
    fontSize: 13,
    color: "#78716c",
  },
  ctaBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 22px",
    border: "none",
    borderRadius: 10,
    background: "#3d5a37",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONT_SANS,
    flexShrink: 0,
    transition: "background 0.15s",
    whiteSpace: "nowrap",
  },
  // Featured section
  featuredSection: {
    background: "#4a6b43",
    borderRadius: 14,
    padding: "24px 28px",
    border: "1px solid #3d5a37",
  },
  featuredHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  featuredIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: "rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f5c842",
    flexShrink: 0,
  },
  featuredTitle: {
    margin: "0 0 2px",
    fontSize: 18,
    fontWeight: 700,
    color: "#ffffff",
    fontFamily: FONT_SERIF,
  },
  featuredSub: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
  },
  featuredGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  featuredCard: {
    background: "#ffffff",
    borderRadius: 12,
    padding: "18px 20px",
    border: "1px solid #ede9e0",
  },
  // Review card (all reviews)
  reviewCard: {
    background: "#ffffff",
    borderRadius: 12,
    padding: "20px 24px",
    border: "1px solid #ede9e0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  reviewsList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  reviewerInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    objectFit: "cover",
    background: "#f3f0e8",
    flexShrink: 0,
    border: "2px solid #ede9e0",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#1c1917",
    fontFamily: FONT_SERIF,
  },
  verifiedBadge: {
    fontSize: 11,
    fontWeight: 500,
    color: "#3d5a37",
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    padding: "2px 8px",
    borderRadius: 20,
  },
  verifiedBadgeDark: {
    fontSize: 11,
    fontWeight: 500,
    color: "#3d5a37",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    padding: "2px 8px",
    borderRadius: 20,
  },
  reviewDate: {
    margin: 0,
    fontSize: 12,
    color: "#78716c",
  },
  reviewText: {
    margin: "8px 0 0",
    fontSize: 14,
    color: "#44403c",
    lineHeight: 1.7,
  },
  photoThumb: {
    marginTop: 12,
    marginBottom: 4,
  },
  reviewPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    objectFit: "cover",
    border: "1px solid #ede9e0",
  },
  helpfulText: {
    margin: "10px 0 0",
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  // Filter bar
  filterBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  filterTabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  filterTab: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    border: "1.5px solid transparent",
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: FONT_SANS,
    transition: "all 0.15s",
  },
  filterTabActive: {
    background: "#3d5a37",
    color: "#ffffff",
    borderColor: "#3d5a37",
  },
  filterTabInactive: {
    background: "#ffffff",
    color: "#44403c",
    borderColor: "#e7e3db",
  },
  sortBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    border: "1.5px solid #e7e3db",
    borderRadius: 20,
    background: "#ffffff",
    color: "#44403c",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: FONT_SANS,
  },
  sortDropdown: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    background: "#ffffff",
    border: "1px solid #ede9e0",
    borderRadius: 10,
    boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
    zIndex: 10,
    minWidth: 160,
    overflow: "hidden",
  },
  sortOption: {
    padding: "10px 16px",
    fontSize: 14,
    cursor: "pointer",
    transition: "background 0.12s",
  },
  // Empty state
  emptyCard: {
    background: "#f3f0e8",
    borderRadius: 14,
    padding: "56px 32px",
    border: "1px solid #ede9e0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#e8e3d8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#78716c",
    marginBottom: 4,
  },
  emptyTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#3d5a37",
    fontFamily: FONT_SERIF,
  },
  emptyText: {
    margin: "4px 0 8px",
    fontSize: 14,
    color: "#78716c",
    lineHeight: 1.7,
  },
  emptyBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "13px 26px",
    border: "none",
    borderRadius: 10,
    background: "#3d5a37",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONT_SANS,
    transition: "background 0.15s",
    marginTop: 4,
  },
  // Demo toggle
  demoRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  demoDivider: {
    flex: 1,
    height: 1,
    background: "#e0dbd0",
  },
  demoBtn: {
    fontSize: 13,
    color: "#a8a29e",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: FONT_SANS,
    padding: "4px 8px",
    whiteSpace: "nowrap",
    transition: "color 0.15s",
  },
};