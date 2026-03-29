import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import { getAuthHeaders, getStoredToken } from "./authClient";

function formatAddressLines(address) {
  const primaryLine = [address.address_line, address.subdistrict, address.district].filter(Boolean).join(" ");
  const secondaryLine = [address.subdistrict, address.district, address.province, address.postal_code]
    .filter(Boolean)
    .join(", ");

  return [primaryLine, secondaryLine].filter(Boolean);
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-6 text-[#c9c5bd]">
        <svg viewBox="0 0 120 120" className="h-36 w-36" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M60 20c-12 0-22 9.7-22 21.8 0 16.9 18.8 38.1 22 42 3.2-3.9 22-25.1 22-42C82 29.7 72 20 60 20Z" />
          <circle cx="60" cy="42" r="8" />
          <path d="M27 84h66" strokeLinecap="round" />
          <path d="M36 96h48" strokeLinecap="round" />
          <path d="M44 72 40 102" strokeLinecap="round" />
          <path d="M76 72 80 102" strokeLinecap="round" />
          <circle cx="26" cy="62" r="3" opacity=".45" />
          <circle cx="92" cy="72" r="4" opacity=".4" />
          <path d="M92 44v10" strokeLinecap="round" opacity=".4" />
          <path d="M87 49h10" strokeLinecap="round" opacity=".4" />
        </svg>
      </div>
      <p className="text-[1.35rem] font-semibold text-[#3c4138] sm:text-[1.6rem]">{message}</p>
    </div>
  );
}

function AddressRow({ address, selected, onSelect }) {
  const lines = formatAddressLines(address);

  return (
    <button
      type="button"
      onClick={() => onSelect(address.address_id)}
      className="w-full border-b border-[#f0ebe2] px-4 py-5 text-left transition-colors duration-300 hover:bg-[#fcfbf7] sm:px-6"
    >
      <div className="flex items-start gap-4">
        <div
          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? "border-[#EA6B4E]" : "border-[#a9a29a]"
          }`}
        >
          <div className={`h-4 w-4 rounded-full ${selected ? "bg-[#EA6B4E]" : "bg-transparent"}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-[1.05rem] font-semibold text-[#1e1915]">{address.recipient_name}</p>
                <span className="text-[#cbc1b5]">|</span>
                <p className="text-[1rem] text-[#8a8277]">{address.phone}</p>
              </div>

              <div className="mt-3 space-y-1 text-[15px] leading-8 text-[#5b564e]">
                {lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {address.is_default ? (
                  <span className="rounded-md border border-[#EA6B4E] px-3 py-1 text-sm font-medium text-[#EA6B4E]">
                    Default
                  </span>
                ) : null}
                <span className="rounded-md border border-[#c9c1b4] px-3 py-1 text-sm font-medium text-[#8f867b]">
                  Shipping address
                </span>
              </div>
            </div>

            <span className="shrink-0 pt-1 text-base text-[#8f867b]">Edit</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function CheckoutAddressPage() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAddresses([]);
      setError("");
      setLoading(false);
      return;
    }

    fetch(apiUrl("/user-addresses"), { headers: getAuthHeaders() })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || data.message || "Failed to load addresses");
        }
        return response.json();
      })
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        setAddresses(list);
        const selected = list.find((item) => item.is_default) || list[0] || null;
        setSelectedAddressId(selected?.address_id ?? null);
        setError("");
      })
      .catch((fetchError) => {
        setAddresses([]);
        setError(fetchError.message || "Failed to load addresses");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUseAddress = async () => {
    if (!selectedAddressId) return;

    try {
      setSaving(true);
      const response = await fetch(apiUrl(`/user-addresses/${selectedAddressId}/default`), {
        method: "PATCH",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to save address");
      }

      navigate("/checkout");
    } catch (saveError) {
      setError(saveError.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const isEmpty = !loading && addresses.length === 0;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8F6EF_0%,#F4F7F0_35%,#F7F3E9_100%)] pb-32 text-[#24321F]">
      <header className="sticky top-0 z-30 border-b border-[#efe7db] bg-[rgba(251,247,241,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-[#577049] shadow-[0_8px_24px_rgba(123,154,103,0.14)]"
          >
            ←
          </button>
          <div className="text-center">
            <p className="text-[1.7rem] font-semibold sm:text-[2.2rem]">{isEmpty ? "My addresses" : "Select address"}</p>
          </div>
          <Link
            to="/checkout"
            className="hidden rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-medium text-[#7a7064] sm:inline-flex"
          >
            Back to checkout
          </Link>
        </div>
      </header>

      <main className="px-0 pt-4 sm:px-6 sm:pt-8">
        <div className="mx-auto max-w-[1220px]">
          {isEmpty ? (
            <div className="min-h-[560px] rounded-none bg-[#f4f4f2] sm:rounded-[28px]">
              <EmptyState message={error || "You haven't added an address yet"} />
            </div>
          ) : (
            <div className="overflow-hidden border-y border-[#ece5da] bg-white shadow-[0_18px_55px_rgba(195,170,128,0.10)] sm:rounded-[28px] sm:border">
              <div className="bg-[#f3f2ef] px-4 py-4 text-[15px] font-medium text-[#9b958c] sm:px-6">Addresses</div>

              {loading ? <div className="px-6 py-10 text-sm text-[#8b8176]">Loading addresses...</div> : null}
              {!loading && error && addresses.length > 0 ? (
                <div className="px-6 py-10 text-sm text-[#577049]">{error}</div>
              ) : null}
              {!loading && !error && addresses.length > 0 ? (
                <div>
                  {addresses.map((address) => (
                    <AddressRow
                      key={address.address_id}
                      address={address}
                      selected={selectedAddressId === address.address_id}
                      onSelect={setSelectedAddressId}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 bg-[rgba(248,246,239,0.96)] px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-[1220px] gap-3">
          <button
            type="button"
            onClick={() => navigate("/checkout/address/new")}
            className="flex-1 rounded-[22px] border-2 border-[#7B9A67] bg-white px-6 py-4 text-[1.05rem] font-semibold text-[#577049]"
          >
            + Add new address
          </button>
          {!isEmpty ? (
            <button
              type="button"
              onClick={handleUseAddress}
              disabled={saving || !selectedAddressId}
              className="rounded-[22px] bg-[#B7C7A3] px-8 py-4 text-[1.05rem] font-semibold text-white shadow-[0_18px_36px_rgba(123,154,103,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Use this address"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

