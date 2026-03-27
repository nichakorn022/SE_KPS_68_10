import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";

const initialForm = {
  shop_id: "",
  tea_name: "",
  tea_type: "",
  description: "",
  price: "",
  stock: "",
};

export default function AdminProductsPage() {
  const { adminToken } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    try {
      const [productRows, shopRows] = await Promise.all([
        adminApi.getProducts(adminToken),
        adminApi.getShops(adminToken),
      ]);
      setProducts(productRows);
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleEdit = (product) => {
    setEditingId(product.product_id);
    setForm({
      shop_id: String(product.shop_id ?? ""),
      tea_name: product.tea_name ?? "",
      tea_type: product.tea_type ?? "",
      description: product.description ?? "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? 0),
    });
    setStatus({ type: "", message: "" });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      shop_id: Number(form.shop_id),
      tea_name: form.tea_name.trim(),
      tea_type: form.tea_type.trim() || null,
      description: form.description.trim() || null,
      price: Number(form.price),
      stock: Number(form.stock || 0),
    };

    try {
      if (editingId) {
        await adminApi.updateProduct(adminToken, editingId, payload);
        setStatus({ type: "success", message: "Product updated" });
      } else {
        await adminApi.createProduct(adminToken, payload);
        setStatus({ type: "success", message: "Product created" });
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
      setStatus({ type: "success", message: "Product deleted" });
      loadData();
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={handleSubmit} className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
          <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">
            {editingId ? "Edit Product" : "New Product"}
          </p>
          <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">Products Management</h3>

          <div className="mt-6 space-y-4">
            <Field label="Shop">
              <select
                name="shop_id"
                value={form.shop_id}
                onChange={handleChange}
                className="admin-input"
                required
              >
                <option value="">Select shop</option>
                {shops.map((shop) => (
                  <option key={shop.shop_id} value={shop.shop_id}>
                    {shop.shop_name}
                  </option>
                ))}
              </select>
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
          </div>

          {status.message && (
            <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${status.type === "error" ? "bg-[#fff0ed] text-[#b33a24]" : "bg-[#eef6ea] text-[#386132]"}`}>
              {status.message}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button type="submit" className="rounded-full bg-[#485b3b] px-5 py-3 text-sm font-medium text-white">
              {editingId ? "Update Product" : "Create Product"}
            </button>
            <button type="button" onClick={resetForm} className="rounded-full bg-[#efe8d8] px-5 py-3 text-sm font-medium text-[#485b3b]">
              Reset
            </button>
          </div>
        </form>

        <DataPanel title="Product List" loading={loading}>
          <table className="min-w-full text-left text-sm">
            <thead className="text-[#8d9577]">
              <tr>
                <th className="pb-3">Product</th>
                <th className="pb-3">Shop</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Stock</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.product_id} className="border-t border-[#efe8d8]">
                  <td className="py-4">
                    <p className="font-semibold text-[#2f3529]">{product.tea_name}</p>
                    <p className="text-xs text-[#7a8368]">{product.tea_type || "Unspecified"}</p>
                  </td>
                  <td className="py-4">{shops.find((shop) => String(shop.shop_id) === String(product.shop_id))?.shop_name || `#${product.shop_id}`}</td>
                  <td className="py-4">{Number(product.price).toFixed(2)}</td>
                  <td className="py-4">{product.stock}</td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(product)} className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b]">Edit</button>
                      <button onClick={() => handleDelete(product.product_id)} className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24]">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataPanel>
      </div>
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
