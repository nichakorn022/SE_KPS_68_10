import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SiteNavbar from "../components/SiteNavbar";
import { apiUrl, assetUrl } from "../../lib/api";
import { getAuthHeaders, getStoredToken, getUserRoleFromToken } from "./authClient";

const api = {
  getOwnProducts: () =>
    fetch(apiUrl("/products/mine"), { headers: getAuthHeaders() }).then(async (response) => {
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data?.error || data?.message || `Products ${response.status}`);
      return data;
    }),
  getProductImages: () =>
    fetch(apiUrl("/product-images")).then(async (response) => {
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data?.error || data?.message || `Images ${response.status}`);
      return data;
    }),
  createOwnProduct: (payload) =>
    fetch(apiUrl("/products/mine"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || data?.message || `Create ${response.status}`);
      return data;
    }),
  updateOwnProduct: (id, payload) =>
    fetch(apiUrl(`/products/mine/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || data?.message || `Update ${response.status}`);
      return data;
    }),
  uploadProductImage: (productId, file) => {
    const formData = new FormData();
    formData.append("product_id", String(productId));
    formData.append("image", file);

    return fetch(apiUrl("/product-images"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || data?.message || `Upload ${response.status}`);
      return data;
    });
  },
  deleteOwnProduct: (id) =>
    fetch(apiUrl(`/products/mine/${id}`), {
      method: "DELETE",
      headers: getAuthHeaders(),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || data?.message || `Delete ${response.status}`);
      return data;
    }),
};

const TEA_TYPE_OPTIONS = [
  "Green Tea",
  "Black Tea",
  "Oolong Tea",
  "White Tea",
  "Herbal Tea",
  "Milk Tea",
  "Matcha",
  "Fruit Tea",
];

const initialForm = {
  tea_name: "",
  tea_type_choice: "",
  tea_type: "",
  description: "",
  price: "",
  stock: "",
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#485847]">{label}</span>
      {children}
    </label>
  );
}

function ProductCard({ product, onEdit, onDelete }) {
  const lowStock = Number(product.stock || 0) <= 5;

  return (
    <div className="rounded-[28px] border border-[#E0E6D7] bg-white/90 p-5 shadow-[0_14px_36px_rgba(72,91,59,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-[22px] bg-[#F1F4EB] ring-1 ring-[#E0E6D7]">
            {product.image_path ? (
              <img src={assetUrl(product.image_path)} alt={product.tea_name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-[#8A9A7F]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-8 w-8">
                  <rect x="4" y="5" width="16" height="14" rx="3" />
                  <circle cx="9" cy="10" r="1.4" />
                  <path d="m7 16 3.2-3.2a1.4 1.4 0 0 1 2 0L17 17" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[1.12rem] font-semibold text-[#273723]">{product.tea_name}</p>
            <p className="mt-1 text-sm text-[#75816F]">{product.tea_type || "Unspecified tea type"}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lowStock ? "bg-[#FBE6DE] text-[#A7573B]" : "bg-[#ECF4E6] text-[#557043]"}`}>
          {lowStock ? "Low stock" : "In stock"}
        </span>
      </div>

      <p className="mt-4 line-clamp-3 min-h-[4.5rem] text-sm leading-7 text-[#647160]">
        {product.description || "No description yet. Add a short product story to strengthen the storefront."}
      </p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[1.2rem] font-semibold text-[#506B3F]">ß{Number(product.price || 0).toLocaleString("th-TH")}</p>
          <p className={`mt-1 text-sm ${lowStock ? "text-[#A7573B]" : "text-[#6D7868]"}`}>Stock {Number(product.stock || 0).toLocaleString("th-TH")}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => onEdit(product)} className="rounded-full border border-[#D7E1CC] px-4 py-2 text-sm font-semibold text-[#526949]">
            Edit
          </button>
          <button type="button" onClick={() => onDelete(product.product_id)} className="rounded-full border border-[#F0D7CF] px-4 py-2 text-sm font-semibold text-[#B25A44]">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SellerProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const role = getUserRoleFromToken();
  const fileInputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const lowStockCount = useMemo(() => products.filter((item) => Number(item.stock || 0) <= 5).length, [products]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [rows, imageRows] = await Promise.all([api.getOwnProducts(), api.getProductImages().catch(() => [])]);
      const imageMap = new Map();

      (Array.isArray(imageRows) ? imageRows : []).forEach((item) => {
        if (!imageMap.has(item.product_id) && item.image_path) {
          imageMap.set(Number(item.product_id), item.image_path);
        }
      });

      const mergedRows = (Array.isArray(rows) ? rows : []).map((item) => ({
        ...item,
        image_path: imageMap.get(Number(item.product_id)) || null,
      }));

      setProducts(mergedRows);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Failed to load products" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getStoredToken() || role !== "shop") {
      setLoading(false);
      setStatus({ type: "error", message: "This page is available only for shop accounts" });
      return;
    }

    loadProducts();
  }, [role]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const clearSelectedImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
    clearSelectedImage();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedImageFile(file);

    if (imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    if (file) {
      setImagePreviewUrl(URL.createObjectURL(file));
    } else if (editingId) {
      const existingProduct = products.find((item) => Number(item.product_id) === Number(editingId));
      setImagePreviewUrl(existingProduct?.image_path || "");
    } else {
      setImagePreviewUrl("");
    }
  };

  const handleEdit = (product) => {
    const currentTeaType = product.tea_type ?? "";
    const isPresetTeaType = TEA_TYPE_OPTIONS.includes(currentTeaType);

    setEditingId(product.product_id);
    setForm({
      tea_name: product.tea_name ?? "",
      tea_type_choice: currentTeaType ? (isPresetTeaType ? currentTeaType : "Other") : "",
      tea_type: isPresetTeaType ? currentTeaType : currentTeaType,
      description: product.description ?? "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
    });
    setSelectedImageFile(null);
    setImagePreviewUrl(product.image_path || "");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatus({ type: "", message: "" });
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || products.length === 0) return;

    const targetProduct = products.find((item) => Number(item.product_id) === Number(editId));
    if (!targetProduct) return;

    handleEdit(targetProduct);
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.delete("edit");
      return nextParams;
    }, { replace: true });
  }, [products, searchParams, setSearchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const resolvedTeaType =
      form.tea_type_choice === "Other"
        ? form.tea_type.trim()
        : form.tea_type_choice || form.tea_type.trim();

    const payload = {
      tea_name: form.tea_name.trim(),
      tea_type: resolvedTeaType || null,
      description: form.description.trim() || null,
      price: Number(form.price),
      stock: Number(form.stock || 0),
    };

    try {
      if (!payload.tea_name || Number.isNaN(payload.price)) {
        throw new Error("Tea name and price are required");
      }

      let productId = editingId;

      if (editingId) {
        await api.updateOwnProduct(editingId, payload);
      } else {
        const created = await api.createOwnProduct(payload);
        productId = created?.product_id;
      }

      if (selectedImageFile) {
        if (!productId) {
          throw new Error("Product was saved but image could not be linked");
        }
        await api.uploadProductImage(productId, selectedImageFile);
      }

      const successMessage = editingId
        ? selectedImageFile
          ? "Product and image updated"
          : "Product updated"
        : selectedImageFile
          ? "Product created with image"
          : "Product created";

      resetForm();
      await loadProducts();
      setStatus({ type: "success", message: successMessage });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Failed to save product" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await api.deleteOwnProduct(productId);
      if (editingId === productId) resetForm();
      await loadProducts();
      setStatus({ type: "success", message: "Product deleted" });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Failed to delete product" });
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F5F3EA_0%,#EFF3EB_45%,#F6F1E6_100%)] text-[#253622]">
      <SiteNavbar active="seller" />

      <main className="px-4 pb-16 pt-6 sm:px-6 xl:px-8 2xl:px-10">
        <div className="mx-auto flex max-w-[1540px] flex-col gap-8">
          <section className="rounded-[34px] border border-[#DFE5D6] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(241,246,234,0.92))] p-7 shadow-[0_24px_70px_rgba(72,91,59,0.12)] sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#839678]">Seller Products</p>
                <h1 className="mt-2 font-serif text-[2.6rem] tracking-[-0.05em] text-[#253622]">Build and refine your tea catalog</h1>
                <p className="mt-3 max-w-2xl text-sm leading-8 text-[#647160]">
                  Add new tea listings, adjust pricing, and keep stock visible so the storefront stays current and usable.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-white/88 px-4 py-2 text-sm text-[#596957] ring-1 ring-[#D9E2CF]">{products.length} product(s)</span>
                <span className="rounded-full bg-[#FBEFE6] px-4 py-2 text-sm text-[#9B5A3C] ring-1 ring-[#F0D6C8]">{lowStockCount} low stock</span>
                <Link to="/seller" className="rounded-full border border-[#D4DDC9] bg-white/88 px-5 py-2.5 text-sm font-semibold text-[#51684A]">Back to hub</Link>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[430px_1fr]">
            <form onSubmit={handleSubmit} className="rounded-[32px] border border-[#E1E7D8] bg-white/88 p-7 shadow-[0_18px_48px_rgba(72,91,59,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-[#839678]">{editingId ? "Edit Product" : "New Product"}</p>
              <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.04em] text-[#253621]">{editingId ? "Update your listing" : "Add a new tea"}</h2>

              <div className="mt-6 space-y-4">
                <Field label="Tea name">
                  <input name="tea_name" value={form.tea_name} onChange={handleChange} className="w-full rounded-[18px] border border-[#D8E0CE] bg-[#FBFCF9] px-4 py-3 outline-none focus:border-[#738A5E]" required />
                </Field>
                <Field label="Product image">
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-[24px] border border-[#D8E0CE] bg-[#F6F8F1]">
                      {imagePreviewUrl ? (
                        <img src={/^blob:|^https?:/i.test(imagePreviewUrl) ? imagePreviewUrl : assetUrl(imagePreviewUrl)} alt="Product preview" className="h-52 w-full object-cover" />
                      ) : (
                        <div className="grid h-52 place-items-center text-sm text-[#7B8774]">
                          No image selected yet
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="w-full rounded-[18px] border border-[#D8E0CE] bg-[#FBFCF9] px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[#485B3B] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                    />
                    <p className="text-xs leading-6 text-[#74806D]">
                      Upload JPG, PNG, WEBP, or GIF up to 5 MB. {editingId ? "Selecting a new image will add it as the latest product image." : "Image upload is optional."}
                    </p>
                  </div>
                </Field>
                <Field label="Tea type">
                  <div className="space-y-3">
                    <select
                      name="tea_type_choice"
                      value={form.tea_type_choice}
                      onChange={(event) => {
                        const nextChoice = event.target.value;
                        setForm((current) => ({
                          ...current,
                          tea_type_choice: nextChoice,
                          tea_type: nextChoice && nextChoice !== "Other" ? nextChoice : current.tea_type,
                        }));
                      }}
                      className="w-full rounded-[18px] border border-[#D8E0CE] bg-[#FBFCF9] px-4 py-3 outline-none focus:border-[#738A5E]"
                    >
                      <option value="">Select tea type</option>
                      {TEA_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>

                    {form.tea_type_choice === "Other" && (
                      <input
                        name="tea_type"
                        value={form.tea_type}
                        onChange={handleChange}
                        placeholder="Enter custom tea type"
                        className="w-full rounded-[18px] border border-[#D8E0CE] bg-[#FBFCF9] px-4 py-3 outline-none focus:border-[#738A5E]"
                      />
                    )}
                  </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Price">
                    <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} className="w-full rounded-[18px] border border-[#D8E0CE] bg-[#FBFCF9] px-4 py-3 outline-none focus:border-[#738A5E]" required />
                  </Field>
                  <Field label="Stock">
                    <input name="stock" type="number" value={form.stock} onChange={handleChange} className="w-full rounded-[18px] border border-[#D8E0CE] bg-[#FBFCF9] px-4 py-3 outline-none focus:border-[#738A5E]" required />
                  </Field>
                </div>
                <Field label="Description">
                  <textarea name="description" value={form.description} onChange={handleChange} className="min-h-32 w-full rounded-[18px] border border-[#D8E0CE] bg-[#FBFCF9] px-4 py-3 outline-none focus:border-[#738A5E]" />
                </Field>
              </div>

              {status.message ? (
                <div className={`mt-5 rounded-[20px] px-4 py-3 text-sm ${status.type === "error" ? "bg-[#FFF0ED] text-[#B33A24]" : "bg-[#EEF6EA] text-[#386132]"}`}>
                  {status.message}
                </div>
              ) : null}

              <div className="mt-6 flex gap-3">
                <button type="submit" disabled={saving} className="rounded-full bg-[#485B3B] px-5 py-3 text-sm font-medium text-white">
                  {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                </button>
                <button type="button" onClick={resetForm} className="rounded-full bg-[#EFE8D8] px-5 py-3 text-sm font-medium text-[#485B3B]">
                  Reset
                </button>
              </div>
            </form>

            <div className="rounded-[32px] border border-[#E1E7D8] bg-white/88 p-7 shadow-[0_18px_48px_rgba(72,91,59,0.08)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#839678]">Inventory List</p>
                  <h2 className="mt-3 text-[1.9rem] font-semibold tracking-[-0.04em] text-[#253621]">Current storefront products</h2>
                </div>
              </div>

              {loading ? (
                <div className="mt-6 text-sm text-[#74806D]">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="mt-6 rounded-[26px] border border-dashed border-[#D8E0CE] bg-[#F8FBF4] p-8 text-center text-[#687564]">
                  No products yet. Create your first listing from the form on the left.
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.product_id} product={product} onEdit={handleEdit} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
