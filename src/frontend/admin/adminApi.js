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
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...getAdminHeaders(adminToken, !options.headers || !("Content-Type" in options.headers)),
      ...(options.headers || {}),
    },
  });

  return parseResponse(response);
}

export const adminApi = {
  getProducts(adminToken) {
    return adminFetch("/products", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
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
  updateOrderStatus(adminToken, orderId, status) {
    return adminFetch(`/orders/${orderId}/status`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  getShops(adminToken) {
    return adminFetch("/shops", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  updateShopVerification(adminToken, shopId, verifiedStatus) {
    return adminFetch(`/shops/${shopId}/verification`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ verified_status: verifiedStatus }),
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
  getReports(adminToken) {
    return adminFetch("/reports", adminToken, { method: "GET", headers: { Authorization: `Bearer ${adminToken}` } });
  },
  updateReportStatus(adminToken, reportId, status) {
    return adminFetch(`/reports/${reportId}/status`, adminToken, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
