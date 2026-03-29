import { Link } from "react-router-dom";

function formatPrice(value) {
  return `฿${Number(value ?? 0).toLocaleString("th-TH")}`;
}

export default function ShopCartDrawer({ cart, onClose, onUpdateQty, onCheckout }) {
  const total = cart.reduce((sum, item) => sum + Number(item.price ?? 0) * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close cart overlay"
        onClick={onClose}
        className="flex-1 bg-[#1A2118]/35 backdrop-blur-[2px]"
      />

      <aside className="flex h-full w-full max-w-md flex-col border-l border-[#DCE4D1] bg-[#F6F8F0] shadow-[0_28px_80px_rgba(22,33,21,0.22)]">
        <div className="border-b border-[#D9E2CF] bg-white/78 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#8BA07A]">Cart drawer</p>
              <h2 className="mt-1 text-[24px] font-semibold text-[#24321F]">ตะกร้าสินค้า</h2>
              <p className="mt-1 text-sm text-[#6A785F]">{itemCount} รายการที่พร้อมไปต่อยังขั้นตอนชำระเงิน</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#D7E0CD] bg-white p-2 text-[#48603C] transition-all duration-300 hover:bg-[#EDF2E5]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path strokeLinecap="round" d="M6 6 18 18M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {cart.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#D3DDC8] bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E3ECD7] text-3xl text-[#516548]">
                🛒
              </div>
              <h3 className="mt-5 text-[22px] font-semibold text-[#2A3826]">ตะกร้ายังว่าง</h3>
              <p className="mt-3 text-sm leading-7 text-[#6A785F]">
                ลองเริ่มจากเมนูที่สะดุดตาหรือกดหมวดที่สนใจ แล้วระบบจะเก็บไว้ให้ตรงนี้ทันที
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const stockLimit = Math.max(0, Number(item.stock ?? 0));
              const atLimit = stockLimit > 0 && item.qty >= stockLimit;

              return (
                <div
                  key={item.id}
                  className="rounded-[1.75rem] border border-[#E3EADF] bg-white px-4 py-4 shadow-[0_14px_32px_rgba(72,91,59,0.08)]"
                >
                  <div className="flex gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-[1.25rem] bg-[#EDF2E5]">
                      {item.img ? (
                        <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl text-[#54684B]">☕</div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="truncate text-[15px] font-semibold text-[#23311F]">{item.name}</p>
                          <p className="mt-1 text-xs text-[#86957A]">{item.tag || "Tea selection"}</p>
                        </div>
                        <p className="text-sm font-semibold text-[#405336]">{formatPrice(item.price)}</p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#F4F7EE] px-2 py-1">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, item.qty - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#526449] shadow-sm transition-colors duration-300 hover:bg-[#E8EEE0]"
                          >
                            -
                          </button>
                          <span className="min-w-6 text-center text-sm font-semibold text-[#2C3C28]">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.id, item.qty + 1)}
                            disabled={atLimit}
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 ${
                              atLimit ? "cursor-not-allowed bg-[#DCE3D3] text-[#8C9982]" : "bg-[#AFC19A] text-white hover:bg-[#9AB383]"
                            }`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.id, 0)}
                          className="text-sm font-medium text-[#8A675A] transition-colors duration-300 hover:text-[#6A4A3C]"
                        >
                          ลบออก
                        </button>
                      </div>

                      {atLimit ? (
                        <p className="mt-2 text-xs font-medium text-[#B26B44]">มีสินค้านี้ในตะกร้าครบจำนวนที่มีแล้ว</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-[#D9E2CF] bg-white/86 px-6 py-5">
          <div className="mb-4 flex items-center justify-between text-sm text-[#6C7B61]">
            <span>รวมรายการ</span>
            <span>{itemCount} ชิ้น</span>
          </div>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-sm text-[#7A8A6F]">ยอดรวมโดยประมาณ</p>
              <p className="text-[28px] font-semibold text-[#23311F]">{formatPrice(total)}</p>
            </div>
            <p className="max-w-[10rem] text-right text-xs leading-5 text-[#7A8A6F]">ยังไม่รวมค่าจัดส่งหรือค่าธรรมเนียมที่อาจเกิดขึ้น</p>
          </div>

          {onCheckout ? (
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={onCheckout}
              className={`w-full rounded-full py-3 text-sm font-semibold transition-all duration-300 ${
                cart.length === 0
                  ? "cursor-not-allowed bg-[#E6E9E0] text-[#93A08C]"
                  : "bg-[#485B3B] text-white shadow-[0_16px_36px_rgba(72,91,59,0.22)] hover:bg-[#394A31]"
              }`}
            >
              ไปหน้าชำระเงิน
            </button>
          ) : (
            <Link
              to="/checkout"
              onClick={onClose}
              className={`block w-full rounded-full py-3 text-center text-sm font-semibold transition-all duration-300 ${
                cart.length === 0
                  ? "pointer-events-none bg-[#E6E9E0] text-[#93A08C]"
                  : "bg-[#485B3B] text-white shadow-[0_16px_36px_rgba(72,91,59,0.22)] hover:bg-[#394A31]"
              }`}
            >
              ไปหน้าชำระเงิน
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
