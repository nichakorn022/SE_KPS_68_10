import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";

const quickLinks = [
  {
    title: "Requests & Reports",
    description: "Review requests and reports that need moderation in one queue.",
    href: "/admin/requests-reports",
  },
  {
    title: "Products",
    description: "Prepare product CRUD, image upload, and stock updates here.",
    href: "/admin/products",
  },
  {
    title: "Events",
    description: "Manage event listings, schedules, and registration settings.",
    href: "/admin/events",
  },
  {
    title: "Orders",
    description: "Track payment states, fulfillment, and customer issues.",
    href: "/admin/orders",
  },
];

export default function AdminDashboard() {
  const { adminUser, adminToken } = useOutletContext();
  const [stats, setStats] = useState([
    { label: "Pending Shops", value: "-", href: "/admin/requests-reports?type=shop&status=pending" },
    { label: "Pending Organizers", value: "-", href: "/admin/requests-reports?type=organizer&status=pending" },
    { label: "Pending Reports", value: "-", href: "/admin/requests-reports?type=report&status=pending" },
    { label: "Pending Sponsors", value: "-", href: "/admin/requests-reports?type=sponsor&status=pending" },
    { label: "Products", value: "-", href: "/admin/products" },
    { label: "Events", value: "-", href: "/admin/events" },
    { label: "Orders", value: "-", href: "/admin/orders" },
  ]);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState({
    newRequests: "-",
    pendingRequests: "-",
    pendingReports: "-",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const [products, events, orders, shops, organizers, reports, sponsors] = await Promise.all([
          adminApi.getProducts(adminToken),
          adminApi.getEvents(adminToken),
          adminApi.getOrders(adminToken),
          adminApi.getShops(adminToken),
          adminApi.getOrganizers(adminToken),
          adminApi.getReports(adminToken),
          adminApi.getSponsors(adminToken),
        ]);

        if (!cancelled) {
          const pendingShops = shops.filter((shop) => !Number(shop.verified_status)).length;
          const pendingOrganizers = organizers.filter((organizer) => !Number(organizer.verified_status)).length;
          const pendingReports = reports.filter((report) => String(report.status).toLowerCase() === "pending").length;
          const pendingSponsors = sponsors.filter((sponsor) => String(sponsor.status).toLowerCase() === "pending").length;
          const newRequests = [
            ...shops,
            ...organizers,
            ...reports,
            ...sponsors,
          ].filter((item) => {
            const createdAt = item.created_at ? new Date(item.created_at).getTime() : 0;
            return createdAt >= Date.now() - (24 * 60 * 60 * 1000);
          }).length;
          const pendingRequests = pendingShops + pendingOrganizers + pendingReports + pendingSponsors;

          setOverview({
            newRequests,
            pendingRequests,
            pendingReports,
          });

          setStats([
            { label: "Pending Shops", value: pendingShops, href: "/admin/requests-reports?type=shop&status=pending" },
            { label: "Pending Organizers", value: pendingOrganizers, href: "/admin/requests-reports?type=organizer&status=pending" },
            { label: "Pending Reports", value: pendingReports, href: "/admin/requests-reports?type=report&status=pending" },
            { label: "Pending Sponsors", value: pendingSponsors, href: "/admin/requests-reports?type=sponsor&status=pending" },
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
            Requests that need attention are tracked here first.
          </h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link to="/admin/requests-reports?status=pending" className="rounded-[24px] bg-white/10 px-5 py-5 transition hover:bg-white/15">
              <p className="text-xs uppercase tracking-[0.25em] text-white/65">New Requests</p>
              <p className="mt-3 text-4xl font-semibold text-white">{overview.newRequests}</p>
              <p className="mt-2 text-sm text-white/75">Items created in the last 24 hours.</p>
              <p className="mt-1 text-sm text-white/75">
                Pending reports: {overview.pendingReports}
              </p>
            </Link>
            <Link to="/admin/requests-reports?status=pending" className="rounded-[24px] bg-white/10 px-5 py-5 transition hover:bg-white/15">
              <p className="text-xs uppercase tracking-[0.25em] text-white/65">Pending Action</p>
              <p className="mt-3 text-4xl font-semibold text-white">{overview.pendingRequests}</p>
              <p className="mt-2 text-sm text-white/75">Requests and reports still waiting for review.</p>
            </Link>
          </div>
          <p className="mt-5 text-sm leading-7 text-white/80">
            Signed in as {adminUser?.email || "admin"}.
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
          <Link key={item.title} to={item.href} className="block rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-[#e6ddc9] transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm uppercase tracking-[0.3em] text-[#8d9577]">{item.title}</p>
            <p className="mt-4 text-sm leading-7 text-[#4b5541]">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
