import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";
import { assetUrl } from "../../lib/api";

function getVerificationStatusLabel(value) {
  return Number(value) === 1 ? "approved" : Number(value) === 2 ? "rejected" : "pending";
}

function getVerificationTone(value) {
  return Number(value) === 1
    ? "bg-[#eef6ea] text-[#386132]"
    : Number(value) === 2
      ? "bg-[#fff0ed] text-[#b33a24]"
      : "bg-[#fff4e2] text-[#a46317]";
}

export default function AdminShopsPage() {
  const { adminToken } = useOutletContext();
  const [shops, setShops] = useState([]);
  const [shopImages, setShopImages] = useState([]);
  const [products, setProducts] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [shopImagesPage, setShopImagesPage] = useState(1);
  const [shopProductsPage, setShopProductsPage] = useState(1);
  const [selectedShop, setSelectedShop] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [shopForm, setShopForm] = useState({
    shop_name: "",
    description: "",
    contact_info: "",
    phone: "",
    address: "",
    opening_hours: "",
    province: "",
    district: "",
    subdistrict: "",
  });
  const [productForm, setProductForm] = useState({
    tea_name: "",
    tea_type: "",
    description: "",
    price: "",
    stock: "",
  });
  const [shopSaving, setShopSaving] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [productDeleting, setProductDeleting] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [notesByShopId, setNotesByShopId] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });

  async function loadShops() {
    setLoading(true);
    try {
      const [shopRows, imageRows, productRows, productImageRows] = await Promise.all([
        adminApi.getShops(adminToken),
        adminApi.getShopImages(adminToken),
        adminApi.getProducts(adminToken),
        adminApi.getProductImages(adminToken),
      ]);
      setShops(shopRows);
      setShopImages(imageRows);
      setProducts(productRows);
      setProductImages(productImageRows);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShops();
  }, [adminToken]);

  useEffect(() => {
    setShopForm({
      shop_name: selectedShop?.shop_name || "",
      description: selectedShop?.description || "",
      contact_info: selectedShop?.contact_info || "",
      phone: selectedShop?.phone || "",
      address: selectedShop?.address || "",
      opening_hours: selectedShop?.opening_hours || "",
      province: selectedShop?.province || "",
      district: selectedShop?.district || "",
      subdistrict: selectedShop?.subdistrict || "",
    });
  }, [selectedShop]);

  useEffect(() => {
    setProductForm({
      tea_name: activeProduct?.tea_name || "",
      tea_type: activeProduct?.tea_type || "",
      description: activeProduct?.description || "",
      price: activeProduct?.price ?? "",
      stock: activeProduct?.stock ?? "",
    });
  }, [activeProduct]);

  useEffect(() => {
    setShopImagesPage(1);
    setShopProductsPage(1);
  }, [selectedShop]);

  const summaryCards = useMemo(
    () => [
      { label: "Total Shops", value: shops.length },
      { label: "Pending", value: shops.filter((shop) => Number(shop.verified_status) === 0).length },
      { label: "Approved", value: shops.filter((shop) => Number(shop.verified_status) === 1).length },
      { label: "Rejected", value: shops.filter((shop) => Number(shop.verified_status) === 2).length },
    ],
    [shops]
  );

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const shopProducts = products.filter((product) => String(product.shop_id) === String(shop.shop_id));

      if (statusFilter !== "all") {
        const statusValue = getVerificationStatusLabel(shop.verified_status);
        if (statusValue !== statusFilter) return false;
      }

      if (provinceFilter !== "all" && String(shop.province || "").toLowerCase() !== provinceFilter.toLowerCase()) {
        return false;
      }

      if (productFilter === "with-products" && shopProducts.length === 0) return false;
      if (productFilter === "no-products" && shopProducts.length > 0) return false;

      if (!searchTerm.trim()) return true;

      const keyword = searchTerm.trim().toLowerCase();
      const haystack = [
        shop.shop_name,
        shop.email,
        shop.phone,
        shop.contact_info,
        shop.address,
        shop.province,
        shop.district,
        shop.subdistrict,
        `shop ${shop.shop_id}`,
        `user ${shop.user_id}`,
        getVerificationStatusLabel(shop.verified_status),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [productFilter, products, provinceFilter, searchTerm, shops, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, provinceFilter, productFilter]);

  const provinceOptions = useMemo(
    () => Array.from(new Set(shops.map((shop) => String(shop.province || "").trim()).filter(Boolean))).sort(),
    [shops]
  );

  const paginatedShops = useMemo(() => paginate(filteredShops, page), [filteredShops, page]);
  const hasActiveFilters =
    Boolean(searchTerm.trim()) || statusFilter !== "all" || provinceFilter !== "all" || productFilter !== "all";

  const handleStatusChange = async (shopId, verifiedStatus) => {
    try {
      await adminApi.updateShopVerification(
        adminToken,
        shopId,
        verifiedStatus,
        notesByShopId[shopId] ?? selectedShop?.admin_note ?? null
      );
      setActiveProduct(null);
      setSelectedShop(null);
      setStatus({ type: "success", message: `Shop #${shopId} updated` });
      await loadShops();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleShopFieldChange = (key, value) => {
    setShopForm((current) => ({ ...current, [key]: value }));
  };

  const handleProductFieldChange = (key, value) => {
    setProductForm((current) => ({ ...current, [key]: value }));
  };

  const handleUpdateShop = async () => {
    if (!selectedShop) return;

    try {
      setShopSaving(true);
      await adminApi.updateShop(adminToken, selectedShop.shop_id, shopForm);
      await loadShops();
      setSelectedShop(null);
      setActiveProduct(null);
      setStatus({ type: "success", message: `Shop #${selectedShop.shop_id} updated` });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setShopSaving(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!activeProduct) return;

    try {
      setProductSaving(true);
      await adminApi.updateProduct(adminToken, activeProduct.product_id, {
        tea_name: productForm.tea_name,
        tea_type: productForm.tea_type,
        description: productForm.description,
        price: Number(productForm.price || 0),
        stock: Number(productForm.stock || 0),
      });
      await loadShops();
      setActiveProduct(null);
      setSelectedShop(null);
      setStatus({ type: "success", message: `Product #${activeProduct.product_id} updated` });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setProductSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!activeProduct) return;

    try {
      setProductDeleting(true);
      await adminApi.deleteProduct(adminToken, activeProduct.product_id);
      await loadShops();
      setActiveProduct(null);
      setSelectedShop(null);
      setStatus({ type: "success", message: `Product #${activeProduct.product_id} deleted` });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setProductDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setProvinceFilter("all");
    setProductFilter("all");
  };

  const selectedImages = selectedShop
    ? shopImages.filter((image) => String(image.shop_id) === String(selectedShop.shop_id))
    : [];
  const selectedProducts = selectedShop
    ? products.filter((product) => String(product.shop_id) === String(selectedShop.shop_id))
    : [];
  const activeProductImages = activeProduct
    ? productImages.filter((image) => String(image.product_id) === String(activeProduct.product_id))
    : [];
  const paginatedShopImages = useMemo(() => paginate(selectedImages, shopImagesPage), [selectedImages, shopImagesPage]);
  const paginatedShopProducts = useMemo(() => paginate(selectedProducts, shopProductsPage), [selectedProducts, shopProductsPage]);

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
        <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Shops Management</p>
        <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">Shops</h3>

        {status.message && (
          <div className={`mt-5 rounded-2xl px-4 py-3 text-sm ${status.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
            {status.message}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
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
          placeholder="Search by shop name, email, phone, address, or id..."
          className="admin-input mt-6"
        />

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="admin-input">
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Province</span>
            <select value={provinceFilter} onChange={(event) => setProvinceFilter(event.target.value)} className="admin-input">
              <option value="all">All provinces</option>
              {provinceOptions.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-[#8d9577]">Products</span>
            <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)} className="admin-input">
              <option value="all">All shops</option>
              <option value="with-products">With products</option>
              <option value="no-products">No products</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#fcfbf7] px-4 py-4 ring-1 ring-[#efe8d8]">
          <div>
            <p className="text-sm font-medium text-[#2f3529]">
              Showing {filteredShops.length} shop{filteredShops.length === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">
              {hasActiveFilters ? "Filtered operating list" : "All shop profiles"}
            </p>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear filters
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="py-8 text-sm text-[#7a8368]">Loading...</div>
          ) : filteredShops.length === 0 ? (
            <div className="rounded-2xl bg-[#f8f4eb] px-4 py-10 text-sm text-[#7a8368]">
              No matching shops found. Try changing the search or filters.
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="text-[#8d9577]">
                <tr>
                  <th className="pb-3">Shop</th>
                  <th className="pb-3">Owner</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShops.items.map((shop) => (
                  <tr
                    key={shop.shop_id}
                    onClick={() => {
                      setSelectedShop(shop);
                      setActiveProduct(null);
                    }}
                    className={`cursor-pointer border-t border-[#efe8d8] transition hover:bg-[#fcfbf7] ${
                      selectedShop?.shop_id === shop.shop_id ? "bg-[#f8f4eb]" : ""
                    }`}
                  >
                    <td className="py-4">
                      <p className="font-semibold text-[#2f3529]">{shop.shop_name || `Shop #${shop.shop_id}`}</p>
                      <p className="mt-1 text-xs text-[#7a8368]">Shop #{shop.shop_id}</p>
                    </td>
                    <td className="py-4">{shop.email || `User #${shop.user_id}`}</td>
                    <td className="py-4">{shop.phone || shop.contact_info || "-"}</td>
                    <td className="py-4">{[shop.province, shop.district, shop.subdistrict].filter(Boolean).join(", ") || "-"}</td>
                    <td className="py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getVerificationTone(shop.verified_status)}`}>
                        {getVerificationStatusLabel(shop.verified_status)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedShop(shop);
                          setActiveProduct(null);
                        }}
                        className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b]"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination currentPage={paginatedShops.page} totalPages={paginatedShops.totalPages} onPageChange={setPage} />
      </div>

      {selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6" onClick={() => {
          setSelectedShop(null);
          setActiveProduct(null);
        }}>
          <div
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Shop Detail</p>
                <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{selectedShop.shop_name || `Shop #${selectedShop.shop_id}`}</h3>
              </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedShop(null);
                    setActiveProduct(null);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]"
                >
                X
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <MetaCard label="Shop ID" value={`#${selectedShop.shop_id}`} />
              <MetaCard label="User ID" value={selectedShop.user_id} />
              <MetaCard label="Owner Email" value={selectedShop.email || "-"} />
              <MetaCard label="Phone" value={selectedShop.phone || "-"} />
              <MetaCard label="Contact Info" value={selectedShop.contact_info || "-"} />
              <MetaCard label="Status" value={getVerificationStatusLabel(selectedShop.verified_status)} />
              <MetaCard label="Address" value={selectedShop.address || "-"} />
              <MetaCard label="Location" value={[selectedShop.province, selectedShop.district, selectedShop.subdistrict].filter(Boolean).join(", ") || "-"} />
            </div>

            <div className="mt-6 rounded-[24px] bg-[#fcfbf7] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Description</p>
              <p className="mt-3 text-sm leading-7 text-[#4b5541]">{selectedShop.description || "No description provided."}</p>
            </div>

            <div className="mt-6 rounded-[24px] bg-[#f8f4eb] p-5 ring-1 ring-[#e6ddc9]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Shop Management</p>
                  <h4 className="mt-2 text-xl font-semibold text-[#2f3529]">Edit Shop</h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({
                      title: "Save Shop",
                      message: `Save changes for shop #${selectedShop.shop_id}?`,
                      confirmLabel: "Save Shop",
                      tone: "primary",
                      onConfirm: handleUpdateShop,
                    })
                  }
                  disabled={shopSaving}
                  className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {shopSaving ? "Saving..." : "Save Shop"}
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="Shop Name">
                  <input value={shopForm.shop_name} onChange={(event) => handleShopFieldChange("shop_name", event.target.value)} className="admin-input" />
                </Field>
                <Field label="Phone">
                  <input value={shopForm.phone} onChange={(event) => handleShopFieldChange("phone", event.target.value)} className="admin-input" />
                </Field>
                <Field label="Contact Info">
                  <input value={shopForm.contact_info} onChange={(event) => handleShopFieldChange("contact_info", event.target.value)} className="admin-input" />
                </Field>
                <Field label="Opening Hours">
                  <input value={shopForm.opening_hours} onChange={(event) => handleShopFieldChange("opening_hours", event.target.value)} className="admin-input" />
                </Field>
                <Field label="Province">
                  <input value={shopForm.province} onChange={(event) => handleShopFieldChange("province", event.target.value)} className="admin-input" />
                </Field>
                <Field label="District">
                  <input value={shopForm.district} onChange={(event) => handleShopFieldChange("district", event.target.value)} className="admin-input" />
                </Field>
                <Field label="Subdistrict">
                  <input value={shopForm.subdistrict} onChange={(event) => handleShopFieldChange("subdistrict", event.target.value)} className="admin-input" />
                </Field>
                <Field label="Address">
                  <input value={shopForm.address} onChange={(event) => handleShopFieldChange("address", event.target.value)} className="admin-input" />
                </Field>
              </div>
              <Field label="Description" className="mt-4">
                <textarea value={shopForm.description} onChange={(event) => handleShopFieldChange("description", event.target.value)} className="admin-input min-h-28" />
              </Field>
            </div>

            <label className="mt-6 block">
              <span className="mb-2 block text-sm font-medium text-[#4b5541]">Admin Note</span>
              <textarea
                value={notesByShopId[selectedShop.shop_id] ?? selectedShop.admin_note ?? ""}
                onChange={(event) =>
                  setNotesByShopId((current) => ({ ...current, [selectedShop.shop_id]: event.target.value }))
                }
                className="admin-input min-h-28"
                placeholder="Add approval note or hold reason..."
              />
            </label>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Shop Images</p>
              {!selectedImages.length ? (
                <div className="mt-3 rounded-2xl bg-[#f8f4eb] px-4 py-6 text-sm text-[#7a8368]">No shop images yet.</div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                  {paginatedShopImages.items.map((image) => (
                    <div key={image.image_id} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-[#e6ddc9]">
                      <img src={assetUrl(image.image_path)} alt="" className="h-44 w-full object-cover" />
                      <div className="px-4 py-3 text-xs text-[#7a8368]">Image #{image.image_id}</div>
                    </div>
                  ))}
                  </div>
                  <Pagination
                    currentPage={paginatedShopImages.page}
                    totalPages={paginatedShopImages.totalPages}
                    onPageChange={setShopImagesPage}
                  />
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Products</p>
                <span className="rounded-full bg-[#efe8d8] px-3 py-1 text-xs font-medium text-[#485b3b]">
                  {selectedProducts.length}
                </span>
              </div>
              {!selectedProducts.length ? (
                <div className="mt-3 rounded-2xl bg-[#f8f4eb] px-4 py-6 text-sm text-[#7a8368]">No products in this shop.</div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                  {paginatedShopProducts.items.map((product) => {
                    const previewImage = productImages.find((image) => String(image.product_id) === String(product.product_id));
                    return (
                      <button
                        key={product.product_id}
                        type="button"
                        onClick={() => setActiveProduct(product)}
                        className="overflow-hidden rounded-[24px] bg-white text-left ring-1 ring-[#e6ddc9] transition hover:ring-[#cbbf9d]"
                      >
                        <div className="flex gap-4 p-4">
                          <div className="h-24 w-24 overflow-hidden rounded-2xl bg-[#f8f4eb]">
                            {previewImage?.image_path ? (
                              <img src={assetUrl(previewImage.image_path)} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-[#8d9577]">No Image</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-semibold text-[#2f3529]">{product.tea_name || `Product #${product.product_id}`}</p>
                              <span className="rounded-full bg-[#f8f4eb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#485b3b]">
                                #{product.product_id}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-[#7a8368]">{product.tea_type || "-"}</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <MetaMini label="Price" value={Number(product.price || 0).toFixed(2)} />
                              <MetaMini label="Stock" value={product.stock} />
                              <MetaMini label="Sales 7D" value={product.sales_7d} />
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  </div>
                  <Pagination
                    currentPage={paginatedShopProducts.page}
                    totalPages={paginatedShopProducts.totalPages}
                    onPageChange={setShopProductsPage}
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: "Approve Shop",
                    message: `Approve shop #${selectedShop.shop_id}?`,
                    confirmLabel: "Approve Shop",
                    tone: "primary",
                    onConfirm: () => handleStatusChange(selectedShop.shop_id, 1),
                  })
                }
                className="rounded-full bg-[#eef6ea] px-5 py-3 text-sm font-medium text-[#386132]"
              >
                Approve Shop
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: "Reject Shop",
                    message: `Reject shop #${selectedShop.shop_id}?`,
                    confirmLabel: "Reject Shop",
                    tone: "danger",
                    onConfirm: () => handleStatusChange(selectedShop.shop_id, 2),
                  })
                }
                className="rounded-full bg-[#fff0ed] px-5 py-3 text-sm font-medium text-[#b33a24]"
              >
                Reject Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {activeProduct ? (
        <ProductDetailModal
          product={activeProduct}
          images={activeProductImages}
          form={productForm}
          onFieldChange={handleProductFieldChange}
          onUpdate={handleUpdateProduct}
          onDelete={handleDeleteProduct}
          saving={productSaving}
          deleting={productDeleting}
          onClose={() => setActiveProduct(null)}
        />
      ) : null}
      {confirmAction ? (
        <ConfirmActionModal
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

function ProductDetailModal({ product, images, form, onFieldChange, onUpdate, onDelete, saving, deleting, onClose }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [imagesPage, setImagesPage] = useState(1);
  const paginatedImages = useMemo(() => paginate(images, imagesPage), [images, imagesPage]);

  useEffect(() => {
    setImagesPage(1);
  }, [images]);

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4 py-6" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Product Detail</p>
            <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{product.tea_name || `Product #${product.product_id}`}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]"
          >
            X
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <MetaCard label="Product ID" value={`#${product.product_id}`} />
          <MetaCard label="Shop ID" value={`#${product.shop_id}`} />
          <MetaCard label="Tea Type" value={product.tea_type || "-"} />
          <MetaCard label="Price" value={Number(product.price || 0).toFixed(2)} />
          <MetaCard label="Stock" value={product.stock} />
          <MetaCard label="Sales 7 Days" value={product.sales_7d} />
        </div>

        <div className="mt-6 rounded-[24px] bg-[#fcfbf7] p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Description</p>
          <p className="mt-3 text-sm leading-7 text-[#4b5541]">{product.description || "No description provided."}</p>
        </div>

        <div className="mt-6 rounded-[24px] bg-[#f8f4eb] p-5 ring-1 ring-[#e6ddc9]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Product Management</p>
              <h4 className="mt-2 text-xl font-semibold text-[#2f3529]">Edit Product</h4>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: "Delete Product",
                    message: `Delete product #${product.product_id}?`,
                    confirmLabel: "Delete Product",
                    tone: "danger",
                    onConfirm: onDelete,
                  })
                }
                disabled={deleting}
                className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Product"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({
                    title: "Save Product",
                    message: `Save changes for product #${product.product_id}?`,
                    confirmLabel: "Save Product",
                    tone: "primary",
                    onConfirm: onUpdate,
                  })
                }
                disabled={saving}
                className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="Tea Name">
              <input value={form.tea_name} onChange={(event) => onFieldChange("tea_name", event.target.value)} className="admin-input" />
            </Field>
            <Field label="Tea Type">
              <input value={form.tea_type} onChange={(event) => onFieldChange("tea_type", event.target.value)} className="admin-input" />
            </Field>
            <Field label="Price">
              <input type="number" min="0" value={form.price} onChange={(event) => onFieldChange("price", event.target.value)} className="admin-input" />
            </Field>
            <Field label="Stock">
              <input type="number" min="0" value={form.stock} onChange={(event) => onFieldChange("stock", event.target.value)} className="admin-input" />
            </Field>
          </div>
          <Field label="Description" className="mt-4">
            <textarea value={form.description} onChange={(event) => onFieldChange("description", event.target.value)} className="admin-input min-h-28" />
          </Field>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Product Images</p>
          {!images.length ? (
            <div className="mt-3 rounded-2xl bg-[#f8f4eb] px-4 py-6 text-sm text-[#7a8368]">No product images yet.</div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {paginatedImages.items.map((image) => (
                  <div key={image.image_id} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-[#e6ddc9]">
                    <img src={assetUrl(image.image_path)} alt="" className="h-48 w-full object-cover" />
                    <div className="px-4 py-3 text-xs text-[#7a8368]">Image #{image.image_id}</div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={paginatedImages.page} totalPages={paginatedImages.totalPages} onPageChange={setImagesPage} />
            </div>
          )}
        </div>
      </div>
    </div>
    {confirmAction ? (
      <ConfirmActionModal
        {...confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={async () => {
          await confirmAction.onConfirm();
          setConfirmAction(null);
        }}
      />
    ) : null}
    </>
  );
}

function ConfirmActionModal({ title, message, confirmLabel, tone = "primary", onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-6" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-[#e6ddc9]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm uppercase tracking-[0.3em] text-[#8d9577]">Confirm Action</p>
        <h4 className="mt-3 text-2xl font-semibold text-[#2f3529]">{title}</h4>
        <p className="mt-3 text-sm leading-6 text-[#4b5541]">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b]">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-xs font-medium text-white ${tone === "danger" ? "bg-[#b33a24]" : "bg-[#485b3b]"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f8f4eb] px-4 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">{label}</p>
      <p className="mt-2 text-sm text-[#2f3529]">{value || "-"}</p>
    </div>
  );
}

function MetaMini({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f8f4eb] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#8d9577]">{label}</p>
      <p className="mt-1 text-sm text-[#2f3529]">{value || "-"}</p>
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`block ${className}`.trim()}>
      <span className="mb-2 block text-sm font-medium text-[#4b5541]">{label}</span>
      {children}
    </label>
  );
}

function paginate(items, page, pageSize = 10) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    totalPages,
  };
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Prev
      </button>
      <span className="text-sm text-[#657056]">Page {currentPage} / {totalPages}</span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
