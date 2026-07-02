import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, Percent, Share2 } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [quantityInput, setQuantityInput] = useState<string>('1');

  const quantity = Math.max(1, parseInt(quantityInput, 10) || 1);

  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleIncrement = () => {
    setQuantityInput((prev) => {
      const parsed = parseInt(prev, 10) || 1;
      return (parsed + 1).toString();
    });
  };

  const handleDecrement = () => {
    setQuantityInput((prev) => {
      const parsed = parseInt(prev, 10) || 1;
      return (parsed > 1 ? parsed - 1 : 1).toString();
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuantityInput(val);
  };

  const handleInputBlur = () => {
    const parsed = parseInt(quantityInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      setQuantityInput('1');
    } else {
      setQuantityInput(parsed.toString());
    }
  };

  const [isSharing, setIsSharing] = useState(false);

  const handleAddClick = () => {
    onAddToCart(product, quantity);
    // Reset selection counter to 1 for next add
    setQuantityInput('1');
  };

  const handleShareWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSharing(true);
    
    // Construct target product url
    const productUrl = `${window.location.origin}?p=${product.id}`;
    let shortUrl = productUrl;
    
    try {
      // Try is.gd API first (supports CORS and returns JSON)
      const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(productUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.shorturl) {
          shortUrl = data.shorturl;
        }
      }
    } catch (err) {
      console.warn("is.gd shortening failed, trying tinyurl fallback", err);
      try {
        // Fallback to tinyurl api-create.php
        const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(productUrl)}`);
        if (res.ok) {
          const text = await res.text();
          if (text && text.startsWith('http')) {
            shortUrl = text;
          }
        }
      } catch (err2) {
        console.warn("tinyurl shortening failed, using direct link", err2);
      }
    }

    const priceText = hasDiscount 
      ? `Promo: Rp ${product.priceDiscount.toLocaleString('id-ID')} (Harga normal: Rp ${product.priceNormal.toLocaleString('id-ID')})`
      : `Harga: Rp ${product.priceNormal.toLocaleString('id-ID')}`;

    const text = `Halo! Cek produk segar berkualitas dari *Haylofress Ngawi* ini:\n\n*${product.name}* (${product.unit})\n${priceText}\n\nBeli/Pesan sekarang melalui tautan cepat berikut:\n👉 ${shortUrl}`;
    
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    setIsSharing(false);
  };

  // Check if discount is entered/filled
  const hasDiscount = typeof product.priceDiscount === 'number' && product.priceDiscount > 0;

  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-200/10 hover:bg-white/60 transition-all duration-300 flex flex-col justify-between group h-full">
      {/* Product Image and Badges */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Category Label */}
        <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {product.categoryName || product.category}
        </span>

        {/* Discount Badge on Image (Only if hasDiscount is true) */}
        {hasDiscount && (
          <span className="absolute top-4 right-4 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full bg-rose-500 text-white flex items-center gap-1 shadow-md">
            <Percent className="w-3 h-3" />
            Promo / Diskon
          </span>
        )}
      </div>

      {/* Product Info Section */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-snug group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>
          <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 h-8">
            {product.description}
          </p>
        </div>

        {/* Pricing Area: Normal & Strikethrough Discount Prices */}
        <div className="bg-white/70 backdrop-blur-md border border-slate-100 p-3.5 py-3 rounded-2xl shadow-sm">
          {hasDiscount ? (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Harga Promo</span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-lg font-black text-rose-600 font-sans tracking-tight">
                  {formatIDR(product.priceDiscount)}
                  <span className="text-xs font-normal text-slate-400">/{product.unit}</span>
                </span>
                <span className="line-through text-xs font-bold text-slate-400 font-sans">
                  {formatIDR(product.priceNormal)}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Harga Satuan</span>
              <div className="flex items-baseline">
                <span className="text-lg font-black text-slate-800 font-sans tracking-tight">
                  {formatIDR(product.priceNormal)}
                  <span className="text-xs font-normal text-slate-400">/{product.unit}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Counter and Add Button Panel */}
        <div className="space-y-3 pt-1">
          {/* Quantity Counter */}
          <div className="flex items-center justify-between border border-white/60 p-1.5 rounded-2xl bg-white/50 backdrop-blur-md shadow-sm">
            <span className="text-xs font-semibold text-slate-500 pl-2">Jumlah:</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-950 hover:border-slate-300 transition duration-150 focus:outline-none"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                type="number"
                min="1"
                value={quantityInput}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                className="w-14 h-8 text-center bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-1"
                placeholder="Qty"
              />
              <button
                type="button"
                onClick={handleIncrement}
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-white hover:text-emerald-600 hover:border-emerald-200 transition duration-150 focus:outline-none"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Action Buttons: Add to Cart and Share to WA side-by-side */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddClick}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-3 rounded-2xl shadow-lg hover:scale-[1.01] transition-all duration-300 h-11 text-xs cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-100" />
              <span>+ Keranjang</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isSharing}
              className="px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold rounded-2xl shadow-sm transition-all duration-300 h-11 text-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              title="Bagikan ke WhatsApp"
            >
              {isSharing ? (
                <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Share2 className="w-4 h-4 text-emerald-600" />
              )}
              <span className="hidden sm:inline">Bagikan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
