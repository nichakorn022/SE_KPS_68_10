import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthModal } from '../App';
import SiteNavbar from './components/SiteNavbar';
import { apiUrl } from '../lib/api';

const HOME_EVENT_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80",
];

function formatHomeEventDateTime(value) {
  if (!value) {
    return { date: "Coming soon", time: "TBA" };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: String(value), time: "TBA" };
  }

  return {
    date: parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

function mapHomeEvent(event, index) {
  const title = String(event?.title || "Untitled event");
  const tag = title.toLowerCase().includes('tea') ? 'Tea' :
    title.toLowerCase().includes('yoga') || title.toLowerCase().includes('meditation') ? 'Health' :
    'Activity';
  const { date, time } = formatHomeEventDateTime(event?.event_date || event?.date);
  const capacity = Number(event?.max_participant ?? event?.slots ?? 0);
  const attendeeCount = Number(event?.joined_count ?? event?.members_count ?? event?.participant_count ?? 0);
  const safeCapacity = Number.isFinite(capacity) && capacity > 0 ? capacity : 0;
  const safeAttendees = Number.isFinite(attendeeCount) && attendeeCount > 0 ? attendeeCount : 0;
  const spaces = safeCapacity > 0 ? Math.max(safeCapacity - safeAttendees, 0) : "Open";
  const progress = safeCapacity > 0 ? Math.min((safeAttendees / safeCapacity) * 100, 100) : 0;

  return {
    ...event,
    title,
    tag,
    date,
    time,
    img: event?.img || event?.image_url || HOME_EVENT_FALLBACK_IMAGES[index % HOME_EVENT_FALLBACK_IMAGES.length],
    location: event?.location || "Location TBA",
    members: safeCapacity > 0 ? `${safeAttendees}/${safeCapacity}` : `${safeAttendees}`,
    spaces,
    progress,
  };
}

export default function Home() {
  const { openLogin, openRegister } = useAuthModal();
  const [activeTab, setActiveTab] = useState('all');


  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch(apiUrl('/events'))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data.map((event, index) => mapHomeEvent(event, index)));
        }
      })
      .catch(err => console.error('Failed to fetch events:', err));
  }, []);

  const stats = [
    { value: "1,200+", label: "Members" },
    { value: "50+", label: "Events" },
    { value: "20+", label: "Shops" },
  ];

  const howItWorks = [
    { icon: "🍃", title: "Join Activities", desc: "Browse and sign up for health & wellness events near you" },
    { icon: "🤝", title: "Meet New Friends", desc: "Connect with like-minded people who share your interests" },
    { icon: "🏪", title: "Discover Shops", desc: "Explore top-rated tea shops and wellness spots around the city" },
  ];

  const tagColor = {
    Health: "bg-emerald-100 text-emerald-700",
    Tea: "bg-amber-100 text-amber-700",
    Activity: "bg-sky-100 text-sky-700",
  };

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800">
      <SiteNavbar active="home" />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="w-full px-4 md:px-10 pt-6 pb-16 max-w-[1280px] mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-10">

          {/* Left copy */}
          <div className="flex-1 text-left">
            <span className="inline-block bg-[#AEBC9F]/40 text-[#485B3B] text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">
              Tea · Social · Wellness
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-[#2C2C2C] leading-[1.15] mb-5">
              Find Your<br />
              <span className="text-[#485B3B]">People</span> Over<br />
              a Cup of Tea
            </h1>
            <p className="text-gray-500 text-base md:text-lg mb-8 max-w-md leading-relaxed">
              ชุมชนสำหรับคนรักชา สุขภาพ และกิจกรรมดี ๆ พบเพื่อนใหม่ เรียนรู้ใหม่ ทุกวัน
            </p>
            <div className="flex gap-3 flex-wrap mb-10">
              <button
                onClick={openRegister}
                className="bg-[#485B3B] text-white px-8 py-3 rounded-full font-bold hover:bg-[#3a4a2f] transition-all shadow-lg active:scale-95"
              >
                Join Us Now
              </button>
              <Link to="/events">
                <button className="border-2 border-[#485B3B] text-[#485B3B] px-8 py-3 rounded-full font-bold hover:bg-[#485B3B] hover:text-white transition-all">
                  Explore Events
                </button>
              </Link>
            </div>

            {/* Stat pills */}
            <div className="flex gap-4 flex-wrap">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100 text-center">
                  <p className="text-[#485B3B] text-xl font-extrabold leading-none">{s.value}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right image collage */}
          <div className="flex-1 relative hidden md:flex justify-center items-center min-h-[420px]">
            <div className="w-[280px] h-[360px] rounded-[28px] overflow-hidden shadow-2xl absolute left-0 top-0 z-10">
              <img
                src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80"
                className="w-full h-full object-cover"
                alt="Tea community"
              />
            </div>
            <div className="w-[240px] h-[300px] rounded-[28px] overflow-hidden shadow-xl absolute right-0 bottom-0 z-20 border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80"
                className="w-full h-full object-cover"
                alt="Healthy food"
              />
            </div>
            {/* Floating event card */}
            <div className="absolute right-6 top-6 z-30 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100 max-w-[180px]">
              <p className="text-[10px] text-gray-400 mb-1">Next Event</p>
              <p className="text-[13px] font-bold text-[#485B3B] leading-tight">Morning Yoga</p>
              <p className="text-[11px] text-gray-500 mt-1">Feb 2 · 7:00 AM</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-[1100px] mx-auto text-center">
          <p className="text-[#485B3B] text-sm font-semibold tracking-widest uppercase mb-2">How It Works</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-10">เริ่มต้นกับ Teactive ได้ง่าย ๆ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {howItWorks.map((item, i) => (
              <div
                key={i}
                className="bg-[#F5F3E9] rounded-3xl p-8 text-left hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-[#485B3B] rounded-2xl flex items-center justify-center text-2xl mb-5 shadow-md">
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── UPCOMING EVENTS ──────────────────────────────────── */}
      <section className="py-16 px-4 max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[#485B3B] text-sm font-semibold tracking-widest uppercase mb-1">Don't Miss Out</p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Upcoming Events</h2>
          </div>
          <Link to="/events">
            <button className="text-[#485B3B] font-semibold text-sm border-b-2 border-[#485B3B] hover:opacity-70 transition-all">
              View All →
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={event.img} alt={event.title} className="w-full h-full object-cover" />
                <span className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full ${tagColor[event.tag] || 'bg-gray-100 text-gray-600'}`}>
                  {event.tag}
                </span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-[15px] text-gray-800 mb-3 leading-snug">{event.title}</h3>
                <div className="text-xs text-gray-500 space-y-1.5 mb-4">
                  <p>📅 {event.date}</p>
                  <p>⏰ {event.time}</p>
                  <p>📍 {event.location}</p>
                </div>
                <div className="mt-auto">
                  {/* Seats progress */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                    <span>👥 {event.members}</span>
                    <span>{typeof event.spaces === "number" ? `${event.spaces} seats left` : event.spaces}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4">
                    <div
                      className="h-1.5 bg-[#AEBC9F] rounded-full"
                      style={{ width: `${event.progress || 0}%` }}
                    />
                  </div>
                  <button
                    onClick={openRegister}
                    className="w-full bg-[#485B3B] text-white py-2.5 rounded-full text-sm font-bold hover:bg-[#3a4a2f] transition-all active:scale-95"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────────── */}
      <section className="bg-[#485B3B] py-16 px-6">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="text-white max-w-lg">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-3 leading-snug">
              เหล่าสาวกชามัวรออะไรอยู่ล่ะ<br />มาร่วมกับพวกเราสิ!
            </h2>
            <ul className="space-y-2 text-[#AEBC9F] text-sm mb-8">
              <li>✓ รวมกิจกรรมด้านสุขภาพไว้ที่เดียว</li>
              <li>✓ รีวิวจากผู้เข้าร่วมจริง</li>
              <li>✓ สมัคร-ยกเลิกกิจกรรมง่าย</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={openRegister}
                className="bg-white text-[#485B3B] px-8 py-3 rounded-full font-bold hover:bg-[#F5F3E9] transition-all shadow-lg active:scale-95"
              >
                สมัครสมาชิก
              </button>
              <Link to="/events">
                <button className="border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-[#485B3B] transition-all">
                  ดูกิจกรรมทั้งหมด
                </button>
              </Link>
            </div>
          </div>

          {/* Avatar grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=200&q=80",
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
              "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=200&q=80",
              "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=200&q=80",
              "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=200&q=80",
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=200&q=80",
            ].map((src, i) => (
              <div key={i} className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 shadow-lg">
                <img src={src} alt={`Member ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
