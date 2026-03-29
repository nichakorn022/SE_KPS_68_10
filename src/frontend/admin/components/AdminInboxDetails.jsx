import { Link } from "react-router-dom";
import { assetUrl } from "../../../lib/api";
import AdminMetaCard from "./AdminMetaCard";
import AdminField from "./AdminField";

function DetailShell({ badge, title, subtitle, children }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">{badge}</p>
        <h3 className="mt-3 text-3xl font-semibold text-[#2f3529]">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-[#5d6550]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function MetaGrid({ rows }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.map((row) => (
        <AdminMetaCard key={row.label} label={row.label} value={row.value} />
      ))}
    </div>
  );
}

function ActionButton({ onClick, tone = "neutral", children }) {
  const className =
    tone === "positive"
      ? "bg-[#eef6ea] text-[#386132]"
      : tone === "danger"
        ? "bg-[#fff0ed] text-[#b33a24]"
        : "bg-[#efe8d8] text-[#485b3b]";

  return (
    <button type="button" onClick={onClick} className={`rounded-full px-5 py-3 text-sm font-medium ${className}`}>
      {children}
    </button>
  );
}

export function ShopDetail({ item, images, onUploadImage, onDeleteImage, onAction, getVerificationStatusLabel }) {
  return (
    <DetailShell
      badge="Shop Approval"
      title={item.shop_name || `Shop #${item.shop_id}`}
      subtitle="Review shop ownership and verify whether this account should be allowed to operate as a tea shop."
    >
      <MetaGrid
        rows={[
          { label: "Shop ID", value: `#${item.shop_id}` },
          { label: "Owner", value: item.email || `User #${item.user_id}` },
          { label: "Phone", value: item.phone || "-" },
          { label: "Contact", value: item.contact_info || "-" },
          { label: "National ID", value: item.national_id || "-" },
          { label: "Status", value: getVerificationStatusLabel(item.verified_status) },
        ]}
      />
      <div className="rounded-[24px] bg-[#fcfbf7] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Description</p>
        <p className="mt-3 text-sm leading-7 text-[#4b5541]">{item.description || "No description provided."}</p>
      </div>
      <div className="space-y-4 rounded-[24px] bg-[#f8f4eb] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Shop Images</p>
            <p className="mt-2 text-sm text-[#4b5541]">Review store images before approval.</p>
          </div>
          <label className="rounded-full bg-[#485b3b] px-4 py-2 text-xs font-medium text-white">
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUploadImage(item.shop_id, file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        {!images.length ? (
          <div className="rounded-2xl bg-white px-4 py-6 text-sm text-[#7a8368]">No shop images yet.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {images.map((image) => (
              <div key={image.image_id} className="overflow-hidden rounded-[24px] bg-white ring-1 ring-[#e6ddc9]">
                <img src={assetUrl(image.image_path)} alt="" className="h-40 w-full object-cover" />
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="text-xs text-[#7a8368]">Image #{image.image_id}</p>
                  <button
                    type="button"
                    onClick={() => onDeleteImage(image.image_id)}
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
      <div className="flex gap-3">
        <ActionButton tone="positive" onClick={() => onAction(item.shop_id, 1)}>Approve Shop</ActionButton>
        <ActionButton tone="danger" onClick={() => onAction(item.shop_id, 2)}>Reject Shop</ActionButton>
      </div>
    </DetailShell>
  );
}

export function OrganizerDetail({ item, onAction, getVerificationStatusLabel }) {
  return (
    <DetailShell
      badge="Organizer Approval"
      title={[item.first_name, item.last_name].filter(Boolean).join(" ") || item.organization_name || `Organizer #${item.organizer_id}`}
      subtitle="Review organizer identity, organization context, and approval status before allowing event management access."
    >
      <MetaGrid
        rows={[
          { label: "Organizer ID", value: `#${item.organizer_id}` },
          { label: "User", value: item.email || `User #${item.user_id}` },
          { label: "Organization", value: item.organization_name || "-" },
          { label: "Phone", value: item.phone || "-" },
          { label: "Status", value: getVerificationStatusLabel(item.verified_status) },
        ]}
      />
      <div className="rounded-[24px] bg-[#fcfbf7] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Description</p>
        <p className="mt-3 text-sm leading-7 text-[#4b5541]">{item.description || "No description provided."}</p>
      </div>
      <div className="flex gap-3">
        <ActionButton tone="positive" onClick={() => onAction(item.organizer_id, 1)}>Approve Organizer</ActionButton>
        <ActionButton tone="danger" onClick={() => onAction(item.organizer_id, 2)}>Reject Organizer</ActionButton>
      </div>
    </DetailShell>
  );
}

export function ReportDetail({
  item,
  onReportStatusChange,
  onEventStatusChange,
  reportStatuses,
  eventStatuses,
}) {
  return (
    <DetailShell
      badge="Event Report"
      title={item.event_title || `Event #${item.event_id}`}
      subtitle="Inspect the report details, update report handling status, and moderate the related event if needed."
    >
      <MetaGrid
        rows={[
          { label: "Report ID", value: `#${item.report_id}` },
          { label: "Event ID", value: `#${item.event_id}` },
          { label: "Reporter", value: item.email || `User #${item.user_id}` },
          { label: "Username", value: item.username || "-" },
          { label: "Type", value: item.report_type || "-" },
          { label: "Created", value: item.created_at ? new Date(item.created_at).toLocaleString() : "-" },
          { label: "Current Event Status", value: item.event_status || "draft" },
        ]}
      />
      <div className="rounded-[24px] bg-[#f8f4eb] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Event Moderation</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AdminMetaCard
            tone="plain"
            label="Suggested Action"
            value={String(item.status || "").toLowerCase() === "pending" ? "Review and update the event status if needed." : "Report is already being handled."}
          />
          <AdminMetaCard tone="plain" label="Report Status" value={item.status || "pending"} />
          <AdminMetaCard tone="plain" label="Event Status" value={item.event_status || "draft"} />
        </div>
      </div>
      <div className="rounded-[24px] bg-[#fcfbf7] p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-[#8d9577]">Report Detail</p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4b5541]">{item.report_detail}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <AdminField label="Report Status">
          <select
            value={item.status}
            onChange={(event) => onReportStatusChange(item.report_id, event.target.value)}
            className="admin-input"
          >
            {reportStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </AdminField>

        <AdminField label="Event Status">
          <select
            value={item.event_status || "draft"}
            onChange={(event) => onEventStatusChange(item.event_id, event.target.value)}
            className="admin-input"
          >
            {eventStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </AdminField>
      </div>
      <Link to="/admin/events" className="inline-flex rounded-full bg-[#efe8d8] px-5 py-3 text-sm font-medium text-[#485b3b]">
        Open Event Management
      </Link>
    </DetailShell>
  );
}

export function SponsorDetail({ item, note, onNoteChange, onStatusChange }) {
  return (
    <DetailShell
      badge="Sponsor Request"
      title={item.event_title || `Event #${item.event_id}`}
      subtitle="Review sponsor requests from shops and update the request status after verification."
    >
      <MetaGrid
        rows={[
          { label: "Sponsor ID", value: `#${item.sponsor_id}` },
          { label: "Shop", value: item.shop_name || `Shop #${item.shop_id}` },
          { label: "Product", value: item.product_name || `Product #${item.product_id}` },
          { label: "Quantity", value: item.quantity || "-" },
          { label: "Requested By", value: item.request_by || "-" },
          { label: "Status", value: item.status || "pending" },
        ]}
      />
      <NoteField value={note} onChange={onNoteChange} placeholder="Add sponsor review note or rejection reason..." />
      <div className="grid gap-4 md:grid-cols-3">
        <ActionButton tone="positive" onClick={() => onStatusChange(item.sponsor_id, "approved")}>
          Approve Sponsor
        </ActionButton>
        <ActionButton onClick={() => onStatusChange(item.sponsor_id, "pending")}>
          Keep Pending
        </ActionButton>
        <ActionButton tone="danger" onClick={() => onStatusChange(item.sponsor_id, "rejected")}>
          Reject Sponsor
        </ActionButton>
      </div>
    </DetailShell>
  );
}
