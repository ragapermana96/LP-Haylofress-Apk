import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Trash2, ShoppingBag, User, MapPin, Sparkles, Check, Send, Store, Users, Home } from 'lucide-react';
import { CartItem, CustomerInfo, getProductPriceDetail } from '../types';
import { trackPixelEvent } from '../lib/pixel';

interface CartItemQuantityInputProps {
  quantity: number;
  onUpdateQuantity: (newQty: number) => void;
}

function CartItemQuantityInput({ quantity, onUpdateQuantity }: CartItemQuantityInputProps) {
  const [inputValue, setInputValue] = useState(quantity.toString());

  React.useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateQuantity(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed <= 0) {
      setInputValue(quantity.toString());
    } else if (parsed !== quantity) {
      onUpdateQuantity(parsed);
    }
  };

  return (
    <input
      type="number"
      min="1"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-10 text-center bg-transparent border-0 text-xs font-bold text-slate-950 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
    />
  );
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  settings?: any;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  settings,
}: CartDrawerProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
    notes: '',
    buyerType: 'rumah_tangga',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Track InitiateCheckout on open
  useEffect(() => {
    if (isOpen && cart.length > 0) {
      const cartTotal = cart.reduce((sum, item) => {
        const priceDetail = getProductPriceDetail(item.product, item.quantity);
        return sum + priceDetail.price * item.quantity;
      }, 0);
      
      trackPixelEvent('InitiateCheckout', {
        value: cartTotal,
        currency: 'IDR',
        num_items: cart.length,
        content_type: 'product_group'
      });
    }
  }, [isOpen, cart.length]);

  const formatIDR = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Calculations
  const cartSummary = cart.reduce(
    (acc, item) => {
      const priceDetail = getProductPriceDetail(item.product, item.quantity);
      const unitPrice = priceDetail.price;
      const originalPrice = item.product.priceNormal;

      acc.totalQuantity += item.quantity;
      acc.totalWeight += item.quantity; // Assuming 1 unit = 1 Kg/Pack as indicated by data
      acc.subtotalOriginal += originalPrice * item.quantity;
      acc.subtotalActual += unitPrice * item.quantity;
      acc.savings += (originalPrice - unitPrice) * item.quantity;

      return acc;
    },
    { totalQuantity: 0, totalWeight: 0, subtotalOriginal: 0, subtotalActual: 0, savings: 0 }
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
    if (validationError) setValidationError(null);
  };

  const handleBuyerTypeSelect = (type: 'rumah_tangga' | 'umkm' | 'reseller') => {
    setCustomerInfo((prev) => ({ ...prev, buyerType: type }));
  };

  const executeCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerInfo.name.trim()) {
      setValidationError('Silakan masukkan Nama Lengkap Anda.');
      return;
    }
    if (!customerInfo.phone.trim()) {
      setValidationError('Silakan masukkan Nomor WhatsApp Anda yang aktif.');
      return;
    }
    if (!customerInfo.address.trim()) {
      setValidationError('Silakan masukkan Alamat Pengiriman Lengkap Anda di Ngawi.');
      return;
    }

    // WA Compilation
    const waNumber = settings?.waNumber || '6281234567890'; // Dynamic admin WhatsApp number
    const buyerTypeLabel =
      customerInfo.buyerType === 'rumah_tangga'
        ? 'Rumah Tangga'
        : customerInfo.buyerType === 'umkm'
        ? 'UMKM Kuliner / Warung'
        : 'Reseller / Agen';

    let itemLines = '';
    cart.forEach((item, index) => {
      const priceDetail = getProductPriceDetail(item.product, item.quantity);
      const unitPrice = priceDetail.price;
      const sub = unitPrice * item.quantity;

      itemLines += `${index + 1}. *${item.product.name}* (${item.quantity} ${item.product.unit})\n`;
      if (priceDetail.type !== 'normal') {
        itemLines += `   Harga: Rp ${unitPrice.toLocaleString('id-ID')} / ${item.product.unit} (Aktif: ${priceDetail.label})\n`;
      } else {
        itemLines += `   Harga: Rp ${item.product.priceNormal.toLocaleString('id-ID')} / ${item.product.unit}\n`;
      }
      itemLines += `   Subtotal: Rp ${sub.toLocaleString('id-ID')}\n\n`;
    });

    const titleMessage = `*PESANAN BARU - HAYLOFRESS NGAWI*`;
    const customerBlock = `*DATA PELANGGAN:*
👤 Nama: ${customerInfo.name}
📱 WhatsApp: ${customerInfo.phone}
🏠 Alamat: ${customerInfo.address}
🏬 Tipe Mitra: ${buyerTypeLabel}
📝 Catatan: ${customerInfo.notes.trim() ? customerInfo.notes : '-'}`;

    const cartBlock = `*RINCIAN DAFTAR PESANAN:*
${itemLines}`;

    const summaryBlock = `*RINGKASAN BELANJA:*
Total Barang: ${cartSummary.totalQuantity} item
Total Berat: ~${cartSummary.totalWeight} Kg
Total Hemat Diskon: Rp ${cartSummary.savings.toLocaleString('id-ID')}

*TOTAL PEMBAYARAN: ${formatIDR(cartSummary.subtotalActual)}*

-----------------------------------------
⏱️ _Mohon konfirmasi ketersediaan barang dan estimasi waktu pengiriman kurir. Terima kasih!_`;

    const fullMessage = `${titleMessage}\n\n${customerBlock}\n\n${cartBlock}${summaryBlock}`;
    const encodedMessage = encodeURIComponent(fullMessage);
    const waUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;

    // Track standard conversion event 'Purchase' for Meta Pixel & Analytics DB
    trackPixelEvent('Purchase', {
      value: cartSummary.subtotalActual,
      currency: 'IDR',
      num_items: cart.length,
      content_ids: cart.map(item => item.product.id),
      buyer_type: customerInfo.buyerType,
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      customer_address: customerInfo.address,
      customer_notes: customerInfo.notes,
      items: cart.map(item => {
        const priceDetail = getProductPriceDetail(item.product, item.quantity);
        return {
          productId: item.product.id,
          name: item.product.name,
          unit: item.product.unit,
          quantity: item.quantity,
          price: priceDetail.price,
          subtotal: priceDetail.price * item.quantity
        };
      })
    });

    // Clear cart and redirect
    onClearCart();
    onClose();
    window.open(waUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-white/80 backdrop-blur-2xl border-l border-white/60 shadow-2xl z-50 flex flex-col justify-between overflow-hidden"
          >
            {/* Header section inside panel */}
            <div className="p-5 border-b border-white/60 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800">Keranjang Belanja</h2>
                  <p className="text-xs text-slate-500">
                    Sistem otomatis menghitung harga ecer & grosir.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 hover:text-slate-700 transition"
                aria-label="Tutup Keranjang"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrolling item and form area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-8">
              {cart.length > 0 ? (
                <>
                  {/* Free Delivery Promo Bar */}
                  {cartSummary.totalWeight >= 10 ? (
                    <div className="bg-emerald-50/85 backdrop-blur-md border border-emerald-200/80 text-emerald-950 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start shadow-sm">
                      <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-pulse" />
                      <div>
                        <strong className="font-extrabold text-emerald-900">🎉 Selamat, Bebas Ongkir Aktif!</strong>
                        <p className="text-slate-650 mt-0.5">Berat total belanja Anda sudah mencapai {cartSummary.totalWeight} Kg. Gratis ongkir area Ngawi Kota!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/85 backdrop-blur-md border border-amber-200/80 text-amber-950 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start shadow-sm">
                      <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <strong className="font-extrabold text-amber-900">Delivery Promo:</strong>
                        <p className="text-slate-650 mt-0.5">Tambahkan <strong className="font-semibold text-amber-850">{10 - cartSummary.totalWeight} Kg</strong> produk segar lagi untuk klaim Free Ongkir Ngawi Kota!</p>
                      </div>
                    </div>
                  )}

                  {/* Cart Items List */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider block font-mono">
                      Daftar Produk ({cart.length})
                    </h3>
                    <div className="space-y-3.5">
                      {cart.map((item) => {
                        const priceDetail = getProductPriceDetail(item.product, item.quantity);
                        const originalPrice = item.product.priceNormal;
                        const actualPrice = priceDetail.price;
                        const subtotal = actualPrice * item.quantity;
                        const isDiscounted = priceDetail.type !== 'normal';

                        return (
                          <div
                            key={item.product.id}
                            className="flex gap-4 p-3.5 bg-white/60 backdrop-blur-xl border border-white/65 rounded-2xl items-center justify-between shadow-sm"
                          >
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-14 h-14 rounded-xl object-cover bg-white border border-slate-200 flex-shrink-0"
                            />
                            
                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="font-extrabold text-slate-800 text-sm truncate">
                                {item.product.name}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                                <span className={isDiscounted ? 'line-through text-slate-400' : 'font-semibold text-slate-700'}>
                                  {formatIDR(originalPrice)}
                                </span>
                                {isDiscounted && (
                                  <span className="text-emerald-800 font-extrabold bg-emerald-100/80 px-1.5 py-0.5 rounded text-[10px]">
                                    {priceDetail.label}: {formatIDR(actualPrice)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="flex items-center gap-2 bg-white/70 border border-white/80 rounded-lg p-1 shadow-sm backdrop-blur-sm">
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                  className="p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <CartItemQuantityInput
                                  quantity={item.quantity}
                                  onUpdateQuantity={(newQty) => onUpdateQuantity(item.product.id, newQty)}
                                />
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                  className="p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-slate-900">
                                  {formatIDR(subtotal)}
                                </span>
                                <button
                                  onClick={() => onRemoveItem(item.product.id)}
                                  className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                                  aria-label="Hapus item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer Form Area */}
                  <div className="border-t border-slate-200/60 pt-6 space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider block font-mono flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Form Informasi Pengiriman</span>
                    </h3>

                    {validationError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-shake">
                        <span>⚠️</span>
                        <span>{validationError}</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Name & WhatsApp Fields Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">
                            Nama Lengkap Penerima <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={customerInfo.name}
                            onChange={handleInputChange}
                            placeholder="Contoh: Ibu Ani Rahmawati"
                            className="w-full bg-white/50 backdrop-blur-md border border-slate-200/70 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition shadow-inner"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 block">
                            No. WhatsApp Penerima <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={customerInfo.phone}
                            onChange={handleInputChange}
                            placeholder="Contoh: 0812345678"
                            className="w-full bg-white/50 backdrop-blur-md border border-slate-200/70 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition shadow-inner"
                          />
                        </div>
                      </div>

                      {/* Buyer Type Option Slots */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Jenis Pembeli / Profil Keperluan <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => handleBuyerTypeSelect('rumah_tangga')}
                            className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1.5 transition ${
                              customerInfo.buyerType === 'rumah_tangga'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                                : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Home className="w-4 h-4" />
                            <span>Rumah Tangga</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBuyerTypeSelect('umkm')}
                            className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1.5 transition ${
                              customerInfo.buyerType === 'umkm'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                                : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Store className="w-4 h-4" />
                            <span>UMKM Kuliner</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBuyerTypeSelect('reseller')}
                            className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1.5 transition ${
                              customerInfo.buyerType === 'reseller'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                                : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Users className="w-4 h-4" />
                            <span>Reseller/Agen</span>
                          </button>
                        </div>
                      </div>

                      {/* Complete Delivery Address */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          Alamat Pengiriman di Ngawi <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          name="address"
                          value={customerInfo.address}
                          onChange={handleInputChange}
                          rows={2}
                          placeholder="Nama jalan, nama perumahan, gang, nomor rumah, RT/RW, kelurahan/kecamatan di Kabupaten Ngawi."
                          className="w-full bg-white/50 backdrop-blur-md border border-slate-200/70 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition resize-none shadow-inner"
                        />
                      </div>

                      {/* Custom notes */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 block">
                          Catatan Khusus <span className="text-slate-400">(Opsional)</span>
                        </label>
                        <input
                          type="text"
                          name="notes"
                          value={customerInfo.notes}
                          onChange={handleInputChange}
                          placeholder="Misal: 'Potong ayam utuh jadi 10 bagian', 'antar jam 10 pagi'"
                          className="w-full bg-white/50 backdrop-blur-md border border-slate-200/70 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="h-16 w-16 bg-white/50 backdrop-blur-md border border-white/50 rounded-full flex items-center justify-center text-slate-400 mx-auto shadow-md">
                    <ShoppingBag className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base">Keranjang Kosong</h3>
                  <p className="text-slate-500 text-xs sm:text-sm max-w-xs mx-auto leading-relaxed">
                    Belum ada daging segar atau bumbu beku yang dipilih ke dalam troli Anda. Sila jelajahi katalog kami di bawah ini!
                  </p>
                  <button
                    onClick={onClose}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl shadow-md transition-all duration-350 cursor-pointer"
                  >
                    Mulai Belanja Sekarang
                  </button>
                </div>
              )}
            </div>

            {/* Bottom calculation and check CTA bar */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-white/60 bg-white/50 backdrop-blur-xl space-y-4 sticky bottom-0 z-10 shadow-lg">
                {/* Math values breakdown */}
                <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Subtotal Berat:</span>
                    <span className="font-bold text-slate-800">~{cartSummary.totalWeight} Kg</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-850 bg-emerald-50/80 border border-emerald-100 p-2.5 rounded-xl text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Total Hemat Grosir:
                    </span>
                    <span className="font-bold">-{formatIDR(cartSummary.savings)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200/50">
                    <span>Total Pembayaran:</span>
                    <span className="text-lg text-emerald-600 font-extrabold">{formatIDR(cartSummary.subtotalActual)}</span>
                  </div>
                </div>

                {/* Final WhatsApp trigger button */}
                <button
                  type="button"
                  onClick={executeCheckout}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-emerald-600/35 hover:shadow-xl transition-all duration-350 flex items-center justify-center gap-2 text-base cursor-pointer"
                >
                  <Send className="w-5 h-5 animate-bounce" />
                  <span>Kirim Pesanan Ke WhatsApp</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
