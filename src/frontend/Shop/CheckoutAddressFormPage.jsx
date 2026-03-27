import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import { getAuthHeaders, getStoredToken } from "./authClient";

const INITIAL_FORM = {
  recipient_name: "",
  phone: "",
  address_line: "",
  subdistrict: "",
  district: "",
  province: "",
  postal_code: "",
  note: "",
  is_default: true,
};

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#5f584d]">
        {label} {required ? <span className="text-[#7B9A67]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-[18px] border border-[#D8E1CE] bg-[#FCFDF9] px-4 py-3.5 text-[15px] text-[#24321F] outline-none placeholder:text-[#9AA791] focus:border-[#7A9466] focus:shadow-[0_0_0_4px_rgba(122,148,102,0.10)]";

async function getErrorMessage(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
  }
  return data.error || data.message || fallbackMessage;
}

export default function CheckoutAddressFormPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!getStoredToken()) {
      setError("กรุณาเข้าสู่ระบบก่อนเพิ่มที่อยู่");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(apiUrl("/user-addresses"), {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "บันทึกที่อยู่ไม่สำเร็จ"));
      }

      navigate("/checkout/address");
    } catch (submitError) {
      setError(submitError.message || "บันทึกที่อยู่ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8F6EF_0%,#F4F7F0_35%,#F7F3E9_100%)] pb-12 text-[#24321F]">
      <header className="sticky top-0 z-30 border-b border-[#efe7db] bg-[rgba(251,247,241,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/checkout/address")}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-[#577049] shadow-[0_8px_24px_rgba(123,154,103,0.14)]"
          >
            ←
          </button>
          <div className="text-center">
            <p className="text-[1.7rem] font-semibold sm:text-[2.2rem]">เพิ่มที่อยู่ใหม่</p>
            <p className="mt-1 text-sm text-[#8f8478]">กรอกข้อมูลสำหรับการจัดส่งสินค้า</p>
          </div>
          <Link
            to="/checkout/address"
            className="hidden rounded-full border border-[#eadfce] bg-white px-4 py-2 text-sm font-medium text-[#7a7064] sm:inline-flex"
          >
            กลับไปเลือกที่อยู่
          </Link>
        </div>
      </header>

      <main className="px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[960px] rounded-[30px] border border-[#ece5da] bg-white p-6 shadow-[0_18px_55px_rgba(195,170,128,0.10)] sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label="ชื่อผู้รับ" required>
              <input
                value={form.recipient_name}
                onChange={(event) => updateField("recipient_name", event.target.value)}
                className={inputClassName}
                placeholder="ชื่อผู้รับสินค้า"
              />
            </Field>

            <Field label="เบอร์โทร" required>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className={inputClassName}
                placeholder="08x-xxx-xxxx"
              />
            </Field>

            <Field label="ที่อยู่" required>
              <input
                value={form.address_line}
                onChange={(event) => updateField("address_line", event.target.value)}
                className={inputClassName}
                placeholder="บ้านเลขที่ หมู่ ซอย ถนน"
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="ตำบล / แขวง">
                <input
                  value={form.subdistrict}
                  onChange={(event) => updateField("subdistrict", event.target.value)}
                  className={inputClassName}
                  placeholder="ตำบล / แขวง"
                />
              </Field>
              <Field label="อำเภอ / เขต">
                <input
                  value={form.district}
                  onChange={(event) => updateField("district", event.target.value)}
                  className={inputClassName}
                  placeholder="อำเภอ / เขต"
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_220px]">
              <Field label="จังหวัด">
                <input
                  value={form.province}
                  onChange={(event) => updateField("province", event.target.value)}
                  className={inputClassName}
                  placeholder="จังหวัด"
                />
              </Field>
              <Field label="รหัสไปรษณีย์">
                <input
                  value={form.postal_code}
                  onChange={(event) => updateField("postal_code", event.target.value)}
                  className={inputClassName}
                  placeholder="10110"
                />
              </Field>
            </div>

            <Field label="หมายเหตุถึงร้านค้า">
              <textarea
                value={form.note}
                onChange={(event) => updateField("note", event.target.value)}
                className={`${inputClassName} min-h-[140px] resize-none`}
                placeholder="เช่น โทรก่อนจัดส่ง หรือจุดสังเกตเพิ่มเติม"
              />
            </Field>

            <label className="flex items-center gap-3 rounded-[18px] bg-[#F8FBF4] px-4 py-3 text-sm font-medium text-[#577049]">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(event) => updateField("is_default", event.target.checked)}
                className="h-4 w-4 rounded border-[#b7c6a8] text-[#7B9A67] focus:ring-[#7B9A67]"
              />
              ตั้งเป็นที่อยู่เริ่มต้น
            </label>

            {error ? <p className="text-sm font-medium text-[#577049]">{error}</p> : null}

            <div className="flex justify-end gap-3 pt-2">
              <Link
                to="/checkout/address"
                className="rounded-[18px] border border-[#d8cebf] bg-white px-5 py-3 text-sm font-semibold text-[#72685c]"
              >
                ยกเลิก
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-[18px] bg-[#7B9A67] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(123,154,103,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึกที่อยู่"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
