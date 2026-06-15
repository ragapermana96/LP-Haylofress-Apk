import { ShieldAlert, CheckCircle, ClockAlert, Info, ShoppingCart, ShieldCheck } from 'lucide-react';

interface ProblemSolutionProps {
  settings: any;
}

export default function ProblemSolution({ settings }: ProblemSolutionProps) {
  const problems = [
    {
      icon: <ClockAlert className="w-5 h-5 text-rose-500" />,
      title: 'Capek & Ribet ke Pasar Subuh',
      text: 'Harus bangun pagi-pagi, menerjang macet, berjalan di beceknya lantai pasar tradisional hanya untuk mendapatkan potongan daging segar pilihan.',
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
      title: 'Kotor, Amis & Buang Waktu',
      text: 'Repot mencuci lendir ceker, memisahkan kuku tajam satu-persatu, membersihkan bulu sisa ayam, mencabuti lemak sapi, hingga seluruh wastafel amis.',
    },
    {
      icon: <Info className="w-5 h-5 text-rose-500" />,
      title: 'Higienitas Diragukan',
      text: 'Daging diletakkan di udara terbuka tanpa pembeku, rentan dihinggapi lalat pasar, terpapar debu jalanan, serta kuman pembusuk yang tumbuh subur.',
    },
    {
      icon: <ClockAlert className="w-5 h-5 text-rose-500" />,
      title: 'Harga Naik Turun & Stok Kosong',
      text: 'Pemilik catering, depot mie ayam, atau bakso sering pusing karena pasokan daging eceran dari pasar tidak stabil harganya, alias fluktuatif.',
    },
  ];

  const solutions = [
    {
      icon: <ShoppingCart className="w-5 h-5 text-emerald-500" />,
      title: 'Pesan Praktis Sambil Rebahan',
      text: 'Cukup pilih item kebutuhan lewat ponsel Anda. Duduk manis di rumah, pesanan premium Anda dikirim langsung oleh kurir mitra kami.',
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      title: 'Buka Kemasan Langsung Cemplung',
      text: 'Ceker sudah mulus tanpa kuku, daging dada sudah difilet rapi, sayur beku sudah dipotong & dicuci air steril. Hemat waktu masak melimpah!',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      title: 'Pristine Cold-Chain Vacuum',
      text: 'Disimpan di cold-storage khusus suhu di bawah -18°C. Menghambat mutlak pembusukan lalat & kuman, mengunci sari dan cita rasa aslinya.',
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      title: 'Grosir Auto-Apply Stabil',
      text: 'Kami tangan pertama. Memberikan kuota harga grosir murah yang stabil minimal beli 5 kg, membantu mengamankan laba UMKM & margin reseller.',
    },
  ];

  return (
    <section id="id-problem" className="py-20 bg-[#f0f9ff] text-slate-800 relative overflow-hidden border-t border-slate-200">
      {/* Subtle background nodes */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-rose-200/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-emerald-700 text-xs sm:text-sm font-extrabold uppercase tracking-widest block font-mono">
            — EMPATHY & CLARITY —
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-850">
            {settings?.problemTitle || "Sering Mengalami Kendala Ini Saat Menyiapkan Sajian Makanan?"}
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {settings?.problemSubtitle || "Menyiapkan masakan bergizi tidak seharusnya menyiksa fisik dan memakan waktu berharga Anda. Mari bandingkan keruwetan dapur lama vs kepraktisan era baru."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          
          {/* PROBLEM SIDE */}
          <div className="bg-white/40 backdrop-blur-xl border border-rose-200/65 p-6 sm:p-8 rounded-[2rem] space-y-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase mb-6">
                ❌ {settings?.solutionTitle || "Keribetan Tradisional & Dapur Lama"}
              </div>
              <div className="space-y-6">
                {problems.map((prob, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="bg-rose-500/10 p-2.5 rounded-2xl h-fit shrink-0 text-rose-500">
                      {prob.icon}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{prob.title}</h3>
                      <p className="text-slate-600 text-sm mt-1 leading-relaxed">{prob.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-200/60 text-slate-500 text-xs text-center italic mt-6">
              Sangat melelahkan, bukan? Ada cara yang jauh lebih baik...
            </div>
          </div>

          {/* SOLUTION SIDE */}
          <div className="bg-white/80 backdrop-blur-xl border border-emerald-300/40 p-6 sm:p-8 rounded-[2rem] space-y-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            {/* Visual shine card border */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rotate-45 transform translate-x-12 -translate-y-12"></div>
            
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold uppercase mb-6">
                ✅ {settings?.solutionSubtitle || "Solusi Instan Haylofress Ngawi"}
              </div>
              <div className="space-y-6">
                {solutions.map((sol, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="bg-emerald-500/10 p-2.5 rounded-2xl h-fit shrink-0 text-emerald-600">
                      {sol.icon}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-emerald-700 text-base">{sol.title}</h3>
                      <p className="text-slate-700 text-sm mt-1 leading-relaxed">{sol.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-emerald-150 mt-6 flex justify-center">
              <a
                href="#id-katalog"
                className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3.5 px-6 rounded-xl transition duration-300 w-full text-center shadow-lg"
              >
                Coba Praktisnya Sekarang
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
