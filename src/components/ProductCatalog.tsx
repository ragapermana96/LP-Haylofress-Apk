import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle } from 'lucide-react';
import { Category, Product, DynamicCategory } from '../types';
import ProductCard from './ProductCard';

interface ProductCatalogProps {
  onAddToCart: (product: Product, quantity: number) => void;
  products: Product[];
  categories: DynamicCategory[];
  settings: any;
}

export default function ProductCatalog({ onAddToCart, products, categories, settings }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  const catalogLayout = settings?.catalogLayout || 'tabs'; // 'tabs' | 'sections'
  const catalogColumns = settings?.catalogColumns || '4'; // '3' | '4'

  // Map category display names
  const productsWithNames = products.map((prod) => {
    const parentCat = categories.find((c) => c.id === prod.category);
    return {
      ...prod,
      categoryName: parentCat ? parentCat.name : prod.category,
    };
  });

  // Calculate dynamic options for filters
  const filterTabs = [
    { id: 'semua', name: '🔥 Semua Produk' },
    ...categories,
  ];

  // Filtering Logic (for tab layout)
  const filteredProducts = productsWithNames.filter((product) => {
    // Only display visible products to customer
    if (product.visible === false) return false;

    const matchesCategory = selectedCategory === 'semua' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const columnClasses = catalogColumns === '3'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
    : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';

  // Count products across sections to determine if there is search result
  const totalSectionProductsCount = categories.reduce((sum, cat) => {
    const count = productsWithNames.filter((prod) => {
      if (prod.visible === false) return false;
      if (prod.category !== cat.id) return false;
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    }).length;
    return sum + count;
  }, 0);

  // Render individual sections for sections layout
  const renderSectionsLayout = () => {
    return (
      <div className="space-y-12">
        {categories.map((cat) => {
          const sectionProducts = productsWithNames.filter((prod) => {
            if (prod.visible === false) return false;
            if (prod.category !== cat.id) return false;
            
            const matchesSearch =
              prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              prod.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
          });

          if (sectionProducts.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-6 pt-8 border-t border-slate-100 first:border-t-0" id={`cat-sec-${cat.id}`}>
              <div className="flex items-center gap-3">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  {cat.name}
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-mono">
                  {sectionProducts.length} Produk
                </span>
              </div>
              <div className={columnClasses}>
                {sectionProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section id="id-katalog" className="py-20 bg-gradient-to-b from-[#f0f9ff] to-white relative overflow-hidden border-t border-slate-200">
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-blue-200/20 rounded-full blur-[115px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-0 w-80 h-80 bg-emerald-200/20 rounded-full blur-[115px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <span className="text-emerald-700 text-xs sm:text-sm font-extrabold uppercase tracking-widest block font-mono">
            — KATALOG PRODUK PILIHAN —
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 leading-tight">
            Pesan Praktis Hanya Dari Ujung Jari
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Pilih bahan pangan higienis bernutrisi tinggi pilihan Anda di bawah ini. Gabungkan eceran & harga grosir (otomatis aktif eceran beralih ke grosir jika memesan minimal 5 Kg per item)!
          </p>
        </div>

        {/* Filter Controls Bar (Search + Tabs) */}
        <div className="space-y-6 max-w-5xl mx-auto mb-12">
          {/* Search bar inside container */}
          <div className="relative max-w-xl mx-auto bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/60 shadow-lg flex items-center">
            <Search className="w-5 h-5 text-slate-500 ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Cari bagian daging ayam, sapi, fillet dori, kentang wedges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-slate-800 text-sm py-2 px-3 focus:outline-none placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold mr-2 shrink-0 bg-rose-50 px-2 py-1 rounded-md"
              >
                Reset
              </button>
            )}
          </div>

          {/* Categories Tab Pill slider (Only rendering in Tabs layout mode) */}
          {catalogLayout === 'tabs' && (
            <div className="flex justify-start md:justify-center items-center gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar select-none">
              {filterTabs.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-2.5 px-5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 focus:outline-none ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-250 transform scale-102'
                      : 'bg-white/40 backdrop-blur-md border border-white/50 text-slate-700 hover:bg-white/60'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info promo wholesale notice */}
        <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-xl border border-emerald-200/60 p-5 rounded-3xl mb-12 flex gap-4 text-emerald-950 text-xs sm:text-sm leading-relaxed items-start shadow-xl">
          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <strong className="font-extrabold text-emerald-900 block mb-0.5">💡 Cara Dapatkan Harga Grosir Terbaik:</strong>
            Atur kuantitas item dalam ranjang belanja Anda hingga <strong className="font-bold underline text-emerald-800">5 Kg</strong> atau lebih untuk memicu pemotongan harga otomatis. Sangat efisien bagi keluarga besar, arisan, reseller, maupun warung makan/catering!
          </div>
        </div>

        {/* Results Counter / Grid Rendering */}
        {catalogLayout === 'tabs' ? (
          filteredProducts.length > 0 ? (
            <div className={columnClasses}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-100 space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Produk Tidak Ditemukan</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                Maaf, kata kunci atau filter produk "<span className="font-semibold text-emerald-700">{searchQuery}</span>" tidak sesuai dengan produk terdaftar kami. Cobalah kata kunci lainnya!
              </p>
            </div>
          )
        ) : (
          /* Sections Layout */
          totalSectionProductsCount > 0 ? (
            renderSectionsLayout()
          ) : (
            <div className="bg-slate-50 rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-100 space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Produk Tidak Ditemukan</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                Maaf, pencarian produk "<span className="font-semibold text-emerald-700">{searchQuery}</span>" tidak ditemukan di kategori mana pun.
              </p>
            </div>
          )
        )}

      </div>
    </section>
  );
}
