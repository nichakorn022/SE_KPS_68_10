import { useEffect, useMemo, useState } from "react";
import { assetUrl } from "../../../lib/api";
import AdminMetaCard from "./AdminMetaCard";
import AdminField from "./AdminField";
import AdminPagination, { paginate } from "./AdminPagination";
import AdminConfirmActionModal from "./AdminConfirmActionModal";

function MetaMini({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#f8f4eb] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#8d9577]">{label}</p>
      <p className="mt-1 text-sm text-[#2f3529]">{value || "-"}</p>
    </div>
  );
}

export function ShopDetailModal({
  selectedShop,
  setActiveProduct,
  onClose,
  shopForm,
  handleShopFieldChange,
  handleUpdateShop,
  shopSaving,
  setConfirmAction,
  notesByShopId,
  setNotesByShopId,
  selectedImages,
  paginatedShopImages,
  setShopImagesPage,
  selectedProducts,
  productImages,
  paginatedShopProducts,
  setShopProductsPage,
  getVerificationStatusLabel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Shop Detail</p>
            <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{selectedShop.shop_name || `Shop ${selectedShop.shop_id}`}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]">X</button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <AdminMetaCard label="Shop ID" value={`#${selectedShop.shop_id}`} />
          <AdminMetaCard label="User ID" value={selectedShop.user_id} />
          <AdminMetaCard label="Owner Email" value={selectedShop.email || "-"} />
          <AdminMetaCard label="Phone" value={selectedShop.phone || "-"} />
          <AdminMetaCard label="Contact Info" value={selectedShop.contact_info || "-"} />
          <AdminMetaCard label="Status" value={getVerificationStatusLabel(selectedShop.verified_status)} />
          <AdminMetaCard label="Address" value={selectedShop.address || "-"} />
          <AdminMetaCard label="Location" value={[selectedShop.province, selectedShop.district, selectedShop.subdistrict].filter(Boolean).join(", ") || "-"} />
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
            <button type="button" onClick={() => setConfirmAction({ title: "Save Shop", message: `Save changes for shop #${selectedShop.shop_id}?`, confirmLabel: "Save Shop", tone: "primary", onConfirm: handleUpdateShop })} disabled={shopSaving} className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{shopSaving ? "Saving..." : "Save Shop"}</button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <AdminField label="Shop Name"><input value={shopForm.shop_name} onChange={(event) => handleShopFieldChange("shop_name", event.target.value)} className="admin-input" /></AdminField>
            <AdminField label="Phone"><input value={shopForm.phone} onChange={(event) => handleShopFieldChange("phone", event.target.value)} className="admin-input" /></AdminField>
            <AdminField label="Contact Info"><input value={shopForm.contact_info} onChange={(event) => handleShopFieldChange("contact_info", event.target.value)} className="admin-input" /></AdminField>
            <AdminField label="Opening Hours"><input value={shopForm.opening_hours} onChange={(event) => handleShopFieldChange("opening_hours", event.target.value)} className="admin-input" /></AdminField>
            <AdminField label="Province"><input value={shopForm.province} onChange={(event) => handleShopFieldChange("province", event.target.value)} className="admin-input" /></AdminField>
            <AdminField label="District"><input value={shopForm.district} onChange={(event) => handleShopFieldChange("district", event.target.value)} className="admin-input" /></AdminField>
            <AdminField label="Subdistrict"><input value={shopForm.subdistrict} onChange={(event) => handleShopFieldChange("subdistrict", event.target.value)} className="admin-input" /></AdminField>
            <AdminField label="Address"><input value={shopForm.address} onChange={(event) => handleShopFieldChange("address", event.target.value)} className="admin-input" /></AdminField>
          </div>
          <AdminField label="Description" className="mt-4"><textarea value={shopForm.description} onChange={(event) => handleShopFieldChange("description", event.target.value)} className="admin-input min-h-28" /></AdminField>
        </div>
        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-medium text-[#4b5541]">Admin Note</span>
          <textarea value={notesByShopId[selectedShop.shop_id] ?? selectedShop.admin_note ?? ""} onChange={(event) => setNotesByShopId((current) => ({ ...current, [selectedShop.shop_id]: event.target.value }))} className="admin-input min-h-28" placeholder="Add approval note or hold reason..." />
        </label>
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Shop Images</p>
          {!selectedImages.length ? <div className="mt-3 rounded-2xl bg-[#f8f4eb] px-4 py-6 text-sm text-[#7a8368]">No shop images yet.</div> : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {paginatedShopImages.items.map((image) => (
                  <div key={image.image_id} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-[#e6ddc9]">
                    <img src={assetUrl(image.image_path)} alt="" className="h-44 w-full object-cover" />
                    <div className="px-4 py-3 text-xs text-[#7a8368]">Image #{image.image_id}</div>
                  </div>
                ))}
              </div>
              <AdminPagination currentPage={paginatedShopImages.page} totalPages={paginatedShopImages.totalPages} onPageChange={setShopImagesPage} />
            </div>
          )}
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Products</p>
            <span className="rounded-full bg-[#efe8d8] px-3 py-1 text-xs font-medium text-[#485b3b]">{selectedProducts.length}</span>
          </div>
          {!selectedProducts.length ? <div className="mt-3 rounded-2xl bg-[#f8f4eb] px-4 py-6 text-sm text-[#7a8368]">No products in this shop.</div> : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {paginatedShopProducts.items.map((product) => {
                  const previewImage = productImages.find((image) => String(image.product_id) === String(product.product_id));
                  return (
                    <button key={product.product_id} type="button" onClick={() => setActiveProduct(product)} className="overflow-hidden rounded-[24px] bg-white text-left ring-1 ring-[#e6ddc9] transition hover:ring-[#cbbf9d]">
                      <div className="flex gap-4 p-4">
                        <div className="h-24 w-24 overflow-hidden rounded-2xl bg-[#f8f4eb]">
                          {previewImage?.image_path ? <img src={assetUrl(previewImage.image_path)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-xs text-[#8d9577]">No Image</div>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-semibold text-[#2f3529]">{product.tea_name || `Product #${product.product_id}`}</p>
                            <span className="rounded-full bg-[#f8f4eb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#485b3b]">#{product.product_id}</span>
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
              <AdminPagination currentPage={paginatedShopProducts.page} totalPages={paginatedShopProducts.totalPages} onPageChange={setShopProductsPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductDetailModal({ product, images, form, onFieldChange, onUpdate, onDelete, saving, deleting, onClose }) {
  const [confirmAction, setConfirmAction] = useState(null);
  const [imagesPage, setImagesPage] = useState(1);
  const paginatedImages = useMemo(() => paginate(images, imagesPage), [images, imagesPage]);
  useEffect(() => setImagesPage(1), [images]);
  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4 py-6" onClick={onClose}>
        <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-7 shadow-2xl ring-1 ring-[#e6ddc9]" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Product Detail</p>
              <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{product.tea_name || `Product #${product.product_id}`}</h3>
            </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8d8] text-lg font-medium text-[#485b3b]">X</button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <AdminMetaCard label="Product ID" value={`#${product.product_id}`} />
            <AdminMetaCard label="Shop ID" value={`#${product.shop_id}`} />
            <AdminMetaCard label="Tea Type" value={product.tea_type || "-"} />
            <AdminMetaCard label="Price" value={Number(product.price || 0).toFixed(2)} />
            <AdminMetaCard label="Stock" value={product.stock} />
            <AdminMetaCard label="Sales 7 Days" value={product.sales_7d} />
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
                <button type="button" onClick={() => setConfirmAction({ title: "Delete Product", message: `Delete product #${product.product_id}?`, confirmLabel: "Delete Product", tone: "danger", onConfirm: onDelete })} disabled={deleting} className="rounded-full bg-[#fff0ed] px-4 py-2 text-xs font-medium text-[#b33a24] disabled:cursor-not-allowed disabled:opacity-60">{deleting ? "Deleting..." : "Delete Product"}</button>
                <button type="button" onClick={() => setConfirmAction({ title: "Save Product", message: `Save changes for product #${product.product_id}?`, confirmLabel: "Save Product", tone: "primary", onConfirm: onUpdate })} disabled={saving} className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : "Save Product"}</button>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <AdminField label="Tea Name"><input value={form.tea_name} onChange={(event) => onFieldChange("tea_name", event.target.value)} className="admin-input" /></AdminField>
              <AdminField label="Tea Type"><input value={form.tea_type} onChange={(event) => onFieldChange("tea_type", event.target.value)} className="admin-input" /></AdminField>
              <AdminField label="Price"><input type="number" min="0" value={form.price} onChange={(event) => onFieldChange("price", event.target.value)} className="admin-input" /></AdminField>
              <AdminField label="Stock"><input type="number" min="0" value={form.stock} onChange={(event) => onFieldChange("stock", event.target.value)} className="admin-input" /></AdminField>
            </div>
            <AdminField label="Description" className="mt-4"><textarea value={form.description} onChange={(event) => onFieldChange("description", event.target.value)} className="admin-input min-h-28" /></AdminField>
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Product Images</p>
            {!images.length ? <div className="mt-3 rounded-2xl bg-[#f8f4eb] px-4 py-6 text-sm text-[#7a8368]">No product images yet.</div> : (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {paginatedImages.items.map((image) => (
                    <div key={image.image_id} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-[#e6ddc9]">
                      <img src={assetUrl(image.image_path)} alt="" className="h-48 w-full object-cover" />
                      <div className="px-4 py-3 text-xs text-[#7a8368]">Image #{image.image_id}</div>
                    </div>
                  ))}
                </div>
                <AdminPagination currentPage={paginatedImages.page} totalPages={paginatedImages.totalPages} onPageChange={setImagesPage} />
              </div>
            )}
          </div>
        </div>
      </div>
      {confirmAction ? <AdminConfirmActionModal {...confirmAction} onClose={() => setConfirmAction(null)} onConfirm={async () => { await confirmAction.onConfirm(); setConfirmAction(null); }} /> : null}
    </>
  );
}
