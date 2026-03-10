import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

export default function EventSlider() {

  const eventData = [
    {
      title: "Morning Yoga & Meditation",
      instructor: "ครูจันทรากานต์",
      date: "Sunday, February 2, 2024",
      time: "7:00 AM - 8:30 AM",
      location: "สวนลุมพินี",
      spaces: "8"
    },
    {
      title: "Tea Tasting Workshop",
      instructor: "คุณศิริพงษ์",
      date: "Saturday, February 8, 2024",
      time: "2:00 PM - 4:00 PM",
      location: "ATC Community Space",
      spaces: "3"
    }
  ];

  return (
    <section className="py-10 px-6 text-center">

      <h2 className="text-[26px] font-medium text-[#485B3B] mb-10">
        ร่วมกิจกรรมเพื่อสุขภาพกับผู้คนหลากหลาย
      </h2>

      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 5000 }}
        pagination={{ clickable: true }}
      >
        {eventData.map((event, i) => (
          <SwiperSlide key={i}>
            <div className="bg-white rounded-3xl shadow-xl p-10">
              <h3 className="text-xl font-bold">{event.title}</h3>

              <p>👤 {event.instructor}</p>
              <p>📅 {event.date}</p>
              <p>⏰ {event.time}</p>
              <p>📍 {event.location}</p>

              <button className="mt-4 bg-[#AEBC9F] px-6 py-2 rounded-full text-white">
                เหลือ {event.spaces} ที่
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

    </section>
  );
}