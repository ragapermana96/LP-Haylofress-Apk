import { Quote, Star } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    {
      avatarName: 'Ibu Kartika',
      role: 'Ibu Rumah Tangga (Karangtengah, Ngawi)',
      text: 'Sebagai ibu bekerja dengan 3 anak, waktu belanja dan masak itu sangat mepet sekali. Sejak berlangganan di Haylofress Ngawi, masak jadi praktis luar biasa! Cekernya sudah benar-benar bersih mulus tanpa kuku, daging ayamnya empuk, sayurannya segar terawat. Masak sup tinggal cemplung-cemplung, beres dalam 15 menit!',
      stars: 5,
    },
    {
      avatarName: 'Bapak Prasetyo',
      role: "Owner 'Berkah Katering' Ngawi",
      text: 'Katering pernikahan kami membutuhkan minimal 50 kg filet dada dan sayuran mix setiap minggunya. Cari supplier bahan beku yang bersih, halal, dan berpasokan stabil sangat susah di Ngawi, sampai kami klop dengan Haylofress. Fitur harga grosirnya menolong margin keuntungan katering kami, pengiriman berinsulasi aman tepat waktu.',
      stars: 5,
    },
    {
      avatarName: 'Nuning Dyah',
      role: 'Reseller Frozen Food (Sine, Ngawi)',
      text: 'Awalnya saya ragu mau jualan frozen food karena modal minim. Alhamdulillah di Haylofress Ngawi sistem grosirnya sangat bersahabat, cukup beli minimal 5 Kg sudah dapat diskon grosir per item. Penjualan lancar karena kualitas produknya premium, konsumen perumahan di tempat saya ketagihan beli filet dori dan kentang gorengnya!',
      stars: 5,
    },
  ];

  return (
    <section id="id-testimoni" className="py-20 bg-gradient-to-b from-[#f0f9ff] to-white relative overflow-hidden border-t border-slate-200">
      {/* Decorative Blur Orb */}
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-200/20 rounded-full blur-[115px] pointer-events-none"></div>
      <div className="absolute top-10 right-10 w-80 h-80 bg-emerald-200/20 rounded-full blur-[110px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <span className="text-emerald-700 text-xs sm:text-sm font-extrabold uppercase tracking-widest block font-mono">
            — BUKTI NYATA LAYANAN KAMI —
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 leading-tight">
            Apa Kata Mereka Tentang Haylofress Ngawi?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Kepuasan pelanggan harian adalah kebanggaan terbesar kami. Berikut merupakan pengalaman jujur dari mitra warung makan, reseller, dan ibu rumah tangga di Kabupaten Ngawi.
          </p>
        </div>

        {/* Reviews Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="bg-white/40 backdrop-blur-xl border border-white/50 p-6 sm:p-8 rounded-[2rem] shadow-lg hover:shadow-2xl hover:shadow-emerald-200/10 hover:bg-white/60 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 transform relative group"
            >
              {/* Quote Graphic Icon on Hover */}
              <div className="absolute top-6 right-6 text-emerald-250/20 group-hover:text-emerald-200/60 transition-colors duration-300">
                <Quote className="w-10 h-10 transform rotate-180" />
              </div>

              {/* Stars Row */}
              <div className="space-y-4">
                <div className="flex gap-1">
                  {Array.from({ length: rev.stars }).map((_, sIdx) => (
                    <Star key={sIdx} className="w-4.5 h-4.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-slate-600 text-sm leading-relaxed italic relative z-10">
                  "{rev.text}"
                </p>
              </div>

              {/* Bottom user meta */}
              <div className="pt-6 border-t border-slate-200/60 mt-6 flex items-center gap-3">
                <div className="h-10 w-10 h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-sm uppercase shrink-0">
                  {rev.avatarName.charAt(0)}
                  {rev.avatarName.charAt(1)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm leading-tight">
                    {rev.avatarName}
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                    {rev.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
