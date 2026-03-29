import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";
import { apiUrl, assetUrl } from "../../lib/api";
import { getAuthHeaders } from "./authClient";
import useSellerWorkspace from "../hooks/useSellerWorkspace";

function Stars({ rating }) {
  const safe = Math.max(0, Math.min(5, Number(rating || 0)));
  const full = Math.floor(safe);
  const empty = 5 - full;
  return (
    <span className="inline-flex items-center gap-0.5 text-[#d97706]" aria-label={`${safe} out of 5 stars`}>
      {Array.from({ length: full }).map((_, index) => (
        <span key={`f-${index}`}>★</span>
      ))}
      {Array.from({ length: empty }).map((_, index) => (
        <span key={`e-${index}`} className="text-[#e7e3db]">★</span>
      ))}
    </span>
  );
}

export default function SellerFeedbackPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loading: workspaceLoading, error: workspaceError, shop } = useSellerWorkspace();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviews, setReviews] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    if (workspaceLoading) return () => {};
    if (workspaceError || !shop) {
      setLoading(false);
      setError(workspaceError || "Dashboard unavailable");
      setReviews([]);
      return () => {
        ignore = true;
      };
    }

    setLoading(true);
    setError("");

    fetch(apiUrl("/reviews/seller"), { headers: getAuthHeaders() })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || "Failed to load reviews");
        }
        return payload;
      })
      .then((payload) => {
        if (ignore) return;
        const list = Array.isArray(payload) ? payload : [];
        setReviews(list);
        setReplyDrafts((prev) => {
          const next = { ...prev };
          for (const review of list) {
            const key = String(review.id);
            if (next[key] === undefined) {
              next[key] = review?.reply?.text || "";
            }
          }
          return next;
        });
      })
      .catch((fetchError) => {
        if (!ignore) {
          setReviews([]);
          setError(fetchError.message || "Failed to load reviews");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [workspaceLoading, workspaceError, shop?.id]);

  const stats = useMemo(() => {
    const total = reviews.length;
    const replied = reviews.filter((r) => r.reply && r.reply.text).length;
    return { total, replied, pending: Math.max(0, total - replied) };
  }, [reviews]);

  const groupedByProduct = useMemo(() => {
    const groups = new Map();

    for (const review of Array.isArray(reviews) ? reviews : []) {
      const productId = Number(review.productId);
      if (!Number.isFinite(productId)) continue;
      const key = String(productId);
      const entry = groups.get(key) || {
        productId,
        productName: review.productName || `Product #${productId}`,
        productType: review.productType || "",
        reviews: [],
        latestCreatedAt: 0,
        pendingReplies: 0,
      };

      const createdAtMs = review.createdAt ? new Date(review.createdAt).getTime() : new Date(review.date || "").getTime();
      const safeCreatedAtMs = Number.isFinite(createdAtMs) ? createdAtMs : 0;
      entry.latestCreatedAt = Math.max(entry.latestCreatedAt, safeCreatedAtMs);
      entry.reviews.push(review);
      if (!review?.reply?.text) entry.pendingReplies += 1;

      groups.set(key, entry);
    }

    const list = [...groups.values()];
    for (const group of list) {
      group.reviews.sort((a, b) => {
        const aMs = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bMs = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (Number.isFinite(bMs) ? bMs : 0) - (Number.isFinite(aMs) ? aMs : 0);
      });
    }

    list.sort((a, b) => b.latestCreatedAt - a.latestCreatedAt || b.pendingReplies - a.pendingReplies);
    return list;
  }, [reviews]);

  const selectedProductId = useMemo(() => {
    const raw = searchParams.get("product");
    if (!raw) return null;
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? id : null;
  }, [searchParams]);

  const selectedGroup = useMemo(() => {
    if (!selectedProductId) return null;
    return groupedByProduct.find((group) => Number(group.productId) === Number(selectedProductId)) || null;
  }, [groupedByProduct, selectedProductId]);

  const openProduct = (productId) => {
    const next = new URLSearchParams(searchParams);
    next.set("product", String(productId));
    setSearchParams(next, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearSelection = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("product");
    setSearchParams(next, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveReply = async (review) => {
    const reviewId = review?.id;
    if (!reviewId) return;

    const draft = String(replyDrafts[String(reviewId)] || "").trim();
    if (!draft) {
      setError("Reply text is required");
      return;
    }

    try {
      setSavingId(reviewId);
      setError("");

      const response = await fetch(apiUrl(`/reviews/${reviewId}/reply`), {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ reply_text: draft }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Failed to save reply");
      }

      setReviews((prev) =>
        prev.map((item) =>
          item.id === reviewId
            ? {
                ...item,
                reply: {
                  text: draft,
                  updatedAt: new Date().toISOString(),
                },
              }
            : item
        )
      );
    } catch (saveError) {
      setError(saveError.message || "Failed to save reply");
    } finally {
      setSavingId(null);
    }
  };

  const showEmpty = !loading && !error && reviews.length === 0;

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#253622]">
      <SiteNavbar active="seller-dashboard" />

      <main className="px-3 pb-16 pt-6 sm:px-5 xl:px-6 2xl:px-8">
        <div className="mx-auto flex w-full max-w-[1820px] flex-col gap-8">
          <section className="rounded-[36px] border border-[#DFE5D6] bg-white p-7 shadow-[0_18px_44px_rgba(72,91,59,0.08)] sm:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#839678]">Customer Feedback</p>
                <h1 className="mt-3 font-serif text-[2.6rem] tracking-[-0.05em] text-[#253622] sm:text-[3.2rem]">
                  Reviews for {shop?.name || "your shop"}
                </h1>
                <p className="mt-4 max-w-3xl text-[1rem] leading-8 text-[#657160]">
                  Read product reviews from customers and reply publicly with helpful context.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-[24px] border border-[#E1E8D8] bg-white px-5 py-3 text-right shadow-[0_10px_24px_rgba(72,91,59,0.06)]">
                  <p className="text-sm text-[#788472]">{stats.total} total</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#97A38E]">{stats.pending} pending replies</p>
                </div>
                <Link to="/seller" className="rounded-full border border-[#D3DDC7] bg-white/88 px-5 py-3 text-sm font-semibold text-[#51684A] transition-all hover:bg-[#F3F7ED]">
                  Back to Hub
                </Link>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="rounded-[34px] border border-[#DFE5D6] bg-white p-8 shadow-[0_16px_36px_rgba(72,91,59,0.06)]">
              <p className="text-sm text-[#6F7C69]">Loading reviews...</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-[34px] border border-[#F0D7D3] bg-[#FFF5F3] p-8 text-[#8a3f35] shadow-[0_16px_36px_rgba(72,91,59,0.06)]">
              <p className="text-[1.05rem] font-semibold">Unable to load feedback</p>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          ) : null}

          {showEmpty ? (
            <div className="rounded-[34px] border border-[#DFE5D6] bg-white p-10 text-center shadow-[0_16px_36px_rgba(72,91,59,0.06)]">
              <p className="text-[1.15rem] font-semibold text-[#253622]">No reviews yet</p>
              <p className="mt-2 text-sm text-[#6F7C69]">Once customers leave reviews, they will appear here.</p>
              <button
                type="button"
                onClick={() => navigate("/seller/dashboard")}
                className="mt-6 inline-flex rounded-full bg-[#7B9A67] px-6 py-3 text-sm font-semibold text-white"
              >
                Open analytics dashboard
              </button>
            </div>
          ) : null}

          {!loading && !error && reviews.length > 0 ? (
            <section className="grid gap-5">
              {!selectedGroup ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {groupedByProduct.map((group) => (
                    <button
                      key={group.productId}
                      type="button"
                      onClick={() => openProduct(group.productId)}
                      className="text-left rounded-[34px] border border-[#DFE5D6] bg-white p-6 shadow-[0_16px_36px_rgba(72,91,59,0.06)] transition-all hover:-translate-y-[2px] hover:shadow-[0_22px_44px_rgba(72,91,59,0.10)] sm:p-7"
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-[#839678]">Product</p>
                      <p className="mt-3 text-[1.45rem] font-semibold tracking-[-0.03em] text-[#253622]">
                        {group.productName}
                      </p>
                      {group.productType ? (
                        <p className="mt-2 text-sm text-[#6F7C69]">{group.productType}</p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#97A38E]">
                        <span>{group.reviews.length} review(s)</span>
                        <span aria-hidden="true">•</span>
                        <span>{group.pendingReplies} need reply</span>
                      </div>
                      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F3F7ED] px-4 py-2 text-sm font-semibold text-[#51684A]">
                        Open reviews →
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid gap-5">
                  <div className="rounded-[34px] border border-[#DFE5D6] bg-white p-6 shadow-[0_16px_36px_rgba(72,91,59,0.06)] sm:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={clearSelection}
                          className="text-sm font-semibold text-[#51684A] hover:underline"
                        >
                          ← Back to products
                        </button>
                        <p className="mt-3 text-[1.75rem] font-semibold tracking-[-0.03em] text-[#253622]">
                          {selectedGroup.productName}
                        </p>
                        {selectedGroup.productType ? (
                          <p className="mt-2 text-sm text-[#6F7C69]">{selectedGroup.productType}</p>
                        ) : null}
                        <p className="mt-2 text-sm text-[#97A38E]">
                          {selectedGroup.reviews.length} review(s) • {selectedGroup.pendingReplies} need reply
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/product/${selectedGroup.productId}#reviews`)}
                        className="shrink-0 rounded-full border border-[#D3DDC7] bg-white px-4 py-2 text-sm font-semibold text-[#51684A] transition-all hover:bg-[#F3F7ED]"
                      >
                        View on product page
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    {selectedGroup.reviews.map((review) => {
                      const reviewId = String(review.id);
                      const draft = replyDrafts[reviewId] ?? "";
                      const reviewerAvatar = review?.reviewer?.avatar ? assetUrl(review.reviewer.avatar) : "/Pictrue/default-avatar.png";
                      const hasReply = Boolean(review?.reply?.text);

                      return (
                        <div
                          key={review.id}
                          className="rounded-[34px] border border-[#DFE5D6] bg-white p-6 shadow-[0_16px_36px_rgba(72,91,59,0.06)] sm:p-7"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-3 text-sm text-[#6F7C69]">
                                <Stars rating={review.rating} />
                                <span>{review.date || ""}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <img src={reviewerAvatar} alt="Reviewer avatar" className="h-9 w-9 rounded-full object-cover" />
                              <div className="min-w-0">
                                <p className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-[#253622]">
                                  {review?.reviewer?.name || "Customer"}
                                </p>
                                <p className="text-xs text-[#97A38E]">{hasReply ? "Replied" : "Needs reply"}</p>
                              </div>
                            </div>
                          </div>

                          {review.text ? (
                            <div className="mt-4 whitespace-pre-wrap rounded-[22px] border border-[#ECE5DA] bg-[#FCFBF7] p-5 text-[15px] leading-8 text-[#445044]">
                              {review.text}
                            </div>
                          ) : null}

                          <div className="mt-5">
                            <p className="text-sm font-semibold text-[#253622]">{hasReply ? "Your reply" : "Write a reply"}</p>

                            <textarea
                              value={draft}
                              onChange={(event) =>
                                setReplyDrafts((prev) => ({ ...prev, [reviewId]: event.target.value }))
                              }
                              className="mt-3 w-full rounded-[22px] border border-[#D8E1CE] bg-white px-5 py-4 text-[15px] leading-7 text-[#24321F] outline-none placeholder:text-[#9AA791] focus:border-[#7A9466] focus:shadow-[0_0_0_4px_rgba(122,148,102,0.10)]"
                              rows={4}
                              placeholder="Thank you for your feedback! We'll improve..."
                            />

                            <div className="mt-4 flex justify-end">
                              <button
                                type="button"
                                disabled={savingId === review.id}
                                onClick={() => saveReply(review)}
                                className="rounded-[18px] bg-[#7B9A67] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(123,154,103,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {savingId === review.id ? "Saving..." : hasReply ? "Update reply" : "Post reply"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
