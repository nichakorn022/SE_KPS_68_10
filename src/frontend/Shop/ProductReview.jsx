import { useState, useEffect } from "react";
import { apiUrl } from "../../lib/api";

const FILTERS = ["All Reviews", "5 Stars", "4 Stars"];
const SORTS = ["Latest", "Most Helpful", "Highest Rated", "Lowest Rated"];

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

// ── Main Component ─────────────────────────────────
export default function ProductReview({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All Reviews");
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState("Latest");
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [editingReview, setEditingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currentToken = localStorage.getItem("token");
  const currentUser = currentToken ? (() => {
    try {
      const payload = JSON.parse(atob(currentToken.split(".")[1]));
      return payload;
    } catch {
      return null;
    }
  })() : null;
  const currentUserId = currentUser?.user_id;

  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem("token");

  // Calculate rating stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
  const ratingDist = [5, 4, 3, 2, 1].reduce((dist, star) => {
    dist[star] = reviews.filter(r => r.rating === star).length;
    return dist;
  }, {});

  // Fetch reviews on mount
  useEffect(() => {
    if (!productId) return;

    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch(apiUrl(`/reviews/${productId}`));
        if (!response.ok) throw new Error("Failed to fetch reviews");
        const data = await response.json();
        setReviews(data);
      } catch (err) {
        console.warn("Error fetching reviews:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  // Handle create or update review
  const handleWriteReview = async () => {
    if (!isLoggedIn) {
      alert("Please login to write a review");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const isEditing = Boolean(editingReview);
      const url = isEditing
        ? apiUrl(`/reviews/${productId}/${editingReview.id}`)
        : apiUrl(`/reviews/${productId}`);
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(reviewForm),
      });

      if (!response.ok) {
        let errorMessage = isEditing ? "Failed to update review" : "Failed to submit review";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      alert(isEditing ? "Review updated successfully!" : "Review submitted successfully!");
      setShowWriteModal(false);
      setEditingReview(null);
      setReviewForm({ rating: 5, comment: "" });

      // Refresh reviews
      const refreshResponse = await fetch(apiUrl(`/reviews/${productId}`));
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setReviews(data);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewForm({ rating: review.rating, comment: review.text });
    setShowWriteModal(true);
  };

  const handleDeleteReview = async (review) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl(`/reviews/${productId}/${review.id}`), {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete review");
      }
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      alert("Review deleted successfully");
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = reviews.filter((r) => {
    if (activeFilter === "5 Stars") return r.rating === 5;
    if (activeFilter === "4 Stars") return r.rating === 4;
    return true;
  });

  const displayEmpty = totalReviews === 0;

  console.log("ProductReview rendering", { productId, reviews, loading, error });

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* ── Rating Summary ── */}
        <div style={s.ratingCard}>
          <div style={s.ratingLeft}>
            <div style={s.avgScore}>{avgRating.toFixed(1)}</div>
            <StarRow rating={avgRating} size={22} />
            <p style={s.basedOn}>Based on {totalReviews} reviews</p>
          </div>
          <div style={s.ratingBars}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDist[star] || 0;
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
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
            onClick={() => isLoggedIn ? setShowWriteModal(true) : alert("Please login to write a review")}
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
            {reviews.slice(0, 2).map((review) => (
              <div key={review.id} style={s.featuredCard}>
                <div style={s.reviewHeader}>
                  <div style={s.reviewerInfo}>
                    <img
                      src={review.avatar || "https://randomuser.me/api/portraits/lego/1.jpg"}
                      alt={review.name}
                      style={s.avatar}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <div>
                      <div style={s.nameRow}>
                        <span style={s.reviewerName}>{review.name}</span>
                      </div>
                      <p style={s.reviewDate}>{review.date}</p>
                    </div>
                  </div>
                  <div style={s.reviewActionButtons}>
                    {review.userId === currentUserId && (
                      <>
                        <button style={s.actionBtn} onClick={() => handleEditReview(review)}>Edit</button>
                        <button style={s.actionBtnDanger} onClick={() => handleDeleteReview(review)}>Delete</button>
                      </>
                    )}
                    <StarRow rating={review.rating} size={16} />
                  </div>
                </div>
                <p style={s.reviewText}>{review.text}</p>
                <p style={s.helpfulText}>{review.helpful || 0} people found this helpful</p>
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
              onClick={() => isLoggedIn ? setShowWriteModal(true) : alert("Please login to write the first review")}
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
                      src={review.avatar || "https://randomuser.me/api/portraits/lego/1.jpg"}
                      alt={review.name}
                      style={s.avatar}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <div>
                      <div style={s.nameRow}>
                        <span style={s.reviewerName}>{review.name}</span>
                      </div>
                      <p style={s.reviewDate}>{review.date}</p>
                    </div>
                  </div>
                  <div style={s.reviewActionButtons}>
                    {review.userId === currentUserId && (
                      <>
                        <button style={s.actionBtn} onClick={() => handleEditReview(review)}>Edit</button>
                        <button style={s.actionBtnDanger} onClick={() => handleDeleteReview(review)}>Delete</button>
                      </>
                    )}
                    <StarRow rating={review.rating} size={16} />
                  </div>
                </div>
                <p style={{ ...s.reviewText, color: "#374151", marginTop: 12 }}>{review.text}</p>
                <p style={{ ...s.helpfulText, color: "#78716c", marginTop: 16 }}>
                  {review.helpful || 0} people found this helpful
                </p>
              </div>
            ))}
            {filtered.length === 0 && totalReviews > 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#a8a29e", fontFamily: "sans-serif" }}>
                No reviews match this filter.
              </div>
            )}
          </div>
        )}

        {/* ── Write Review Modal ── */}
        {showWriteModal && (
          <div style={s.modalOverlay} onClick={() => {
            setShowWriteModal(false);
            setEditingReview(null);
            setReviewForm({ rating: 5, comment: "" });
          }}>
            <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 style={s.modalTitle}>{editingReview ? "Edit Review" : "Write a Review"}</h3>
              <div style={s.modalBody}>
                <div style={s.ratingInput}>
                  <label style={s.ratingLabel}>Rating:</label>
                  <div style={s.starInput}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        style={{
                          ...s.starBtn,
                          color: star <= reviewForm.rating ? "#d97706" : "#e7e3db",
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div style={s.commentInput}>
                  <label style={s.commentLabel}>Comment:</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Share your experience with this product..."
                    style={s.commentTextarea}
                    rows={4}
                  />
                </div>
              </div>
              <div style={s.modalActions}>
                <button
                  onClick={() => {
                    setShowWriteModal(false);
                    setEditingReview(null);
                    setReviewForm({ rating: 5, comment: "" });
                  }}
                  style={s.cancelBtn}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleWriteReview}
                  style={s.submitBtn}
                  disabled={submitting || !reviewForm.comment.trim()}
                >
                  {submitting ? "Submitting..." : editingReview ? "Update Review" : "Submit Review"}
                </button>
              </div>
            </div>
          </div>
        )}

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
    background: "#485B3B",
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
    background: "#6B8E5A",
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
    background: "#6B8E5A",
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
    background: "#6B8E5A",
    borderRadius: 14,
    padding: "24px 28px",
    border: "1px solid #485B3B",
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
  reviewActionButtons: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    padding: "4px 8px",
    border: "1px solid #9ca3af",
    background: "#f9fafb",
    color: "#374151",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
  },
  actionBtnDanger: {
    padding: "4px 8px",
    border: "1px solid #ef4444",
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
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
    color: "#6B8E5A",
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    padding: "2px 8px",
    borderRadius: 20,
  },
  verifiedBadgeDark: {
    fontSize: 11,
    fontWeight: 500,
    color: "#6B8E5A",
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
    background: "#6B8E5A",
    color: "#ffffff",
    borderColor: "#6B8E5A",
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
    color: "#6B8E5A",
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
    background: "#6B8E5A",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: FONT_SANS,
    transition: "background 0.15s",
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#ffffff",
    borderRadius: 12,
    padding: 24,
    maxWidth: 500,
    width: "90%",
    maxHeight: "80vh",
    overflow: "auto",
  },
  modalTitle: {
    margin: "0 0 20px",
    fontSize: 20,
    fontWeight: 700,
    color: "#1c1917",
    fontFamily: FONT_SERIF,
  },
  modalBody: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  ratingInput: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
  },
  starInput: {
    display: "flex",
    gap: 4,
  },
  starBtn: {
    fontSize: 24,
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "color 0.15s",
  },
  commentInput: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
  },
  commentTextarea: {
    padding: 12,
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 14,
    fontFamily: FONT_SANS,
    resize: "vertical",
    outline: "none",
    transition: "border-color 0.15s",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    padding: "8px 16px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: FONT_SANS,
    transition: "background 0.15s",
  },
  submitBtn: {
    padding: "8px 16px",
    border: "none",
    background: "#6B8E5A",
    color: "#ffffff",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: FONT_SANS,
    transition: "background 0.15s",
  },
};
