import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";
import AdminPagination, { paginate } from "./components/AdminPagination";
import AdminConfirmActionModal from "./components/AdminConfirmActionModal";
import { ProductDetailModal, ShopDetailModal } from "./components/AdminShopsDetails";
import AdminFilterSummary from "./components/AdminFilterSummary";

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

        <AdminFilterSummary
          count={filteredShops.length}
          noun="shop"
          filteredLabel="Filtered operating list"
          defaultLabel="All shop profiles"
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />

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
                      <p className="font-semibold text-[#2f3529]">{shop.shop_name || `Shop ${shop.shop_id}`}</p>
                    </td>
                    <td className="py-4">{shop.email || "Owner account"}</td>
                    <td className="py-4">{shop.phone || shop.contact_info || "-"}</td>
                    <td className="py-4">{[shop.province, shop.district, shop.subdistrict].filter(Boolean).join(", ") || "-"}</td>
                    <td className="py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getVerificationTone(shop.verified_status)}`}>
                        {getVerificationStatusLabel(shop.verified_status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <AdminPagination currentPage={paginatedShops.page} totalPages={paginatedShops.totalPages} onPageChange={setPage} />
      </div>

      {selectedShop ? (
        <ShopDetailModal
          selectedShop={selectedShop}
          setActiveProduct={setActiveProduct}
          onClose={() => {
            setSelectedShop(null);
            setActiveProduct(null);
          }}
          shopForm={shopForm}
          handleShopFieldChange={handleShopFieldChange}
          handleUpdateShop={handleUpdateShop}
          shopSaving={shopSaving}
          setConfirmAction={setConfirmAction}
          notesByShopId={notesByShopId}
          setNotesByShopId={setNotesByShopId}
          selectedImages={selectedImages}
          paginatedShopImages={paginatedShopImages}
          setShopImagesPage={setShopImagesPage}
          selectedProducts={selectedProducts}
          productImages={productImages}
          paginatedShopProducts={paginatedShopProducts}
          setShopProductsPage={setShopProductsPage}
          getVerificationStatusLabel={getVerificationStatusLabel}
        />
      ) : null}

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



