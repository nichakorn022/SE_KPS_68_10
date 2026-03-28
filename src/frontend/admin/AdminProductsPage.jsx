import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";
import { assetUrl } from "../../lib/api";

const initialForm = {
  tea_name: "",
  tea_type: "",
  description: "",
  price: "",
  stock: "",
};

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

export default function AdminProductsPage() {
  const { adminToken } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [shopSearchTerm, setShopSearchTerm] = useState("");
  const [menuSearchTerm, setMenuSearchTerm] = useState("");
  const [shopPage, setShopPage] = useState(1);
  const [menuPage, setMenuPage] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    try {
      const [productRows, shopRows, imageRows] = await Promise.all([
        adminApi.getProducts(adminToken),
        adminApi.getShops(adminToken),
        adminApi.getProductImages(adminToken),
      ]);
      setProducts(productRows);
      setProductImages(imageRows);
      setShops(shopRows);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [adminToken]);

  useEffect(() => {
    if (!shops.length) {
      setSelectedShopId("");
      return;
    }

    if (!shops.some((shop) => String(shop.shop_id) === String(selectedShopId))) {
      setSelectedShopId(String(shops[0].shop_id));
    }
  }, [selectedShopId, shops]);

  const selectedShop = shops.find((shop) => String(shop.shop_id) === String(selectedShopId)) || null;

  const selectedShopProducts = useMemo(
    () => products.filter((product) => String(product.shop_id) === String(selectedShopId)),
    [products, selectedShopId]
  );

  const filteredShops = useMemo(() => {
    if (!shopSearchTerm.trim()) return shops;

    const keyword = shopSearchTerm.trim().toLowerCase();
    return shops.filter((shop) => {
      const haystack = [shop.shop_name, shop.email, `shop ${shop.shop_id}`]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [shopSearchTerm, shops]);

  const filteredSelectedShopProducts = useMemo(() => {
    if (!menuSearchTerm.trim()) return selectedShopProducts;

    const keyword = menuSearchTerm.trim().toLowerCase();
    return selectedShopProducts.filter((product) => {
      const haystack = [product.tea_name, product.tea_type, product.description, `product ${product.product_id}`]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [menuSearchTerm, selectedShopProducts]);

  useEffect(() => {
    setShopPage(1);
  }, [shopSearchTerm]);

  useEffect(() => {
    setMenuPage(1);
  }, [menuSearchTerm, selectedShopId]);

  const paginatedShops = useMemo(() => paginate(filteredShops, shopPage), [filteredShops, shopPage]);
  const paginatedMenus = useMemo(
    () => paginate(filteredSelectedShopProducts, menuPage),
    [filteredSelectedShopProducts, menuPage]
  );

  const selectedProductImages = useMemo(() => {
    if (!editingId) return [];
    return productImages.filter((image) => String(image.product_id) === String(editingId));
  }, [editingId, productImages]);

  const summaryCards = useMemo(
    () => [
      { label: "Menus In Shop", value: selectedShopProducts.length },
      { label: "In Stock", value: selectedShopProducts.filter((product) => Number(product.stock) > 0).length },
      {
        label: "Low Stock",
        value: selectedShopProducts.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 5).length,
      },
    ],
    [selectedShopProducts, shops.length]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleEdit = (product) => {
    setEditingId(product.product_id);
    setSelectedShopId(String(product.shop_id));
    setIsShopModalOpen(true);
    setForm({
      tea_name: product.tea_name ?? "",
      tea_type: product.tea_type ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
    });
    setStatus({ type: "", message: "" });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setIsModalOpen(false);
  };

  const closeShopModal = () => {
    setIsShopModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedShopId) {
      setStatus({ type: "error", message: "Select a shop first" });
      return;
    }

    const payload = {
      shop_id: Number(selectedShopId),
      tea_name: form.tea_name.trim(),
      tea_type: form.tea_type.trim() || null,
      description: form.description.trim() || null,
      price: Number(form.price),
      stock: Number(form.stock || 0),
    };

    try {
      if (editingId) {
        await adminApi.updateProduct(adminToken, editingId, payload);
        setStatus({ type: "success", message: "Menu updated" });
      } else {
        await adminApi.createProduct(adminToken, payload);
        setStatus({ type: "success", message: "Menu created" });
      }

      resetForm();
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleDelete = async (productId) => {
    try {
      await adminApi.deleteProduct(adminToken, productId);
      if (editingId === productId) {
        resetForm();
      }
      setStatus({ type: "success", message: "Menu deleted" });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !editingId) return;

    try {
      await adminApi.uploadProductImage(adminToken, editingId, file);
      setStatus({ type: "success", message: "Product image uploaded" });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      event.target.value = "";
    }
  };

  const handleImageDelete = async (imageId) => {
    try {
      await adminApi.deleteProductImage(adminToken, imageId);
      setStatus({ type: "success", message: "Product image deleted" });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="space-y-6">
      <DataPanel title="Shop List" loading={loading}>
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] bg-[#f8f4eb] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d9577]">All Shops</p>
            <p className="mt-3 text-2xl font-semibold text-[#2f3529]">{shops.length}</p>
          </div>
          <div className="rounded-[24px] bg-[#f8f4eb] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d9577]">All Menus</p>
            <p className="mt-3 text-2xl font-semibold text-[#2f3529]">{products.length}</p>
          </div>
          <div className="rounded-[24px] bg-[#f8f4eb] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d9577]">In Stock</p>
            <p className="mt-3 text-2xl font-semibold text-[#2f3529]">
              {products.filter((product) => Number(product.stock) > 0).length}
            </p>
          </div>
          <div className="rounded-[24px] bg-[#f8f4eb] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d9577]">Low Stock</p>
            <p className="mt-3 text-2xl font-semibold text-[#2f3529]">
              {products.filter((product) => Number(product.stock) > 0 && Number(product.stock) <= 5).length}
            </p>
          </div>
        </div>

        <input
          value={shopSearchTerm}
          onChange={(event) => setShopSearchTerm(event.target.value)}
          placeholder="Search by shop name, email, or shop id..."
          className="admin-input mb-6"
        />

        <div className="space-y-4">
          {paginatedShops.items.map((shop) => {
            const shopMenus = products.filter((product) => String(product.shop_id) === String(shop.shop_id));

            return (
              <button
                key={shop.shop_id}
                type="button"
                onClick={() => {
                  setSelectedShopId(String(shop.shop_id));
                  resetForm();
                  setIsShopModalOpen(true);
                }}
                className="block w-full rounded-[24px] border border-[#efe8d8] bg-[#fcfbf7] px-5 py-5 text-left transition hover:border-[#d7ceb8] hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#2f3529]">{shop.shop_name}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8d9577]">
                    {shopMenus.length} menu
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#657056]">{shop.email || `Shop #${shop.shop_id}`}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#8d9577]">Click to open menu table</p>
              </button>
            );
          })}
        </div>
        <Pagination
          currentPage={paginatedShops.page}
          totalPages={paginatedShops.totalPages}
          onPageChange={setShopPage}
        />
      </DataPanel>

      {isShopModalOpen && selectedShop && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-4 py-6" onClick={closeShopModal}>
          <div
            className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Menu Table</p>
                <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{selectedShop.shop_name}</h3>
                <p className="mt-2 text-sm text-[#657056]">Choose a menu item to edit it in a popup.</p>
              </div>
              <button
                type="button"
                onClick={closeShopModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]"
              >
                X
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="rounded-[24px] bg-[#f8f4eb] px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d9577]">{card.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-[#2f3529]">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-[#2f3529]">{selectedShop.shop_name}</p>
                <p className="mt-1 text-sm text-[#657056]">Manage menu items for this shop.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                  setIsModalOpen(true);
                }}
                className="rounded-full bg-[#485b3b] px-5 py-3 text-sm font-medium text-white"
              >
                Add Menu
              </button>
            </div>

            <input
              value={menuSearchTerm}
              onChange={(event) => setMenuSearchTerm(event.target.value)}
              placeholder="Search by menu name, type, description, or product id..."
              className="admin-input mt-6"
            />

            <div className="mt-6 overflow-x-auto">
              {filteredSelectedShopProducts.length === 0 ? (
                <div className="py-8 text-sm text-[#7a8368]">This shop has no menu items yet.</div>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="text-[#8d9577]">
                    <tr>
                      <th className="pb-3">Menu</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Stock</th>
                      <th className="pb-3">Sales 7d</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedMenus.items.map((product) => (
                      <tr
                        key={product.product_id}
                        onClick={() => handleEdit(product)}
                        className={`cursor-pointer border-t border-[#efe8d8] transition hover:bg-[#fcfbf7] ${
                          editingId === product.product_id && isModalOpen ? "bg-[#f8f4eb]" : ""
                        }`}
                      >
                        <td className="py-4">
                          <p className="font-semibold text-[#2f3529]">{product.tea_name}</p>
                          <p className="mt-1 text-xs text-[#7a8368]">{product.tea_type || "Unspecified"}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#8d9577]">Click to review</p>
                        </td>
                        <td className="py-4">{formatMoney(product.price)}</td>
                        <td className="py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                              Number(product.stock) > 5
                                ? "bg-[#eef6ea] text-[#386132]"
                                : Number(product.stock) > 0
                                  ? "bg-[#fff4e2] text-[#a46317]"
                                  : "bg-[#fff0ed] text-[#b33a24]"
                            }`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="py-4">{Number(product.sales_7d || 0)}</td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEdit(product);
                              }}
                              className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b]"
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(product.product_id);
                              }}
                              className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24]"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <Pagination
              currentPage={paginatedMenus.page}
              totalPages={paginatedMenus.totalPages}
              onPageChange={setMenuPage}
            />
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6" onClick={resetForm}>
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">
                  {editingId ? "Edit Menu" : "New Menu"}
                </p>
                <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{selectedShop?.shop_name || "Menu Form"}</h3>
              </div>
              <button type="button" onClick={resetForm} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]">
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field label="Selected Shop">
                <input
                  value={selectedShop?.shop_name || ""}
                  className="admin-input"
                  disabled
                  placeholder="Select a shop from the left"
                />
              </Field>
              <Field label="Tea name">
                <input name="tea_name" value={form.tea_name} onChange={handleChange} className="admin-input" required />
              </Field>
              <Field label="Tea type">
                <input name="tea_type" value={form.tea_type} onChange={handleChange} className="admin-input" />
              </Field>
              <Field label="Price">
                <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} className="admin-input" required />
              </Field>
              <Field label="Stock">
                <input name="stock" type="number" value={form.stock} onChange={handleChange} className="admin-input" required />
              </Field>
              <Field label="Description">
                <textarea name="description" value={form.description} onChange={handleChange} className="admin-input min-h-28" />
              </Field>

              {editingId && (
                <div className="space-y-4 rounded-[24px] bg-[#f8f4eb] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Product Images</p>
                      <p className="mt-2 text-sm text-[#4b5541]">Upload or remove images for this menu item.</p>
                    </div>
                    <label className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white">
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>

                  {selectedProductImages.length === 0 ? (
                    <div className="rounded-2xl bg-white px-4 py-6 text-sm text-[#7a8368]">No images yet.</div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {selectedProductImages.map((image) => (
                        <div key={image.image_id} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-[#e6ddc9]">
                          <img src={assetUrl(image.image_path)} alt="" className="h-40 w-full object-cover" />
                          <div className="flex items-center justify-between gap-3 px-4 py-3">
                            <p className="text-xs text-[#7a8368]">Image #{image.image_id}</p>
                            <button
                              type="button"
                              onClick={() => handleImageDelete(image.image_id)}
                              className="rounded-full bg-[#fff0ed] px-3 py-2 text-xs font-medium text-[#b33a24]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center pt-2">
                <button type="submit" className="rounded-full bg-[#485b3b] px-5 py-3 text-sm font-medium text-white">
                  {editingId ? "Update Menu" : "Create Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {status.message && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${status.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
          {status.message}
        </div>
      )}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#4b5541]">{label}</span>
      {children}
    </label>
  );
}

function DataPanel({ title, loading, children }) {
  return (
    <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
      <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">{title}</p>
      <div className="mt-6 overflow-x-auto">
        {loading ? <div className="py-8 text-sm text-[#7a8368]">Loading...</div> : children}
      </div>
    </div>
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
