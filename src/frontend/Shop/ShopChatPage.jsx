import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiUrl, assetUrl } from "../../lib/api";
import { getAuthHeaders, getStoredToken } from "./authClient";

const api = {
  getShop: (id) =>
    fetch(apiUrl(`/shops/${id}`)).then((response) => {
      if (!response.ok) throw new Error(`Shop ${id} ${response.status}`);
      return response.json();
    }),
  getShopImages: (shopId) =>
    fetch(apiUrl(`/shop-images/shop/${shopId}`)).then((response) => {
      if (!response.ok) throw new Error(`Shop images ${shopId} ${response.status}`);
      return response.json();
    }),
  getChatRoom: (shopId) =>
    fetch(apiUrl(`/chat/shops/${shopId}`), {
      headers: getAuthHeaders(),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || data?.message || `Chat ${response.status}`);
      return data;
    }),
  sendChatMessage: (shopId, payload) =>
    fetch(apiUrl(`/chat/shops/${shopId}/messages`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || data?.message || `Chat send ${response.status}`);
      return data;
    }),
};

function toAssetUrl(path) {
  return path ? assetUrl(path) : null;
}

function formatPrice(price) {
  return `฿${Number(price ?? 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMessageTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function looksCorruptedText(text) {
  if (!text) return false;
  const questionMarks = (text.match(/\?/g) || []).length;
  return questionMarks >= Math.max(4, Math.floor(text.length / 4));
}

function repairMessageText(item, shopName, location) {
  if (!looksCorruptedText(item.text)) return item.text;

  if (item.kind === "product") return item.text;

  if (item.role === "shop") {
    if (item.text?.includes(shopName)) {
      return `สวัสดีค่ะ ร้าน ${shopName} ยินดีให้ข้อมูลสินค้าและการจัดส่ง หากต้องการสอบถามผงชารายการไหนส่งข้อความมาได้เลย`;
    }

    if (location) {
      return `ตอนนี้ร้านจัดส่งได้ที่ ${location}`;
    }

    return `ร้าน ${shopName} ได้รับข้อความแล้ว เดี๋ยวแอดมินตอบกลับในห้องแชทนี้นะคะ`;
  }

  return item.text;
}

function normalizeIncomingMessage(item, shopName = "", location = "") {
  return {
    ...item,
    text: repairMessageText(item, shopName, location),
    time: formatMessageTime(item.time || item.created_at),
    product: item.product
      ? {
          ...item.product,
          img: item.product.img ? assetUrl(item.product.img) : null,
        }
      : null,
  };
}

function MessageBubble({ item }) {
  const isShop = item.role === "shop";

  return (
    <div className={`flex ${isShop ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[78%] rounded-[24px] px-5 py-4 shadow-sm ${
          isShop ? "bg-white text-[#334033]" : "bg-[#E8F0DF] text-[#2B3A2A]"
        }`}
      >
        {item.kind === "product" && item.product ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-[#F3EFE6]">
                {item.product.img ? (
                  <img src={item.product.img} alt={item.product.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-1 text-[1.05rem] font-semibold">{item.product.name}</p>
                <p className="text-sm text-[#7A8478]">{item.product.tag || "Tea powder"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-[#6B8A5B]">{formatPrice(item.product.price)}</p>
              <Link
                to={`/product/${item.product.id}`}
                className="rounded-full border border-[#D8E1CE] px-3 py-1.5 text-xs font-semibold text-[#567048]"
              >
                ดูสินค้า
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-[0.98rem] leading-7">{item.text}</p>
        )}
        <p className="mt-2 text-[11px] text-[#97A08F]">{item.time}</p>
      </div>
    </div>
  );
}

function QuickAction({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[#DBE3D2] bg-white px-4 py-2 text-sm font-medium text-[#5D7550] transition-all hover:-translate-y-0.5 hover:border-[#7B9A67]"
    >
      {label}
    </button>
  );
}

export default function ShopChatPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shop, setShop] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  useEffect(() => {
    let ignore = false;

    if (!getStoredToken()) {
      setError("กรุณาเข้าสู่ระบบก่อนใช้งานแชท");
      setLoading(false);
      return () => {
        ignore = true;
      };
    }

    Promise.all([api.getShop(id), api.getShopImages(id).catch(() => []), api.getChatRoom(id)])
      .then(([shopRow, shopImageRows, chatRoom]) => {
        if (ignore) return;

        const avatar =
          toAssetUrl(shopImageRows?.[1]?.image_path) ||
          toAssetUrl(shopImageRows?.[0]?.image_path) ||
          null;

        setShop({
          id: shopRow.shop_id,
          name: shopRow.shop_name,
          location: [shopRow.subdistrict, shopRow.district, shopRow.province].filter(Boolean).join(", "),
          avatar,
          phone: shopRow.phone || "-",
        });
        const location = [shopRow.subdistrict, shopRow.district, shopRow.province].filter(Boolean).join(", ");
        const normalizedMessages = (chatRoom.messages || []).map((item) =>
          normalizeIncomingMessage(item, shopRow.shop_name, location)
        );
        const hasUserMessage = normalizedMessages.some((item) => item.role === "user");
        setMessages(hasUserMessage ? normalizedMessages : []);
      })
      .catch((fetchError) => {
        if (!ignore) setError(fetchError.message || "โหลดห้องแชทไม่สำเร็จ");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = (text) => {
    const trimmed = text.trim();
    if (!trimmed || !shop) return;

    setDraft("");

    api
      .sendChatMessage(shop.id, { message_text: trimmed })
      .then((result) => {
        setMessages((current) => [
          ...current,
          ...(result.messages || []).map((item) => normalizeIncomingMessage(item, shop.name, shop.location)),
        ]);
        setError("");
      })
      .catch((sendError) => {
        setError(sendError.message || "ส่งข้อความไม่สำเร็จ");
      });
  };

  const addQuickMessage = (label) => {
    const presets = {
      "สอบถามสินค้า": "อยากสอบถามรายละเอียดสินค้าในร้านค่ะ",
      "เวลาจัดส่ง": "ร้านจัดส่งภายในกี่วันคะ",
      โปรโมชั่น: "ตอนนี้ร้านมีโปรโมชั่นอะไรบ้างคะ",
    };

    sendMessage(presets[label] || label);
  };

  if (loading) {
    return (
      <div className="grid h-screen grid-rows-[88px_minmax(0,1fr)] overflow-hidden bg-[#F8F6EF]">
        <div className="animate-pulse bg-[#E9F0E1]" />
        <div className="animate-pulse bg-[#F8F6EF]" />
      </div>
    );
  }

  if (error && !shop) {
    return (
      <div className="grid h-screen place-items-center bg-[#F8F6EF] px-6 text-center">
        <div>
          <h1 className="text-3xl font-semibold text-[#24321F]">ไม่สามารถเปิดแชทได้</h1>
          <p className="mt-3 text-[#6D7568]">{error || "ไม่พบข้อมูลร้าน"}</p>
          <Link to={`/shop/${id}`} className="mt-6 inline-flex rounded-full bg-[#7B9A67] px-6 py-3 text-white">
            กลับหน้าร้าน
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-[#F8F6EF] text-[#24321F]">
      <div className="flex h-full w-full flex-col overflow-hidden">
        <header className="flex h-[88px] shrink-0 items-center gap-4 bg-[#E9F0E1] px-6">
          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-sm">
            {shop?.avatar ? <img src={shop.avatar} alt={shop.name} className="h-full w-full object-cover" /> : null}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-serif text-[2rem] tracking-[-0.03em] text-[#24321F]">{shop?.name}</h1>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#6B8A5B]">Online</span>
            </div>
            <p className="mt-1 text-[0.98rem] text-[#66735F]">{shop?.location || "ร้านค้าใน ATC marketplace"}</p>
          </div>
          <Link
            to={`/shop/${id}`}
            className="ml-auto rounded-full border border-[#CFDAC2] bg-white px-4 py-2 text-sm font-semibold text-[#5F7752]"
          >
            กลับหน้าร้าน
          </Link>
        </header>

        <div className="grid h-full min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative h-full min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top,#f7f4ec_0%,#f4f0e7_40%,#f7f4ec_100%)]">
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <div ref={messagesContainerRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-6 pb-40">
                <div className="space-y-4">
                  {messages.map((item) => (
                    <MessageBubble key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 px-6 py-4">
              <div className="pointer-events-none mb-3 flex flex-wrap gap-2 px-1">
                <div className="pointer-events-auto">
                  <QuickAction label="สอบถามสินค้า" onClick={() => addQuickMessage("สอบถามสินค้า")} />
                </div>
                <div className="pointer-events-auto">
                  <QuickAction label="เวลาจัดส่ง" onClick={() => addQuickMessage("เวลาจัดส่ง")} />
                </div>
                <div className="pointer-events-auto">
                  <QuickAction label="โปรโมชั่น" onClick={() => addQuickMessage("โปรโมชั่น")} />
                </div>
              </div>
              <div className="rounded-[26px] border border-[#DDE5D5] bg-[#FBFCF9] px-4 py-4 shadow-[0_8px_24px_rgba(123,154,103,0.08)]">
                <div className="flex items-center gap-3">
                  <button type="button" className="text-[#6D7B66]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") sendMessage(draft);
                    }}
                    placeholder="พิมพ์ข้อความถึงร้าน..."
                    className="w-full bg-transparent text-[0.98rem] text-[#314131] outline-none placeholder:text-[#98A191]"
                  />
                  <button
                    type="button"
                    onClick={() => sendMessage(draft)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#7B9A67] px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                      <path d="M22 2 11 13" />
                      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
                    </svg>
                    ส่ง
                  </button>
                </div>
                {error ? <p className="mt-3 text-sm text-[#A25945]">{error}</p> : null}
              </div>
            </div>
          </div>

          <aside className="hidden h-full min-h-0 overflow-y-auto bg-white/70 p-6 lg:block">
            <div className="rounded-[28px] bg-[#F6FAF2] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8B9783]">Store Contact</p>
              <h2 className="mt-3 font-serif text-[1.7rem] tracking-[-0.03em] text-[#24321F]">{shop?.name}</h2>
              <p className="mt-2 text-sm leading-7 text-[#657260]">
                ใช้ห้องนี้สำหรับสอบถามสินค้า เวลาจัดส่ง รายละเอียดการสั่งซื้อ และข้อมูลจากร้านโดยตรง
              </p>
            </div>

            <div className="mt-5 space-y-4 text-[0.98rem] text-[#5B6957]">
              <div className="rounded-[22px] bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-[#93A08D]">Phone</p>
                <p className="mt-2 font-medium text-[#24321F]">{shop?.phone}</p>
              </div>
              <div className="rounded-[22px] bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-[#93A08D]">Tips</p>
                <ul className="mt-2 space-y-2 leading-7">
                  <li>ระบุชื่อสินค้าที่ต้องการสอบถาม</li>
                  <li>ถามเรื่องสต็อกและเวลาจัดส่งได้ทันที</li>
                  <li>ร้านจะตอบกลับในห้องแชทนี้</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
