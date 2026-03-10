import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function CommunitySlider() {

  const images = [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc",
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef"
  ];

  return (
    <section className="py-14 px-4 text-center">
      <h2 className="text-[26px] font-medium text-[#485B3B] mb-10">
        ชวนพักใจ พบเพื่อนใหม่ในชุมชนชา
      </h2>

      <div className="max-w-[850px] mx-auto">
        <Swiper
          modules={[Pagination, Navigation, Autoplay]}
          slidesPerView={1}
          loop
          autoplay={{ delay: 4000 }}
          pagination={{ clickable: true }}
        >
          {images.map((src, i) => (
            <SwiperSlide key={i}>
              <img src={src} className="rounded-3xl shadow-lg" />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}