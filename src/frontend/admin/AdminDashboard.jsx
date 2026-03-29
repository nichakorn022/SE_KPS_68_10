import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { adminApi } from "./adminApi";

function getVerificationStatusLabel(value) {
  return Number(value) === 1 ? "approved" : Number(value) === 2 ? "rejected" : "pending";
}

const AUTO_REFRESH_MS = 45000;

function getMonthDateRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { start, end };
}

function isWithinRange(value, range) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return time >= range.start.getTime() && time < range.end.getTime();
}

function getTimeValue(value) {
  return value ? new Date(value).getTime() : 0;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US");
}

function formatDelta(current, previous, suffix = "") {
  const diff = current - previous;
  if (diff === 0) return "No change from last month";
  const absValue = Math.abs(diff);
  return diff > 0
    ? `Up ${absValue}${suffix} from last month`
    : `Down ${absValue}${suffix} from last month`;
}

function getTrendClass(diff, dark = false) {
  if (diff > 0) return dark ? "text-[#d9f0c7]" : "text-[#386132]";
  if (diff < 0) return dark ? "text-[#ffd4cb]" : "text-[#b33a24]";
  return dark ? "text-white/75" : "text-[#5b654d]";
}

function getDateKey(value) {
  const date = value ? new Date(value) : new Date(0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildLast7DayBuckets() {
  const buckets = {};

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);
    buckets[getDateKey(date)] = 0;
  }

  return buckets;
}

function trendFromBuckets(buckets) {
  const entries = Object.entries(buckets);
  return {
    labels: entries.map(([key]) => {
      const [, month, day] = key.split("-");
      return `${day}/${month}`;
    }),
    values: entries.map(([, value]) => value),
  };
}

function buildOrderTrend(orders) {
  const buckets = buildLast7DayBuckets();
  for (const order of orders) {
    const key = getDateKey(order.order_date);
    if (key in buckets) buckets[key] += 1;
  }
  return trendFromBuckets(buckets);
}

function buildSignupTrend(users) {
  const buckets = buildLast7DayBuckets();
  for (const user of users) {
    const key = getDateKey(user.created_at);
    if (key in buckets) buckets[key] += 1;
  }
  return trendFromBuckets(buckets);
}

function countBy(items, getKey) {
  return items.reduce((accumulator, item) => {
    const key = getKey(item);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

export default function AdminDashboard() {
  const { adminUser, adminToken } = useOutletContext();
  const [dashboard, setDashboard] = useState({
    shops: [],
    organizers: [],
    reports: [],
    sponsors: [],
    events: [],
    orders: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard(showLoading = true) {
      if (!cancelled) setLoading(showLoading);

      try {
        const [shops, organizers, reports, sponsors, events, orders, users] = await Promise.all([
          adminApi.getShops(adminToken),
          adminApi.getOrganizers(adminToken),
          adminApi.getReports(adminToken),
          adminApi.getSponsors(adminToken),
          adminApi.getEvents(adminToken),
          adminApi.getOrders(adminToken),
          adminApi.getUsers(adminToken),
        ]);

        if (!cancelled) {
          setDashboard({ shops, organizers, reports, sponsors, events, orders, users });
          setError("");
          setLastUpdatedAt(Date.now());
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    const intervalId = setInterval(() => loadDashboard(false), AUTO_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [adminToken]);

  const summary = useMemo(() => {
    const { shops, organizers, reports, sponsors, events, users, orders } = dashboard;
    const currentMonth = getMonthDateRange(0);
    const previousMonth = getMonthDateRange(-1);

    const pendingShops = shops.filter((item) => Number(item.verified_status) === 0).length;
    const pendingOrganizers = organizers.filter((item) => Number(item.verified_status) === 0).length;
    const pendingReports = reports.filter((item) => String(item.status).toLowerCase() === "pending").length;
    const pendingSponsors = sponsors.filter((item) => String(item.status).toLowerCase() === "pending").length;
    const monthlyRequests = [...shops, ...organizers, ...reports, ...sponsors].filter((item) =>
      isWithinRange(item.created_at, currentMonth)
    ).length;
    const previousMonthlyRequests = [...shops, ...organizers, ...reports, ...sponsors].filter((item) =>
      isWithinRange(item.created_at, previousMonth)
    ).length;
    const monthlyEvents = events.filter((item) => isWithinRange(item.event_date, currentMonth)).length;
    const previousMonthlyEvents = events.filter((item) => isWithinRange(item.event_date, previousMonth)).length;
    const monthlyNewUsers = users.filter((item) => isWithinRange(item.created_at, currentMonth)).length;
    const previousMonthlyNewUsers = users.filter((item) => isWithinRange(item.created_at, previousMonth)).length;
    const monthlyOrders = orders.filter((item) => isWithinRange(item.order_date, currentMonth)).length;
    const monthlyReports = reports.filter((item) => isWithinRange(item.created_at, currentMonth)).length;

    return {
      pendingShops,
      pendingOrganizers,
      pendingReports,
      pendingSponsors,
      totalPending: pendingShops + pendingOrganizers + pendingReports + pendingSponsors,
      totalUsers: users.length,
      totalShops: shops.length,
      totalEvents: events.length,
      totalOrders: orders.length,
      members: users.filter((item) => String(item.role).toLowerCase() === "user").length,
      shopAccounts: users.filter((item) => String(item.role).toLowerCase() === "shop").length,
      openEvents: events.filter((item) => String(item.status).toLowerCase() === "open").length,
      monthlyRequests,
      previousMonthlyRequests,
      monthlyEvents,
      previousMonthlyEvents,
      monthlyNewUsers,
      previousMonthlyNewUsers,
      monthlyOrders,
      monthlyReports,
    };
  }, [dashboard]);

  const urgentQueue = useMemo(
    () => [
      {
        title: "Pending Reports",
        value: summary.pendingReports,
        helper: "Reports waiting for moderation",
        href: "/admin/requests-reports?type=report&status=pending",
        tone: summary.pendingReports > 0 ? "danger" : "neutral",
      },
      {
        title: "Pending Shops",
        value: summary.pendingShops,
        helper: "Shop requests waiting for approval",
        href: "/admin/requests-reports?type=shop&status=pending",
        tone: summary.pendingShops > 0 ? "danger" : "neutral",
      },
      {
        title: "Pending Organizers",
        value: summary.pendingOrganizers,
        helper: "Organizer accounts waiting for review",
        href: "/admin/requests-reports?type=organizer&status=pending",
        tone: summary.pendingOrganizers > 0 ? "danger" : "neutral",
      },
      {
        title: "Pending Sponsors",
        value: summary.pendingSponsors,
        helper: "Sponsor requests pending a decision",
        href: "/admin/requests-reports?type=sponsor&status=pending",
        tone: summary.pendingSponsors > 0 ? "danger" : "neutral",
      },
    ],
    [summary]
  );

  const recentReports = useMemo(
    () => [...dashboard.reports].sort((a, b) => getTimeValue(b.created_at) - getTimeValue(a.created_at)).slice(0, 5),
    [dashboard.reports]
  );

  const recentUsers = useMemo(
    () => [...dashboard.users].sort((a, b) => getTimeValue(b.created_at) - getTimeValue(a.created_at)).slice(0, 5),
    [dashboard.users]
  );

  const recentEvents = useMemo(
    () => [...dashboard.events].sort((a, b) => getTimeValue(b.event_date) - getTimeValue(a.event_date)).slice(0, 5),
    [dashboard.events]
  );

  const latestOrders = useMemo(
    () => [...dashboard.orders].sort((a, b) => getTimeValue(b.order_date) - getTimeValue(a.order_date)).slice(0, 6),
    [dashboard.orders]
  );

  const approvalFeed = useMemo(() => {
    const shops = dashboard.shops.map((shop) => ({
      id: `shop-${shop.shop_id}`,
      title: shop.shop_name || `Shop #${shop.shop_id}`,
      subtitle: shop.email || `User #${shop.user_id}`,
      status: getVerificationStatusLabel(shop.verified_status),
      createdAt: shop.created_at,
      href: "/admin/requests-reports?type=shop",
    }));

    const organizers = dashboard.organizers.map((organizer) => ({
      id: `organizer-${organizer.organizer_id}`,
      title:
        [organizer.first_name, organizer.last_name].filter(Boolean).join(" ") ||
        organizer.organization_name ||
        organizer.username ||
        `Organizer #${organizer.organizer_id}`,
      subtitle: organizer.email || `User #${organizer.user_id}`,
      status: getVerificationStatusLabel(organizer.verified_status),
      createdAt: organizer.created_at,
      href: "/admin/requests-reports?type=organizer",
    }));

    return [...shops, ...organizers]
      .sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt))
      .slice(0, 6);
  }, [dashboard.organizers, dashboard.shops]);

  const roleSummaryRows = useMemo(() => {
    const grouped = countBy(dashboard.users, (item) => String(item.role || "unknown").toLowerCase());
    return Object.entries(grouped)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [dashboard.users]);

  const eventStatusRows = useMemo(() => {
    const grouped = countBy(dashboard.events, (item) => String(item.status || "draft").toLowerCase());
    return Object.entries(grouped)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [dashboard.events]);

  const reportStatusRows = useMemo(() => {
    const grouped = countBy(dashboard.reports, (item) => String(item.status || "pending").toLowerCase());
    return Object.entries(grouped)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [dashboard.reports]);

  const orderTrend = useMemo(() => buildOrderTrend(dashboard.orders), [dashboard.orders]);
  const signupTrend = useMemo(() => buildSignupTrend(dashboard.users), [dashboard.users]);

  const quickLinks = [
    {
      title: "Requests & Reports",
      description: "Review approvals and moderation work from one place.",
      href: "/admin/requests-reports",
    },
    {
      title: "Users",
      description: "Inspect members, organizers, and account activity.",
      href: "/admin/users",
    },
    {
      title: "Shops",
      description: "Review shop profiles, products, and approval status.",
      href: "/admin/shops",
    },
    {
      title: "Events",
      description: "Create, update, close, or cancel events directly.",
      href: "/admin/events",
    },
  ];

  const dailyChecklist = [
    {
      label: "Pending actions",
      value: summary.totalPending,
      helper: "Requests, reports, and sponsor items awaiting action",
      href: "/admin/requests-reports?status=pending",
    },
    {
      label: "New signups",
      value: summary.monthlyNewUsers,
      helper: "Accounts created this month",
      href: "/admin/users",
    },
    {
      label: "Pending shops",
      value: summary.pendingShops,
      helper: "Shops still waiting for verification",
      href: "/admin/shops",
    },
    {
      label: "Open events",
      value: summary.openEvents,
      helper: "Events currently open for registrations",
      href: "/admin/events",
    },
  ];

  const handleRefreshNow = async () => {
    setLoading(true);
    try {
      const [shops, organizers, reports, sponsors, events, orders, users] = await Promise.all([
        adminApi.getShops(adminToken),
        adminApi.getOrganizers(adminToken),
        adminApi.getReports(adminToken),
        adminApi.getSponsors(adminToken),
        adminApi.getEvents(adminToken),
        adminApi.getOrders(adminToken),
        adminApi.getUsers(adminToken),
      ]);
      setDashboard({ shops, organizers, reports, sponsors, events, orders, users });
      setError("");
      setLastUpdatedAt(Date.now());
    } catch (loadError) {
      setError(loadError.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-[32px] bg-[#485b3b] p-8 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/70">Admin Overview</p>
              <h3 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight">
                Admin dashboard
              </h3>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80">
                Signed in as {adminUser?.email || "admin"}. Review pending actions, recent activity, and monthly totals from here.
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-white/60">
                Auto refresh every 45s | Last updated {formatDate(lastUpdatedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefreshNow}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/15"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OverviewCard
              label="Requests This Month"
              value={summary.monthlyRequests}
              helper={formatDelta(summary.monthlyRequests, summary.previousMonthlyRequests)}
              trend={summary.monthlyRequests - summary.previousMonthlyRequests}
              href="/admin/requests-reports?status=pending"
              dark
            />
            <OverviewCard
              label="Total Users"
              value={summary.totalUsers}
              helper={`${summary.members} member accounts`}
              trend={summary.monthlyNewUsers}
              href="/admin/users"
              dark
            />
            <OverviewCard
              label="New Signups This Month"
              value={summary.monthlyNewUsers}
              helper={formatDelta(summary.monthlyNewUsers, summary.previousMonthlyNewUsers, " users")}
              trend={summary.monthlyNewUsers - summary.previousMonthlyNewUsers}
              href="/admin/users"
              dark
            />
            <OverviewCard
              label="Events This Month"
              value={summary.monthlyEvents}
              helper={formatDelta(summary.monthlyEvents, summary.previousMonthlyEvents, " events")}
              trend={summary.monthlyEvents - summary.previousMonthlyEvents}
              href="/admin/events"
              dark
            />
          </div>

          {error ? <p className="mt-5 text-sm text-[#f8d5cd]">Unable to load dashboard: {error}</p> : null}
          {loading ? <p className="mt-5 text-sm text-white/75">Loading latest dashboard data...</p> : null}
        </div>

        <div className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[#e6ddc9]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Urgent Queue</p>
              <h3 className="mt-3 text-2xl font-semibold text-[#2f3529]">Priority items</h3>
            </div>
            <Link to="/admin/requests-reports?status=pending" className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b]">
              Open requests
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {urgentQueue.map((item) => (
              <Link
                key={item.title}
                to={item.href}
                className={`block rounded-[24px] px-4 py-4 transition ${
                  item.tone === "danger" ? "bg-[#fff0ed] hover:bg-[#fde6df]" : "bg-[#f8f4eb] hover:bg-[#f1eadc]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#8d9577]">{item.title}</p>
                    <p className="mt-2 text-sm text-[#5b654d]">{item.helper}</p>
                  </div>
                  <p className="text-2xl font-semibold text-[#2f3529]">{item.value}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        <MetricCard label="Users" value={summary.totalUsers} helper={`${summary.monthlyNewUsers} added this month`} href="/admin/users" />
        <MetricCard label="Shops" value={summary.totalShops} helper={`${summary.shopAccounts} shop accounts`} href="/admin/shops" />
        <MetricCard label="Events" value={summary.totalEvents} helper={`${summary.openEvents} currently open`} href="/admin/events" />
        <MetricCard label="Orders" value={summary.totalOrders} helper={`${summary.monthlyOrders} created this month`} href="/admin/users" />
      </div>

      <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Daily Operations</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#2f3529]">Admin shortcuts</h3>
            <p className="mt-2 text-sm text-[#5b654d]">
              Open the main admin pages used for routine review and account management.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dailyChecklist.map((item) => (
            <OverviewCard
              key={item.label}
              label={item.label}
              value={item.value}
              helper={item.helper}
              href={item.href}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartPanel
          title="Orders Last 7 Days"
          helper="Daily order volume across the platform"
          labels={orderTrend.labels}
          values={orderTrend.values}
          tone="olive"
          formatter={(value) => `${value} orders`}
        />
        <ChartPanel
          title="User Signups Last 7 Days"
          helper="New account creation trend"
          labels={signupTrend.labels}
          values={signupTrend.values}
          tone="sand"
          formatter={(value) => `${value} users`}
        />
      </div>

      <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Monthly Summary</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#2f3529]">Monthly admin summary</h3>
            <p className="mt-2 text-sm text-[#5b654d]">
              Monthly totals for accounts, requests, reports, events, and orders.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="New Users This Month" value={summary.monthlyNewUsers} helper="Monthly signup total" />
          <StatCard label="Requests This Month" value={summary.monthlyRequests} helper="Shops, organizers, reports, and sponsors" />
          <StatCard label="Reports This Month" value={summary.monthlyReports} helper="Event reports created this month" />
          <StatCard label="Orders This Month" value={summary.monthlyOrders} helper="Orders based on order date" />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          <SummaryPanel title="User Roles" emptyLabel="No user data">
            {roleSummaryRows.map((row) => (
              <KeyValueRow key={row.label} label={row.label} value={row.value} />
            ))}
          </SummaryPanel>

          <SummaryPanel title="Event Statuses" emptyLabel="No event data">
            {eventStatusRows.map((row) => (
              <KeyValueRow key={row.label} label={row.label} value={row.value} />
            ))}
          </SummaryPanel>

          <SummaryPanel title="Report Statuses" emptyLabel="No report data">
            {reportStatusRows.map((row) => (
              <KeyValueRow key={row.label} label={row.value === undefined ? "-" : row.label} value={row.value} />
            ))}
          </SummaryPanel>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Recent Reports" actionLabel="Open reports" actionHref="/admin/requests-reports?type=report" emptyLabel="No reports yet">
          {recentReports.map((report) => (
            <ListRow
              key={report.report_id}
              title={report.event_title || `Event #${report.event_id}`}
              subtitle={`${report.report_type || "report"} by ${report.username || report.email || `User #${report.user_id}`}`}
              meta={`${report.status || "pending"} | ${formatDate(report.created_at)}`}
              href="/admin/requests-reports?type=report"
            />
          ))}
        </Panel>

        <Panel title="Recent Approvals" actionLabel="Open approvals" actionHref="/admin/requests-reports?view=approvals" emptyLabel="No approval activity yet">
          {approvalFeed.map((item) => (
            <ListRow
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              meta={`${item.status} | ${formatDate(item.createdAt)}`}
              href={item.href}
            />
          ))}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Recent Users" actionLabel="Open users" actionHref="/admin/users" emptyLabel="No users yet">
          {recentUsers.map((user) => (
            <ListRow
              key={user.user_id}
              title={user.username || `User #${user.user_id}`}
              subtitle={user.email || "-"}
              meta={`${user.role || "user"} | ${formatDate(user.created_at)}`}
              href="/admin/users"
            />
          ))}
        </Panel>

        <Panel title="Event Schedule" actionLabel="Open events" actionHref="/admin/events" emptyLabel="No events yet">
          {recentEvents.map((event) => (
            <ListRow
              key={event.event_id}
              title={event.title || `Event #${event.event_id}`}
              subtitle={event.location || "-"}
              meta={`${event.status || "draft"} | ${formatDate(event.event_date)}`}
              href="/admin/events"
            />
          ))}
        </Panel>

        <Panel title="Latest Orders" actionLabel="Open users" actionHref="/admin/users" emptyLabel="No orders yet">
          {latestOrders.map((order) => (
            <ListRow
              key={order.order_id}
              title={`Order #${order.order_id}`}
              subtitle={`User #${order.user_id}`}
              meta={`${order.status || "pending"} | ${formatDate(order.order_date)}`}
              href="/admin/users"
            />
          ))}
        </Panel>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((item) => (
          <Link
            key={item.title}
            to={item.href}
            className="block rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-[#e6ddc9] transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-[#8d9577]">{item.title}</p>
            <p className="mt-4 text-sm leading-7 text-[#4b5541]">{item.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function OverviewCard({ label, value, helper, href, dark = false, trend = 0 }) {
  return (
    <Link to={href} className={`rounded-[24px] px-5 py-5 transition ${dark ? "bg-white/10 hover:bg-white/15" : "bg-[#f8f4eb] hover:bg-[#f1eadc]"}`}>
      <p className={`text-xs uppercase tracking-[0.25em] ${dark ? "text-white/65" : "text-[#8d9577]"}`}>{label}</p>
      <p className={`mt-3 text-4xl font-semibold ${dark ? "text-white" : "text-[#2f3529]"}`}>{value}</p>
      <p className={`mt-2 text-sm ${getTrendClass(trend, dark)}`}>{helper}</p>
    </Link>
  );
}

function MetricCard({ label, value, helper, href }) {
  return (
    <Link to={href} className="rounded-[28px] bg-white px-5 py-5 shadow-sm ring-1 ring-[#e6ddc9] transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs uppercase tracking-[0.25em] text-[#8d9577]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-[#2f3529]">{value}</p>
      <p className="mt-2 text-sm text-[#5b654d]">{helper}</p>
    </Link>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-[24px] bg-[#f8f4eb] px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d9577]">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-[#2f3529]">{value}</p>
      <p className="mt-2 text-sm text-[#5d6550]">{helper}</p>
    </div>
  );
}

function SummaryPanel({ title, emptyLabel, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [];

  return (
    <div className="rounded-[28px] bg-[#fcfbf7] p-5 ring-1 ring-[#e6ddc9]">
      <p className="text-sm uppercase tracking-[0.28em] text-[#8d9577]">Breakdown</p>
      <h4 className="mt-2 text-xl font-semibold text-[#2f3529]">{title}</h4>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <div className="rounded-2xl bg-white px-4 py-4 text-sm text-[#7a8368]">{emptyLabel}</div> : items}
      </div>
    </div>
  );
}

function KeyValueRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] bg-white px-4 py-4">
      <p className="text-sm text-[#5d6550]">{label}</p>
      <p className="text-xl font-semibold text-[#2f3529]">{value}</p>
    </div>
  );
}

function Panel({ title, actionLabel, actionHref, emptyLabel, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [];

  return (
    <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Latest Data</p>
          <h3 className="mt-3 text-2xl font-semibold text-[#2f3529]">{title}</h3>
        </div>
        <Link to={actionHref} className="rounded-full bg-[#efe8d8] px-4 py-2 text-xs font-medium text-[#485b3b]">
          {actionLabel}
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? <div className="rounded-2xl bg-[#f8f4eb] px-4 py-6 text-sm text-[#7a8368]">{emptyLabel}</div> : items}
      </div>
    </div>
  );
}

function ListRow({ title, subtitle, meta, href }) {
  return (
    <Link to={href} className="block rounded-[24px] bg-[#f8f4eb] px-4 py-4 transition hover:bg-[#f1eadc]">
      <p className="font-semibold text-[#2f3529]">{title}</p>
      <p className="mt-1 text-sm text-[#5d6550]">{subtitle}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8d9577]">{meta}</p>
    </Link>
  );
}

function ChartPanel({ title, helper, labels, values, tone = "olive", formatter }) {
  const maxValue = Math.max(...values, 1);
  const palette =
    tone === "sand"
      ? { bar: "bg-[#c48a45]", soft: "bg-[#edd9bd]", text: "text-[#8d5e26]" }
      : { bar: "bg-[#485b3b]", soft: "bg-[#d8e0d0]", text: "text-[#485b3b]" };

  return (
    <div className="rounded-[32px] bg-white p-7 shadow-sm ring-1 ring-[#e6ddc9]">
      <p className="text-sm uppercase tracking-[0.35em] text-[#8d9577]">Trend</p>
      <h3 className="mt-3 text-2xl font-semibold text-[#2f3529]">{title}</h3>
      <p className="mt-2 text-sm text-[#5b654d]">{helper}</p>

      <div className="mt-6 grid grid-cols-7 gap-3">
        {labels.map((label, index) => {
          const value = values[index] || 0;
          const height = Math.max(10, Math.round((value / maxValue) * 140));

          return (
            <div key={label} className="flex flex-col items-center gap-3">
              <div className="flex h-44 w-full items-end justify-center rounded-[24px] bg-[#f8f4eb] px-2 py-3">
                <div
                  className={`w-full max-w-10 rounded-t-2xl ${value > 0 ? palette.bar : palette.soft}`}
                  style={{ height }}
                  title={formatter(value)}
                />
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${palette.text}`}>{formatter(value)}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#8d9577]">{label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
