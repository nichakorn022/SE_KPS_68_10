import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../lib/api";
import { useAuthModal } from "../../App";
import SiteNavbar from "../components/SiteNavbar";

const initialForm = {
  first_name: "",
  last_name: "",
  birth_date: "",
  phone: "",
  address: "",
  province: "",
  district: "",
  subdistrict: "",
  national_id: "",
  organization_name: "",
  description: "",
};

const inputClassName =
  "w-full rounded-[1rem] border border-[#DFE6D6] bg-white px-4 py-3 text-sm text-[#253621] outline-none transition focus:border-[#7B9A67] focus:ring-2 focus:ring-[#7B9A67]/20";

function Field({ label, name, required = false, error, children }) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold text-[#253621]">
        {label}
        {required && <span className="ml-1 text-[#B55252]">*</span>}
      </label>
      {children}
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="rounded-[1.5rem] border border-[#DFE6D6] bg-[#FCFCF8] p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[#253621]">{title}</h2>
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

function validateForm(form) {
  const errors = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!String(form.first_name || "").trim()) {
    errors.first_name = "Please enter your first name";
  }

  if (!String(form.last_name || "").trim()) {
    errors.last_name = "Please enter your last name";
  }

  if (!String(form.birth_date || "").trim()) {
    errors.birth_date = "Please select your date of birth";
  } else {
    const birthDate = new Date(form.birth_date);
    birthDate.setHours(0, 0, 0, 0);
    if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
      errors.birth_date = "Birth date must be today or earlier";
    }
  }

  if (!String(form.phone || "").trim()) {
    errors.phone = "Please enter your phone number";
  } else if (!/^0\d{8,9}$/.test(form.phone)) {
    errors.phone = "Phone number should be 9-10 digits and start with 0";
  }

  if (!String(form.address || "").trim()) {
    errors.address = "Please enter your address";
  }

  if (!String(form.province || "").trim()) {
    errors.province = "Please enter your province";
  }

  if (!String(form.district || "").trim()) {
    errors.district = "Please enter your district";
  }

  if (!String(form.subdistrict || "").trim()) {
    errors.subdistrict = "Please enter your subdistrict";
  }

  if (!String(form.national_id || "").trim()) {
    errors.national_id = "Please enter your national ID";
  } else if (!/^\d{13}$/.test(form.national_id)) {
    errors.national_id = "National ID must be exactly 13 digits";
  }

  if (!String(form.organization_name || "").trim()) {
    errors.organization_name = "Please enter your organization name";
  }

  if (!String(form.description || "").trim()) {
    errors.description = "Please describe your organization or event plan";
  } else if (String(form.description || "").trim().length < 20) {
    errors.description = "Please provide at least 20 characters";
  }

  return errors;
}

export default function BecomeOrganizer() {
  const navigate = useNavigate();
  const { token, openLogin } = useAuthModal();

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingOrganizer, setCheckingOrganizer] = useState(true);
  const [organizerInfo, setOrganizerInfo] = useState({ exists: false, verified_status: null });

  const maxBirthDate = new Date().toISOString().slice(0, 10);
  const alreadyRegistered = Boolean(organizerInfo?.exists);

  useEffect(() => {
    if (!token) {
      setCheckingOrganizer(false);
      setOrganizerInfo({ exists: false, verified_status: null });
      return;
    }

    let active = true;

    fetch(apiUrl("/organizers/me"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch organizer info");
        if (!active) return;
        setOrganizerInfo(data);
      })
      .catch((err) => {
        console.error(err);
        if (!active) return;
        setOrganizerInfo({ exists: false, verified_status: null });
      })
      .finally(() => {
        if (active) setCheckingOrganizer(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const sanitizedValue =
      name === "phone"
        ? value.replace(/\D/g, "").slice(0, 10)
        : name === "national_id"
          ? value.replace(/\D/g, "").slice(0, 13)
          : value;

    const nextForm = {
      ...form,
      [name]: sanitizedValue,
    };

    setForm(nextForm);

    if (fieldErrors[name]) {
      const nextErrors = validateForm(nextForm);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: nextErrors[name] || "",
      }));
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    const nextErrors = validateForm(form);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: nextErrors[name] || "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      openLogin?.();
      return;
    }

    if (alreadyRegistered) {
      setSubmitError("You already have an organizer account");
      return;
    }

    const nextErrors = validateForm(form);
    setFieldErrors(nextErrors);
    setSubmitError("");

    if (Object.values(nextErrors).some(Boolean)) {
      setSubmitError("Please complete the required information before submitting");
      return;
    }

    setLoading(true);

    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, String(value || "").trim()])
      );

      const res = await fetch(apiUrl("/organizers/register"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to register organizer");
      }

      setOrganizerInfo({
        exists: true,
        verified_status: Number(data.verified_status ?? 0),
      });
      alert(data.message || "Organizer registration submitted. Please wait for admin approval.");
      navigate("/events");
    } catch (err) {
      setSubmitError(err.message || "Failed to register organizer");
    } finally {
      setLoading(false);
    }
  };

  const organizerStatusLabel =
    organizerInfo?.verified_status === 1
      ? "Approved"
      : organizerInfo?.verified_status === 2
        ? "Rejected"
        : "Pending";
  const showManageMyEventsButton = organizerInfo?.verified_status === 1;

  return (
    <div className="min-h-screen bg-[#F5F3E9]">
      <SiteNavbar active="events" />

      <div className="mx-auto max-w-[900px] px-5 py-12">
        <div className="rounded-[2rem] border border-[#DFE6D6] bg-white p-8 shadow-[0_24px_64px_rgba(72,91,59,0.10)]">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#879A78]">
              Organizer Registration
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#253621]">Become Organizer</h1>
          </div>

          {!token && (
            <div className="mb-6 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Please log in before registering as an organizer.
            </div>
          )}

          {!checkingOrganizer && alreadyRegistered && (
            <div className="mb-6 rounded-[1.25rem] border border-[#D9E4D1] bg-[#F4F8EF] p-4">
              <p className="text-sm font-semibold text-[#253621]">
                Organizer account already exists
              </p>
              <p className="mt-2 text-sm text-[#66755D]">
                Current status: <span className="font-semibold text-[#485B3B]">{organizerStatusLabel}</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {showManageMyEventsButton && (
                  <button
                    type="button"
                    onClick={() => navigate("/my-events")}
                    className="rounded-full bg-[#485B3B] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#394A31]"
                  >
                    Go to My Events
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/events")}
                  className="rounded-full border border-[#DFE6D6] bg-white px-5 py-2 text-sm font-semibold text-[#6F665B] transition hover:bg-[#F5F3E9]"
                >
                  Back to Events
                </button>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-6 rounded-[1.25rem] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <SectionCard
              title="Personal Details"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="First Name"
                  name="first_name"
                  required
                  error={fieldErrors.first_name}
                >
                  <input
                    id="first_name"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your first name"
                    className={inputClassName}
                    disabled={alreadyRegistered}
                  />
                </Field>

                <Field
                  label="Last Name"
                  name="last_name"
                  required
                  error={fieldErrors.last_name}
                >
                  <input
                    id="last_name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your last name"
                    className={inputClassName}
                    disabled={alreadyRegistered}
                  />
                </Field>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Date of Birth"
                  name="birth_date"
                  required
                  error={fieldErrors.birth_date}
                >
                  <input
                    id="birth_date"
                    type="date"
                    name="birth_date"
                    value={form.birth_date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    max={maxBirthDate}
                    className={inputClassName}
                    disabled={alreadyRegistered}
                  />
                </Field>

                <Field
                  label="Phone Number"
                  name="phone"
                  required
                  error={fieldErrors.phone}
                >
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your phone number"
                    className={inputClassName}
                    disabled={alreadyRegistered}
                  />
                </Field>
              </div>

              <Field
                label="National ID"
                name="national_id"
                required
                error={fieldErrors.national_id}
              >
                <input
                  id="national_id"
                  name="national_id"
                  value={form.national_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your 13-digit national ID"
                  className={inputClassName}
                  disabled={alreadyRegistered}
                />
              </Field>
            </SectionCard>

            <SectionCard
              title="Address Details"
            >
              <Field
                label="Address"
                name="address"
                required
                error={fieldErrors.address}
              >
                <textarea
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your full address"
                  rows={4}
                  className={inputClassName}
                  disabled={alreadyRegistered}
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-3">
                <Field
                  label="Province"
                  name="province"
                  required
                  error={fieldErrors.province}
                >
                  <input
                    id="province"
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Province"
                    className={inputClassName}
                    disabled={alreadyRegistered}
                  />
                </Field>

                <Field
                  label="District"
                  name="district"
                  required
                  error={fieldErrors.district}
                >
                  <input
                    id="district"
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="District"
                    className={inputClassName}
                    disabled={alreadyRegistered}
                  />
                </Field>

                <Field
                  label="Subdistrict"
                  name="subdistrict"
                  required
                  error={fieldErrors.subdistrict}
                >
                  <input
                    id="subdistrict"
                    name="subdistrict"
                    value={form.subdistrict}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Subdistrict"
                    className={inputClassName}
                    disabled={alreadyRegistered}
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard
              title="Organization Details"
            >
              <Field
                label="Organization Name"
                name="organization_name"
                required
                error={fieldErrors.organization_name}
              >
                <input
                  id="organization_name"
                  name="organization_name"
                  value={form.organization_name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Enter your organization name"
                  className={inputClassName}
                  disabled={alreadyRegistered}
                />
              </Field>

              <Field
                label="Organization Description"
                name="description"
                required
                error={fieldErrors.description}
              >
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Example: We organize tea tasting workshops, community events, and seasonal markets."
                  rows={5}
                  className={inputClassName}
                  disabled={alreadyRegistered}
                />
              </Field>
            </SectionCard>

            <div className="flex flex-col gap-3 border-t border-[#ECE6D9] pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={loading || alreadyRegistered}
                className="flex-1 rounded-[1rem] bg-[#485B3B] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(72,91,59,0.15)] transition hover:bg-[#394A31] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Organizer Registration"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/events")}
                className="flex-1 rounded-[1rem] border border-[#DFE6D6] bg-white px-5 py-3 text-sm font-semibold text-[#6F665B] transition hover:bg-[#F5F3E9]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
