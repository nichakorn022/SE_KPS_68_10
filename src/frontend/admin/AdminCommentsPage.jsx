import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { assetUrl } from "../../lib/api";
import { adminApi } from "./adminApi";
import AdminPagination, { paginate } from "./components/AdminPagination";
import AdminConfirmActionModal from "./components/AdminConfirmActionModal";
import AdminMetaCard from "./components/AdminMetaCard";
import AdminFilterSummary from "./components/AdminFilterSummary";

const ratingOptions = ["all", "5", "4", "3", "2", "1"];

export default function AdminCommentsPage() {
  const { adminToken } = useOutletContext();
  const [reviews, setReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [createdFilter, setCreatedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  async function loadReviews() {
    setLoading(true);
    try {
      const rows = await adminApi.getAdminReviews(adminToken);
      setReviews(rows);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, [adminToken]);

  const getReviewType = (review) => review.content_type || "product";

  const summaryCards = useMemo(
    () => [
      { label: "Total Comments", value: reviews.length },
      { label: "5 Stars", value: reviews.filter((review) => Number(review.rating) === 5).length },
      { label: "Low Ratings", value: reviews.filter((review) => Number(review.rating) <= 2).length },
      { label: "This Month", value: reviews.filter((review) => isWithinDays(review.created_at, 30)).length },
    ],
    [reviews]
  );

  const productTargetOptions = useMemo(() => {
    const seen = new Set();

    return reviews.reduce((options, review) => {
      if (getReviewType(review) !== "product") return options;
      const id = review.product_id ? String(review.product_id) : "";
      if (!id || seen.has(id)) return options;
      seen.add(id);
      options.push({
        value: id,
        label: review.tea_name ? `${review.tea_name} (#${id})` : `Product #${id}`,
      });
      return options;
    }, []);
  }, [reviews]);

  const shopOptions = useMemo(() => {
    const seen = new Set();

    return reviews.reduce((options, review) => {
      if (getReviewType(review) !== "product") return options;
      const id = review.shop_id ? String(review.shop_id) : "";
      if (!id || seen.has(id)) return options;
      seen.add(id);
      options.push({
        value: id,
        label: review.shop_name || `Shop ${id}`,
      });
      return options;
    }, []);
  }, [reviews]);

  const eventTargetOptions = useMemo(() => {
    const seen = new Set();

    return reviews.reduce((options, review) => {
      if (getReviewType(review) !== "event") return options;
      const id = review.event_id ? String(review.event_id) : "";
      if (!id || seen.has(id)) return options;
      seen.add(id);
      options.push({
        value: id,
        label: review.event_title ? `${review.event_title} (#${id})` : `Event #${id}`,
      });
      return options;
    }, []);
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const now = Date.now();

    return reviews.filter((review) => {
      const reviewType = getReviewType(review);

      if (contentTypeFilter !== "all" && reviewType !== contentTypeFilter) return false;

      if (ratingFilter !== "all" && String(review.rating) !== ratingFilter) return false;

      if (createdFilter !== "all") {
        const createdAt = review.created_at ? new Date(review.created_at).getTime() : 0;
        if (createdFilter === "7d" && (!createdAt || now - createdAt > 7 * 24 * 60 * 60 * 1000)) return false;
        if (createdFilter === "30d" && (!createdAt || now - createdAt > 30 * 24 * 60 * 60 * 1000)) return false;
        if (createdFilter === "older" && (!createdAt || now - createdAt <= 30 * 24 * 60 * 60 * 1000)) return false;
      }

      if (targetFilter) {
        if (reviewType === "product" && String(review.product_id ?? "") !== targetFilter) return false;
        if (reviewType === "event" && String(review.event_id ?? "") !== targetFilter) return false;
      }

      if (shopFilter && reviewType === "product" && String(review.shop_id ?? "") !== shopFilter) return false;
      if (shopFilter && reviewType !== "product") return false;

      if (!searchTerm.trim()) return true;

      const keyword = searchTerm.trim().toLowerCase();
      return [
        review.comment,
        review.username,
        review.email,
        review.tea_name,
        review.tea_type,
        review.shop_name,
        review.event_title,
        review.event_location,
        `review ${review.review_id}`,
        `product ${review.product_id}`,
        `shop ${review.shop_id}`,
        `event ${review.event_id}`,
        `user ${review.user_id}`,
        reviewType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [contentTypeFilter, createdFilter, ratingFilter, reviews, searchTerm, shopFilter, targetFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, contentTypeFilter, targetFilter, shopFilter, ratingFilter, createdFilter]);

  const paginatedReviews = useMemo(() => paginate(filteredReviews, page), [filteredReviews, page]);
  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    Boolean(targetFilter.trim()) ||
    Boolean(shopFilter.trim()) ||
    contentTypeFilter !== "all" ||
    ratingFilter !== "all" ||
    createdFilter !== "all";

  const handleDeleteReview = async (reviewId) => {
    try {
      const review = reviews.find((item) => String(item.review_id) === String(reviewId));
      await adminApi.deleteAdminComment(adminToken, getReviewType(review || selectedReview || {}), reviewId);
      setSelectedReview(null);
      setStatus({ type: "success", message: `Review #${reviewId} deleted` });
      await loadReviews();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setContentTypeFilter("all");
    setTargetFilter("");
    setShopFilter("");
    setRatingFilter("all");
    setCreatedFilter("all");
  };

  useEffect(() => {
    setTargetFilter("");
    if (contentTypeFilter === "event") {
      setShopFilter("");
    }
  }, [contentTypeFilter]);

  const targetOptions = contentTypeFilter === "event" ? eventTargetOptions : productTargetOptions;
  const targetLabel = contentTypeFilter === "event" ? "Event" : "Product";
  const targetPlaceholder =
    contentTypeFilter === "event"
      ? "All events"
      : contentTypeFilter === "product"
        ? "All products"
        : "Choose a type first";

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
        <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Comments</p>
        <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">Comments</h3>

        {status.message && (
          <div className={`mt-5 rounded-2xl px-4 py-3 text-sm ${status.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
            {status.message}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-[24px] bg-[#f8f4eb] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d9577]">{card.label}</p>
              <p className="mt-3 text-2xl font-semibold text-[#2f3529]">{card.value}</p>
            </div>
          ))}
        </div>

        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by comment, user, product, shop, or review id..."
          className="admin-input mt-6"
        />

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Content Type</span>
            <select value={contentTypeFilter} onChange={(event) => setContentTypeFilter(event.target.value)} className="admin-input">
              <option value="all">All types</option>
              <option value="product">Product</option>
              <option value="event">Event</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">{targetLabel}</span>
            <select value={targetFilter} onChange={(event) => setTargetFilter(event.target.value)} className="admin-input">
              <option value="">{targetPlaceholder}</option>
              {targetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Shop</span>
            <select value={shopFilter} onChange={(event) => setShopFilter(event.target.value)} className="admin-input" disabled={contentTypeFilter === "event"}>
              <option value="">All shops</option>
              {shopOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Rating</span>
            <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)} className="admin-input">
              {ratingOptions.map((value) => (
                <option key={value} value={value}>
                  {value === "all" ? "All ratings" : `${value} stars`}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Created</span>
            <select value={createdFilter} onChange={(event) => setCreatedFilter(event.target.value)} className="admin-input">
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="older">Older than 30 days</option>
            </select>
          </label>
        </div>

        <div className="mt-4 rounded-2xl bg-[#f8f4eb] px-4 py-3 text-sm text-[#657056]">
          Review and remove product and event comments from one place.
        </div>

        <AdminFilterSummary
          count={filteredReviews.length}
          noun="comment"
          filteredLabel="Filtered moderation list"
          defaultLabel="All stored review comments"
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="py-8 text-sm text-[#7a8368]">Loading...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="rounded-2xl bg-[#f8f4eb] px-4 py-10 text-sm text-[#7a8368]">
              No matching comments found. Try changing the search or filters.
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-[#8d9577]">
                <tr>
                  <th className="pb-3">Comment</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3">Target</th>
                  <th className="pb-3">Rating</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReviews.items.map((review) => (
                  <tr
                    key={review.review_id}
                    onClick={() => setSelectedReview(review)}
                    className="cursor-pointer border-t border-[#efe8d8] transition hover:bg-[#fcfbf7]"
                  >
                    <td className="py-4">
                      <p className="font-semibold text-[#2f3529]">
                        {getReviewType(review) === "event" ? "Event Comment" : "Product Comment"}
                      </p>
                      <p className="mt-1 max-w-md truncate text-xs text-[#7a8368]">{review.comment || "-"}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">Open details</p>
                    </td>
                    <td className="py-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#8d9577]">{getReviewType(review)}</p>
                      <p className="text-[#2f3529]">{review.username || review.email || "User"}</p>
                      <p className="mt-1 text-xs text-[#7a8368]">{review.email || "-"}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-[#2f3529]">
                        {getReviewType(review) === "event"
                          ? review.event_title || `Event #${review.event_id}`
                          : review.tea_name || `Product #${review.product_id}`}
                      </p>
                      <p className="mt-1 text-xs text-[#7a8368]">
                        {getReviewType(review) === "event" ? review.event_location || "-" : review.shop_name || "-"}
                      </p>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex rounded-full bg-[#f8f4eb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#485b3b]">
                        {review.rating}/5
                      </span>
                    </td>
                    <td className="py-4">{review.created_at ? new Date(review.created_at).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <AdminPagination currentPage={paginatedReviews.page} totalPages={paginatedReviews.totalPages} onPageChange={setPage} />
      </div>

      {selectedReview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6" onClick={() => setSelectedReview(null)}>
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Comment Detail</p>
                <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">
                  {getReviewType(selectedReview) === "event" ? "Event Comment" : "Product Comment"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]"
              >
                X
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <AdminMetaCard label="Rating" value={`${selectedReview.rating}/5`} />
              <AdminMetaCard label="Type" value={getReviewType(selectedReview)} />
              <AdminMetaCard label="User" value={selectedReview.username || selectedReview.email || "User"} />
              <AdminMetaCard
                label={getReviewType(selectedReview) === "event" ? "Event" : "Product"}
                value={
                  getReviewType(selectedReview) === "event"
                    ? selectedReview.event_title || `Event #${selectedReview.event_id}`
                    : selectedReview.tea_name || `Product #${selectedReview.product_id}`
                }
              />
              <AdminMetaCard label="Created" value={selectedReview.created_at ? new Date(selectedReview.created_at).toLocaleString() : "-"} />
              <AdminMetaCard label="Email" value={selectedReview.email || "-"} />
              <AdminMetaCard
                label={getReviewType(selectedReview) === "event" ? "Location" : "Shop"}
                value={getReviewType(selectedReview) === "event" ? selectedReview.event_location || "-" : selectedReview.shop_name || "-"}
              />
              <AdminMetaCard
                label={getReviewType(selectedReview) === "event" ? "Registration ID" : "Order ID"}
                value={
                  getReviewType(selectedReview) === "event"
                    ? selectedReview.registration_id
                      ? `#${selectedReview.registration_id}`
                      : "-"
                    : selectedReview.order_id
                      ? `#${selectedReview.order_id}`
                      : "-"
                }
              />
              <AdminMetaCard
                label={getReviewType(selectedReview) === "event" ? "Event ID" : "Product ID"}
                value={
                  getReviewType(selectedReview) === "event"
                    ? selectedReview.event_id
                      ? `#${selectedReview.event_id}`
                      : "-"
                    : selectedReview.product_id
                      ? `#${selectedReview.product_id}`
                      : "-"
                }
              />
            </div>

            {getReviewType(selectedReview) === "event" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <AdminMetaCard label="Overall" value={`${selectedReview.overall_rating || selectedReview.rating || 0}/5`} />
                <AdminMetaCard label="Location" value={`${selectedReview.location_rating || 0}/5`} />
                <AdminMetaCard label="Atmosphere" value={`${selectedReview.atmosphere_rating || 0}/5`} />
                <AdminMetaCard label="Value" value={`${selectedReview.value_rating || 0}/5`} />
              </div>
            ) : null}

            <div className="mt-6 rounded-[24px] bg-[#fcfbf7] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Comment</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4b5541]">{selectedReview.comment || "-"}</p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {selectedReview.avatar ? (
                <img src={assetUrl(selectedReview.avatar)} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-[#e6ddc9]" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#efe8d8] text-sm font-semibold text-[#485b3b]">
                  {(selectedReview.username || "U").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-[#2f3529]">{selectedReview.username || "-"}</p>
                <p className="text-sm text-[#7a8368]">{selectedReview.email || "-"}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: "Delete Comment",
                    message: `Delete review #${selectedReview.review_id}?`,
                    confirmLabel: "Delete Comment",
                    tone: "danger",
                    onConfirm: () => handleDeleteReview(selectedReview.review_id),
                  })
                }
                className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24]"
              >
                Delete Comment
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <AdminConfirmActionModal
          {...confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={async () => {
            await confirmAction.onConfirm();
            setConfirmAction(null);
          }}
        />
      ) : null}
    </section>
  );
}

function isWithinDays(value, days) {
  if (!value) return false;
  return Date.now() - new Date(value).getTime() <= days * 24 * 60 * 60 * 1000;
}


