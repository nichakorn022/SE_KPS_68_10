
import { useAuthModal } from "../../App";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function ReviewPage() {

  const { openLogin } = useAuthModal();
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [comment, setComment] = useState("");

  const [overall, setOverall] = useState(0);
  const [location, setLocation] = useState(0);
  const [atmosphere, setAtmosphere] = useState(0);
  const [value, setValue] = useState(0);

  useEffect(() => {
    fetch(`http://localhost:3001/api/events/${id}`)
      .then(res => res.json())
      .then(data => setEvent(data));
  }, [id]);

  if (!event) return <div className="p-10">Loading...</div>;

  const eventDate = new Date(event.event_date);
  const today = new Date();
  const isEventFinished = eventDate < today;

  const StarRating = ({ rating, setRating }) => {
    return (
      <div className="flex gap-1">
        {[1,2,3,4,5].map((star)=>(
          <span
            key={star}
            onClick={()=>setRating(star)}
            className={`cursor-pointer text-xl ${
              star <= rating ? "text-yellow-500" : "text-gray-400"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (

    <div className="min-h-screen bg-[#F5F3E9] font-sans text-gray-800 flex flex-col items-center">

      <div className="w-full max-w-auto bg-[#F5F3E9] shadow-sm overflow-hidden min-h-screen">

      {/* HEADER เหมือนหน้าอื่น */}
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

        {/* EVENT CARD */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden grid grid-cols-2">

          <div className="p-8">

            <h1 className="text-xl font-bold mb-3">
              {event.title}
            </h1>

            <p className="text-gray-500 mb-3">
              Organizer #{event.organizer_id}
            </p>

            <p className="text-gray-600">
              🕒 {new Date(event.event_date).toLocaleDateString()}
            </p>

            <p className="text-gray-600 mt-2">
              📍 {event.location}
            </p>

            <p className="text-sm text-gray-600 mt-4 leading-relaxed">
              {event.description}
            </p>

          </div>

          <div className="h-full">
            <img
              src="/Pictrue/Activity.png"
              alt="event"
              className="w-full h-full object-cover"
            />
          </div>

        </div>


        {/* REVIEW SECTION */}
        <div className="max-w-4xl mx-auto mt-8 bg-white rounded-2xl shadow p-6">

          <h2 className="font-semibold mb-4">
            Your options are important!
          </h2>

          <textarea
            placeholder="Write a comment..."
            value={comment}
            onChange={(e)=>setComment(e.target.value)}
            className="w-full border rounded-lg p-3 mb-6"
          />

          {/* RATINGS */}
          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span>Overall</span>
              <StarRating rating={overall} setRating={setOverall}/>
            </div>

            <div className="flex justify-between">
              <span>Location</span>
              <StarRating rating={location} setRating={setLocation}/>
            </div>

            <div className="flex justify-between">
              <span>Atmosphere</span>
              <StarRating rating={atmosphere} setRating={setAtmosphere}/>
            </div>

            <div className="flex justify-between">
              <span>Value for money</span>
              <StarRating rating={value} setRating={setValue}/>
            </div>

          </div>


          {/* POST BUTTON */}
          <button
            disabled={!isEventFinished}
            className={`mt-6 w-full py-2 rounded-full text-white
            ${isEventFinished
              ? "bg-[#6f8b5d] hover:opacity-90"
              : "bg-gray-400 cursor-not-allowed"}
            `}
          >
            {isEventFinished ? "Post Review" : "Event has not finished yet"}
          </button>

        </div>

      </div>

    </div>
    </div>
  );
}

