import { apiUrl } from "../../lib/api";

function getAdminHeaders(adminToken, contentType = true) {
  const headers = {
    Authorization: `Bearer ${adminToken}`,
  };

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
}

export async function adminFetch(path, adminToken, options = {}) {
  const useJsonContentType =
    !(options.body instanceof FormData) &&
    (!options.headers || !("Content-Type" in options.headers));

  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...getAdminHeaders(adminToken, useJsonContentType),
      ...(options.headers || {}),
    },
  });

  return parseResponse(response);
}

export const adminApi = {
  getProducts(adminToken) {
    return adminFetch("/products", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  getAdminReviews(adminToken) {
    return adminFetch("/reviews/admin/all", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  deleteAdminReview(adminToken, reviewId) {
    return adminFetch(`/reviews/admin/product/${reviewId}`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  deleteAdminComment(adminToken, contentType, reviewId) {
    return adminFetch(`/reviews/admin/${contentType}/${reviewId}`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  getProductImages(adminToken) {
    return adminFetch("/product-images", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  uploadProductImage(adminToken, productId, file) {
    const formData = new FormData();
    formData.append("product_id", String(productId));
    formData.append("image", file);

    return adminFetch("/product-images", adminToken, {
      method: "POST",
      body: formData,
      headers: {},
    });
  },
  deleteProductImage(adminToken, imageId) {
    return adminFetch(`/product-images/${imageId}`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  createProduct(adminToken, payload) {
    return adminFetch("/products", adminToken, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateProduct(adminToken, productId, payload) {
    return adminFetch(`/products/${productId}`, adminToken, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteProduct(adminToken, productId) {
    return adminFetch(`/products/${productId}`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  getEvents(adminToken) {
    return adminFetch("/events", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  getEventImages(adminToken) {
    return adminFetch("/event-images", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  uploadEventImage(adminToken, eventId, file) {
    const formData = new FormData();
    formData.append("event_id", String(eventId));
    formData.append("image", file);

    return adminFetch("/event-images", adminToken, {
      method: "POST",
      body: formData,
      headers: {},
    });
  },
  deleteEventImage(adminToken, imageId) {
    return adminFetch(`/event-images/${imageId}`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  createEvent(adminToken, payload) {
    return adminFetch("/events", adminToken, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateEvent(adminToken, eventId, payload) {
    return adminFetch(`/events/${eventId}`, adminToken, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteEvent(adminToken, eventId) {
    return adminFetch(`/events/${eventId}`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  getOrders(adminToken) {
    return adminFetch("/orders", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  getOrderDetail(adminToken, orderId) {
    return adminFetch(`/orders/${orderId}`, adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  updateOrderStatus(adminToken, orderId, status) {
    return adminFetch(`/orders/${orderId}/status`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  getShops(adminToken) {
    return adminFetch("/shops", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  getUsers(adminToken) {
    return adminFetch("/users", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  updateUser(adminToken, userId, payload) {
    return adminFetch(`/users/${userId}`, adminToken, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  deleteUser(adminToken, userId) {
    return adminFetch(`/users/${userId}`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  getUserOrders(adminToken, userId) {
    return adminFetch(`/orders/user/${userId}`, adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  deleteOrder(adminToken, orderId) {
    return adminFetch(`/orders/${orderId}`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  getUserRegistrations(adminToken, userId) {
    return adminFetch(`/registrations/user/${userId}`, adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  updateRegistrationStatus(adminToken, registrationId, status) {
    return adminFetch(`/registrations/${registrationId}/status`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  deleteRegistration(adminToken, registrationId) {
    return adminFetch(`/registrations/${registrationId}/hard-delete`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  getShopImages(adminToken) {
    return adminFetch("/shop-images", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  uploadShopImage(adminToken, shopId, file) {
    const formData = new FormData();
    formData.append("shop_id", String(shopId));
    formData.append("image", file);

    return adminFetch("/shop-images", adminToken, {
      method: "POST",
      body: formData,
      headers: {},
    });
  },
  deleteShopImage(adminToken, imageId) {
    return adminFetch(`/shop-images/${imageId}`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  updateShopVerification(adminToken, shopId, verifiedStatus) {
    return adminFetch(`/shops/${shopId}/verification`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ verified_status: verifiedStatus }),
    });
  },
  deleteShopRequest(adminToken, shopId) {
    return adminFetch(`/shops/${shopId}/request`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  updateShop(adminToken, shopId, payload) {
    return adminFetch(`/shops/${shopId}/admin`, adminToken, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  getOrganizers(adminToken) {
    return adminFetch("/organizers", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  updateOrganizerVerification(adminToken, organizerId, verifiedStatus) {
    return adminFetch(`/organizers/${organizerId}/verification`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ verified_status: verifiedStatus }),
    });
  },
  deleteOrganizerRequest(adminToken, organizerId) {
    return adminFetch(`/organizers/${organizerId}/request`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
  getReports(adminToken) {
    return adminFetch("/reports", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  updateReportStatus(adminToken, reportId, status) {
    return adminFetch(`/reports/${reportId}/status`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  getSponsors(adminToken) {
    return adminFetch("/sponsors", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  updateSponsorStatus(adminToken, sponsorId, status) {
    return adminFetch(`/sponsors/${sponsorId}/status`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  deleteSponsor(adminToken, sponsorId) {
    return adminFetch(`/sponsors/${sponsorId}`, adminToken, {
      method: "DELETE",
      body: JSON.stringify({}),
    });
  },
};
