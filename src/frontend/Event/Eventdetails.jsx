
import { useEffect, useState } from "react";
import { Link, useParams } from 'react-router-dom';
import { useAuthModal } from '../../App';

export default function Eventdetails() {

  const { openLogin } = useAuthModal();
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [isInterested, setIsInterested] = useState(false);

  useEffect(() => {

    fetch(`http://localhost:3001/api/events/${id}`)
      .then(res => res.json())
      .then(data => setEvent(data));

    const saved = JSON.parse(localStorage.getItem("interestedEvents")) || [];

    if (saved.includes(Number(id))) {
      setIsInterested(true);
    }

  }, [id]);


  const handleInterested = () => {

    const saved = JSON.parse(localStorage.getItem("interestedEvents")) || [];

    if (saved.includes(event.event_id)) {

      const updated = saved.filter(eid => eid !== event.event_id);
      localStorage.setItem("interestedEvents", JSON.stringify(updated));
      setIsInterested(false);

    } else {

      saved.push(event.event_id);
      localStorage.setItem("interestedEvents", JSON.stringify(saved));
      setIsInterested(true);

    }

  };


  if (!event) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-auto bg-[#F5F3E9] shadow-sm overflow-hidden min-h-screen">

      {/* HEADER */}
      <nav className="flex items-center justify-between px-8 py-2 bg-[#AEBC9F] w-full sticky top-0 z-50 shadow-sm">

        <div className="flex items-center justify-start h-16 w-32 md:w-40">
          <img
            src="/Pictrue/Logo.png"
            alt="ATC Logo"
            className="h-full w-auto object-contain drop-shadow-sm"
          />
        </div>

        <div className="flex items-center gap-6 md:gap-12 text-[17px] font-medium text-[#4a4a4a] pr-4">

          <Link
            to="/"
            className="hover:text-black transition-colors underline-offset-4 hover:underline"
          >
            Home
          </Link>

          <Link
            to="/shop"
            className="hover:text-black transition-colors underline-offset-4 hover:underline"
          >
            Shop
          </Link>

          <Link
            to="/events"
            className="hover:text-black transition-colors underline-offset-4 hover:underline"
          >
            Event
          </Link>

          <button
            onClick={openLogin}
            className="hover:text-black transition-colors underline-offset-4 hover:underline border-l border-black/20 pl-6"
          >
            Login
          </button>

        </div>

      </nav>


      {/* PAGE CONTENT */}
      <div className="p-8">

        {/* MAIN EVENT CARD */}
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-2">

          {/* LEFT SIDE */}
          <div className="p-8">

            <h1 className="text-2xl font-bold mb-3">
              {event.title}
            </h1>

            <p className="text-gray-500 mb-4">
              Organizer #{event.organizer_id}
            </p>

            <p className="flex items-center gap-2 text-gray-600">
              🕒 {new Date(event.event_date).toLocaleDateString()}
            </p>

            <p className="flex items-center gap-2 text-gray-600 mt-2">
              📍 {event.location}
            </p>

            <div className="mt-4 flex gap-3">

              <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm">
                0/{event.max_participant} Will go
              </span>

              <span className="bg-gray-200 px-3 py-1 rounded-full text-sm">
                Interested {isInterested ? 1 : 0}
              </span>

            </div>


            {/* DESCRIPTION */}
            <div className="mt-6">
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {event.description}
              </p>
            </div>


            {/* BUTTONS */}
            <div className="mt-6 flex gap-4">

              <button
                onClick={() => console.log("Chat clicked")}
                className="bg-[#9fb08f] px-6 py-3 rounded-full text-white font-medium hover:opacity-90 active:scale-95 transition"
              >
                Chat
              </button>

              <button
                onClick={() => console.log("Register clicked")}
                className="px-4 py-2 rounded-full border hover:bg-gray-100 active:scale-95 transition"
              >
                Register
              </button>

              <button
                onClick={handleInterested}
                className={`px-4 py-2 rounded-full border transition ${
                  isInterested
                    ? "bg-pink-500 text-white border-pink-500"
                    : "hover:bg-gray-100"
                }`}
              >
                ❤️ {isInterested ? "Interested" : "Add Interested"}
              </button>

            </div>

          </div>


          {/* RIGHT SIDE IMAGE */}
          <div className="h-full">
            <img
              src="/Pictrue/Activity.png"
              alt="event"
              className="w-full h-full object-cover"
            />
          </div>

        </div>


        {/* COMMENT SECTION */}
        <div className="max-w-6xl mx-auto mt-8 bg-white rounded-2xl shadow p-6">

          <h2 className="font-semibold mb-4">Comment (3)</h2>

          <div className="flex gap-3 mb-6">

            <img
              src="https://i.pravatar.cc/40"
              className="w-10 h-10 rounded-full"
            />

            <input
              type="text"
              placeholder="Write a comment..."
              className="flex-1 border rounded-full px-4 py-2"
            />

            <button
              onClick={() => console.log("Post clicked")}
              className="bg-[#9fb08f] px-6 py-3 rounded-full text-white font-medium hover:opacity-90 active:scale-95 transition"
            >
              Post
            </button>

          </div>


          <div className="space-y-4">

            <div className="flex gap-3">
              <img src="https://i.pravatar.cc/41" className="w-9 h-9 rounded-full" />
              <div className="bg-gray-100 p-3 rounded-xl">
                <p className="font-semibold text-sm">Uka Uka</p>
                <p className="text-sm">กิจกรรมสนุกมากครับ บรรยากาศดีมาก</p>
              </div>
            </div>

            <div className="flex gap-3">
              <img src="https://i.pravatar.cc/42" className="w-9 h-9 rounded-full" />
              <div className="bg-gray-100 p-3 rounded-xl">
                <p className="font-semibold text-sm">Somchai</p>
                <p className="text-sm">ขอบคุณทีมงานมากครับ กิจกรรมดีมาก</p>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
    </div>
  );
}

