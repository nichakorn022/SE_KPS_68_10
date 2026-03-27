import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";

const quickLinks = [
  {
    title: "Inbox",
    description: "Review approvals and reports in one email-style moderation queue.",
  },
  {
    title: "Products",
    description: "Prepare product CRUD, image upload, and stock updates here.",
  },
  {
    title: "Events",
    description: "Manage event listings, schedules, and registration settings.",
  },
  {
    title: "Orders",
    description: "Track payment states, fulfillment, and customer issues.",
  },
];

export default function AdminDashboard() {
  const { adminUser, adminToken } = useOutletContext();
  const [stats, setStats] = useState([
    { label: "Pending Shops", value: "-", href: "/admin/inbox" },
    { label: "Pending Organizers", value: "-", href: "/admin/inbox" },
    { label: "Pending Reports", value: "-", href: "/admin/inbox" },
    { label: "Products", value: "-", href: "/admin/products" },
    { label: "Events", value: "-", href: "/admin/events" },
    { label: "Orders", value: "-", href: "/admin/orders" },
  ]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const [products, events, orders, shops, organizers, reports] = await Promise.all([
          adminApi.getProducts(adminToken),
          adminApi.getEvents(adminToken),
          adminApi.getOrders(adminToken),
          adminApi.getShops(adminToken),
          adminApi.getOrganizers(adminToken),
          adminApi.getReports(adminToken),
        ]);

        if (!cancelled) {
          setStats([
            { label: "Pending Shops", value: shops.filter((shop) => !Number(shop.verified_status)).length, href: "/admin/inbox" },
            { label: "Pending Organizers", value: organizers.filter((organizer) => !Number(organizer.verified_status)).length, href: "/admin/inbox" },
            { label: "Pending Reports", value: reports.filter((report) => String(report.status).toLowerCase() === "pending").length, href: "/admin/inbox" },
            { label: "Products", value: products.length, href: "/admin/products" },
            { label: "Events", value: events.length, href: "/admin/events" },
            { label: "Orders", value: orders.length, href: "/admin/orders" },
          ]);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [adminToken]);

  return (
    <section className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[32px] bg-[#485b3b] p-8 text-white shadow-lg">
          <p className="text-sm uppercase tracking-[0.35em] text-white/70">Overview</p>
          <h3 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">
            Admin access is ready for approvals, moderation, and operations.
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
            Logged in as {adminUser?.email || "admin"}. Use this area to approve shops and organizers,
            review reports, and manage products, events, and orders.
          </p>
          {error && <p className="mt-4 text-sm text-[#f8d5cd]">Stats unavailable: {error}</p>}
        </div>

        <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[#e6ddc9]">
          <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">System Summary</p>
          <div className="mt-6 space-y-4">
            {stats.map((item) => (
              <Link key={item.label} to={item.href} className="block rounded-2xl bg-[#f8f4eb] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#8d9577]">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-[#2f3529]">{item.value}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {quickLinks.map((item) => (
          <article key={item.title} className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-[#e6ddc9]">
            <p className="text-sm uppercase tracking-[0.3em] text-[#8d9577]">{item.title}</p>
            <p className="mt-4 text-sm leading-7 text-[#4b5541]">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
