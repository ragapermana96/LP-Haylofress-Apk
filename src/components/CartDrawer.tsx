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
  customerInfo: CustomerInfo;
  onCustomerInfoChange: (info: CustomerInfo) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  settings,
  customerInfo,
  onCustomerInfoChange,
}: CartDrawerProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

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

  // Calculate dynamic distance-based shipping cost
  const isShippingEnabled = settings?.enableDistanceShipping === true;
  const isKurirTokoActive = settings?.shippingServiceKurirTokoActive !== false;
  const isKurirLuarActive = settings?.shippingServiceKurirLuarActive !== false;
  const selectedService = customerInfo.shippingService || (isKurirTokoActive ? 'kurir_toko' : isKurirLuarActive ? 'kurir_luar' : 'kurir_toko');
  const shippingServiceLabelText = selectedService === 'kurir_luar' ? 'Kurir Luar' : 'Kurir Toko';
  const distanceVal = parseFloat(customerInfo.distance || '0') || 0;
  
  const subMinWeight = settings?.shippingSubsidyMinWeight !== undefined ? Number(settings.shippingSubsidyMinWeight) : 10;
  const subWeightVal = settings?.shippingSubsidyWeightValue !== undefined ? Number(settings.shippingSubsidyWeightValue) : 5000;
  const subMinAmount = settings?.shippingSubsidyMinAmount !== undefined ? Number(settings.shippingSubsidyMinAmount) : 150000;
  const subAmountVal = settings?.shippingSubsidyAmountValue !== undefined ? Number(settings.shippingSubsidyAmountValue) : 10000;
  const freeWholesaleWeight = settings?.shippingFreeWholesaleWeight !== undefined ? Number(settings.shippingFreeWholesaleWeight) : 150;

  let baseShippingCost = 0;
  if (isShippingEnabled && distanceVal > 0) {
    const calcType = settings?.shippingCalcType || 'per_km';
    if (calcType === 'per_km') {
      const costPerKm = settings?.shippingCostPerKm !== undefined ? Number(settings.shippingCostPerKm) : 2000;
      const minCost = settings?.shippingMinCost !== undefined ? Number(settings.shippingMinCost) : 5000;
      baseShippingCost = Math.max(minCost, distanceVal * costPerKm);
    } else {
      // Tiered calculation
      const t1Max = settings?.shippingTier1Max !== undefined ? Number(settings.shippingTier1Max) : 3;
      const t1Cost = settings?.shippingTier1Cost !== undefined ? Number(settings.shippingTier1Cost) : 5000;
      const t2Max = settings?.shippingTier2Max !== undefined ? Number(settings.shippingTier2Max) : 7;
      const t2Cost = settings?.shippingTier2Cost !== undefined ? Number(settings.shippingTier2Cost) : 10000;
      const t3Max = settings?.shippingTier3Max !== undefined ? Number(settings.shippingTier3Max) : 15;
      const t3Cost = settings?.shippingTier3Cost !== undefined ? Number(settings.shippingTier3Cost) : 20000;
      
      if (distanceVal <= t1Max) baseShippingCost = t1Cost;
      else if (distanceVal <= t2Max) baseShippingCost = t2Cost;
      else baseShippingCost = t3Cost;
    }
  }

  const isWholesaleFree = cartSummary.totalWeight >= freeWholesaleWeight && freeWholesaleWeight < 99999;
  
  const isWeightSubsidyActive = cartSummary.totalWeight >= subMinWeight && subMinWeight < 9999;
  const isAmountSubsidyActive = cartSummary.subtotalActual >= subMinAmount && subMinAmount < 9999999;

  const subsidyWeight = isWeightSubsidyActive ? subWeightVal : 0;
  const subsidyAmount = isAmountSubsidyActive ? subAmountVal : 0;

  const appliedSubsidy = Math.max(subsidyWeight, subsidyAmount);

  let shippingCost = 0;
  let appliedSubsidyAmount = 0;

  if (isShippingEnabled && distanceVal > 0) {
    if (isWholesaleFree) {
      shippingCost = 0;
      appliedSubsidyAmount = baseShippingCost;
    } else {
      appliedSubsidyAmount = Math.min(baseShippingCost, appliedSubsidy);
      shippingCost = Math.max(0, baseShippingCost - appliedSubsidyAmount);
    }
  }

  const grandTotal = cartSummary.subtotalActual + shippingCost;

  // Helper to extract coordinates from Google Maps URL
  const extractCoords = (url: string) => {
    if (!url) return null;
    const regexAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const matchAt = url.match(regexAt);
    if (matchAt) {
      return { lat: parseFloat(matchAt[1]), lng: parseFloat(matchAt[2]) };
    }
    const regexQLlDir = /[?&](q|ll|dir)=?(-?\d+\.\d+),(-?\d+\.\d+)/;
    const matchQLlDir = url.match(regexQLlDir);
    if (matchQLlDir) {
      return { lat: parseFloat(matchQLlDir[2]), lng: parseFloat(matchQLlDir[3]) };
    }
    const regexRaw = /\/(-?\d+\.\d+),(-?\d+\.\d+)/;
    const matchRaw = url.match(regexRaw);
    if (matchRaw) {
      return { lat: parseFloat(matchRaw[1]), lng: parseFloat(matchRaw[2]) };
    }
    return null;
  };

  // Helper to calculate distance in Km using Haversine formula
  const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return Math.round(d * 10) / 10; // round to 1 decimal place (e.g. 3.5)
  };

  const getStoreCoords = () => {
    const coordsStr = settings?.shippingStoreCoords || '-7.402123, 111.445281';
    const parts = coordsStr.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return { lat: -7.402123, lng: 111.445281 }; // default fallback (Ngawi Central)
  };

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      setLocatingError('Geolokasi tidak didukung oleh browser Anda.');
      return;
    }
    setIsLocating(true);
    setLocatingError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const storeCoords = getStoreCoords();
        const dist = calculateHaversine(latitude, longitude, storeCoords.lat, storeCoords.lng);
        
        onCustomerInfoChange({
          ...customerInfo,
          mapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
          distance: dist.toString()
        });
        setIsLocating(false);
      },
      (error) => {
        console.error("Gagal mendeteksi lokasi GPS:", error);
        let errorMsg = 'Gagal mendeteksi lokasi Anda.';
        if (error.code === 1) {
          errorMsg = 'Izin lokasi ditolak. Silakan izinkan akses lokasi di browser Anda atau salin link Google Maps secara manual.';
        } else if (error.code === 2) {
          errorMsg = 'Posisi tidak dapat ditentukan.';
        } else if (error.code === 3) {
          errorMsg = 'Waktu permintaan habis.';
        }
        setLocatingError(errorMsg);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'mapsLink') {
      const coords = extractCoords(value);
      if (coords) {
        const storeCoords = getStoreCoords();
        const dist = calculateHaversine(coords.lat, coords.lng, storeCoords.lat, storeCoords.lng);
        onCustomerInfoChange({ 
          ...customerInfo, 
          mapsLink: value,
          distance: dist.toString()
        });
        if (validationError) setValidationError(null);
        return;
      }
    }
    
    onCustomerInfoChange({ ...customerInfo, [name]: value });
    if (validationError) setValidationError(null);
  };

  const handleBuyerTypeSelect = (type: 'rumah_tangga' | 'umkm' | 'reseller') => {
    onCustomerInfoChange({ ...customerInfo, buyerType: type });
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
    if (isShippingEnabled && !isWholesaleFree && (!customerInfo.distance || parseFloat(customerInfo.distance) <= 0)) {
      setValidationError('Silakan masukkan estimasi jarak pengiriman (Km) yang valid.');
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

    const mapsLinkLine = customerInfo.mapsLink?.trim() ? `🗺️ Google Maps: ${customerInfo.mapsLink.trim()}\n` : '';
    const distanceLine = isShippingEnabled ? `🛵 Jarak Kirim: ${distanceVal} Km\n🚚 Jasa Kirim: ${shippingServiceLabelText}\n` : '';

    const titleMessage = `*PESANAN BARU - HAYLOFRESS NGAWI*`;
    const customerBlock = `*DATA PELANGGAN:*
👤 Nama: ${customerInfo.name}
📱 WhatsApp: ${customerInfo.phone}
🏠 Alamat: ${customerInfo.address}
${mapsLinkLine}${distanceLine}🏬 Tipe Mitra: ${buyerTypeLabel}
📝 Catatan: ${customerInfo.notes.trim() ? customerInfo.notes : '-'}`;

    const cartBlock = `*RINCIAN DAFTAR PESANAN:*
${itemLines}`;

    const shippingBreakdown = isShippingEnabled 
      ? `Subtotal Belanja: ${formatIDR(cartSummary.subtotalActual)}\n🚚 Ongkir (${shippingServiceLabelText}): ${
          isWholesaleFree 
            ? 'GRATIS (Promo Grosir)' 
            : appliedSubsidyAmount > 0 
              ? `${shippingCost === 0 ? 'GRATIS' : formatIDR(shippingCost)} (Subsidi Aktif: -${formatIDR(appliedSubsidyAmount)})`
              : formatIDR(shippingCost)
        }\n`
      : '';

    const summaryBlock = `*RINGKASAN BELANJA:*
Total Barang: ${cartSummary.totalQuantity} item
Total Berat: ~${cartSummary.totalWeight} Kg
Total Hemat Diskon: Rp ${cartSummary.savings.toLocaleString('id-ID')}
${shippingBreakdown}
*TOTAL PEMBAYARAN: ${formatIDR(grandTotal)}*

-----------------------------------------
⏱️ _Mohon konfirmasi ketersediaan barang dan estimasi waktu pengiriman kurir. Terima kasih!_`;

    const fullMessage = `${titleMessage}\n\n${customerBlock}\n\n${cartBlock}${summaryBlock}`;
    const encodedMessage = encodeURIComponent(fullMessage);
    const waUrl = `https://wa.me/${waNumber}?text=${encodedMessage}`;

    // Track standard conversion event 'Purchase' for Meta Pixel & Analytics DB
    trackPixelEvent('Purchase', {
      value: grandTotal,
      currency: 'IDR',
      num_items: cart.length,
      content_ids: cart.map(item => item.product.id),
      buyer_type: customerInfo.buyerType,
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      customer_address: customerInfo.address,
      customer_notes: customerInfo.notes,
      customer_maps_link: customerInfo.mapsLink || '',
      customer_distance: distanceVal,
      customer_shipping_cost: shippingCost,
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
                  {isWholesaleFree ? (
                    <div className="bg-emerald-50/85 backdrop-blur-md border border-emerald-200/80 text-emerald-950 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start shadow-sm">
                      <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-pulse" />
                      <div>
                        <strong className="font-extrabold text-emerald-900">🎉 Selamat, Bebas Ongkir Grosir Aktif!</strong>
                        <p className="text-slate-650 mt-0.5">Berat total belanja Anda ({cartSummary.totalWeight.toFixed(1)} Kg) sudah mencapai batas grosir (≥ {freeWholesaleWeight} Kg). Gratis ongkir 100% area Ngawi!</p>
                      </div>
                    </div>
                  ) : appliedSubsidy > 0 ? (
                    <div className="bg-sky-50/85 backdrop-blur-md border border-sky-200/80 text-sky-950 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start shadow-sm">
                      <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <strong className="font-extrabold text-sky-900">🎁 Subsidi Ongkir Aktif!</strong>
                        <p className="text-slate-650 mt-0.5">Anda mendapat subsidi ongkir sebesar <strong className="font-extrabold text-emerald-800">{formatIDR(appliedSubsidy)}</strong>. Tambah {(freeWholesaleWeight - cartSummary.totalWeight).toFixed(1)} Kg lagi untuk <strong>Bebas Ongkir Grosir 100%!</strong></p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50/85 backdrop-blur-md border border-amber-200/80 text-amber-950 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start shadow-sm">
                      <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <strong className="font-extrabold text-amber-900">Promo Pengiriman:</strong>
                        <p className="text-slate-650 mt-0.5">Tambahkan <strong className="font-semibold text-amber-850">{(subMinWeight - cartSummary.totalWeight).toFixed(1)} Kg</strong> lagi untuk klaim subsidi ongkir {formatIDR(subWeightVal)}!</p>
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

                      {/* Google Maps Link */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>Link Google Maps <span className="text-slate-400">(Sangat Direkomendasikan)</span></span>
                          <a
                            href="https://maps.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            Buka Maps 🗺️
                          </a>
                        </label>
                        <input
                          type="url"
                          name="mapsLink"
                          value={customerInfo.mapsLink || ''}
                          onChange={handleInputChange}
                          placeholder="Salin/paste link lokasi Google Maps di sini (Contoh: https://maps.app.goo.gl/...)"
                          className="w-full bg-white/50 backdrop-blur-md border border-slate-200/70 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition shadow-inner"
                        />
                        
                        {/* Auto GPS detector button */}
                        {isShippingEnabled && (
                          <div className="pt-1.5 space-y-1.5">
                            <button
                              type="button"
                              onClick={handleGPSLocation}
                              disabled={isLocating}
                              className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                                isLocating 
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              <MapPin className={`w-3.5 h-3.5 text-emerald-600 ${isLocating ? 'animate-bounce' : ''}`} />
                              <span>{isLocating ? 'Sedang Mendeteksi GPS Anda...' : '📍 Gunakan GPS Lokasi Saya (Otomatis & Akurat)'}</span>
                            </button>
                            
                            {locatingError && (
                              <p className="text-[10px] text-rose-600 font-bold block">{locatingError}</p>
                            )}

                            {customerInfo.mapsLink && extractCoords(customerInfo.mapsLink) && (
                              <p className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1 block">
                                <Check className="w-3 h-3 text-emerald-650 shrink-0" />
                                <span>Sistem berhasil melacak koordinat & menghitung jarak otomatis!</span>
                              </p>
                            )}
                            
                            {!customerInfo.mapsLink && (
                              <p className="text-[9px] text-slate-400 block leading-relaxed">
                                💡 Klik tombol GPS di atas untuk melacak koordinat & mengisi kolom jarak otomatis, atau Anda juga bisa mengetikkan jarak secara manual di bawah.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Shipping Distance Input (Only if enabled in settings) */}
                      {isShippingEnabled && (
                        <div className="space-y-1.5 bg-amber-50/40 p-3.5 rounded-2xl border border-amber-100 animate-fade-in text-left">
                          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                            <span>Estimasi Jarak Pengiriman <span className="text-rose-500">*</span></span>
                            <span className="text-[10px] text-amber-700 font-extrabold">
                              {settings?.shippingCalcType === 'per_km'
                                ? `Tarif: Rp ${Number(settings.shippingCostPerKm).toLocaleString('id-ID')}/Km (Min: Rp ${Number(settings.shippingMinCost).toLocaleString('id-ID')})`
                                : `Tarif Flat Sesuai Jarak`
                              }
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              name="distance"
                              min="0"
                              step="0.1"
                              value={customerInfo.distance || ''}
                              onChange={handleInputChange}
                              placeholder="Masukkan jarak rumah Anda dari toko (Contoh: 3.5)"
                              className="w-full bg-white/70 backdrop-blur-md border border-slate-200/70 rounded-xl pl-4 pr-12 py-2.5 text-sm font-bold focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition shadow-inner font-mono text-slate-900"
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-xs font-black text-slate-400 font-mono">
                              KM
                            </div>
                          </div>
                          
                          {/* Live shipping cost summary message */}
                          {distanceVal > 0 ? (
                            <div className="text-[10px] text-slate-500 font-medium mt-1 space-y-0.5">
                              {isWholesaleFree ? (
                                <span className="text-emerald-700 font-extrabold block">
                                  🎉 Gratis Ongkir Grosir Aktif (Berat ≥ {freeWholesaleWeight} Kg)
                                </span>
                              ) : appliedSubsidyAmount > 0 ? (
                                <div className="block">
                                  <span className="text-sky-700 font-extrabold block">
                                    🎁 Dapat Subsidi Ongkir: -{formatIDR(appliedSubsidyAmount)}
                                  </span>
                                  <span>
                                    Estimasi Ongkir ({shippingServiceLabelText}) setelah subsidi: <strong className="text-emerald-600 font-extrabold font-mono">{formatIDR(shippingCost)}</strong> <span className="text-slate-400 font-normal line-through">({formatIDR(baseShippingCost)})</span>
                                  </span>
                                </div>
                              ) : (
                                <span className="block">Estimasi Ongkos Kirim ({shippingServiceLabelText}): <strong className="text-emerald-600 font-extrabold font-mono">{formatIDR(shippingCost)}</strong></span>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-amber-600 font-semibold mt-1 block">
                              Silakan masukkan estimasi jarak (Km) untuk menghitung ongkir.
                            </p>
                          )}
                        </div>
                      )}

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
                {/* Promo Subsidi & Gratis Ongkir Grosir Banner */}
                {isShippingEnabled && (
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed transition-all duration-350 ${
                    isWholesaleFree 
                      ? 'bg-emerald-50/90 border-emerald-200/60 text-emerald-900 shadow-sm'
                      : appliedSubsidy > 0
                        ? 'bg-sky-50 border-sky-200/60 text-sky-950 shadow-sm bg-sky-50/90'
                        : 'bg-amber-50/85 border-amber-200/50 text-slate-850 shadow-inner'
                  }`}>
                    {isWholesaleFree ? (
                      <div className="flex items-start gap-2.5">
                        <span className="text-base shrink-0">🎉</span>
                        <div>
                          <p className="font-extrabold text-emerald-800 text-[11px] uppercase tracking-wider">Selamat! Anda Dapat Gratis Ongkir Grosir</p>
                          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                            Total berat pesanan Anda ({cartSummary.totalWeight} Kg) telah memenuhi kriteria gratis ongkir grosir penuh (≥ {freeWholesaleWeight} Kg). Ongkos kirim Anda Rp 0!
                          </p>
                        </div>
                      </div>
                    ) : appliedSubsidy > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2.5">
                          <span className="text-base shrink-0">🎁</span>
                          <div className="flex-1">
                            <p className="font-extrabold text-sky-850 text-[11px] uppercase tracking-wider">Subsidi Ongkir Aktif!</p>
                            <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                              Anda mendapat potongan ongkir sebesar <strong className="text-emerald-700 font-black">{formatIDR(appliedSubsidy)}</strong> karena memenuhi syarat {isWeightSubsidyActive && isAmountSubsidyActive ? 'berat paket & nominal belanja' : isWeightSubsidyActive ? `berat paket (≥ ${subMinWeight} Kg)` : `nominal belanja (≥ ${formatIDR(subMinAmount)})`}.
                            </p>
                          </div>
                        </div>
                        {/* Progress to Wholesale Free Shipping */}
                        {freeWholesaleWeight < 99999 && (
                          <div className="pt-2 border-t border-sky-100/50 space-y-1">
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed flex justify-between">
                              <span>Kejar <strong>Gratis Ongkir Grosir (100%)</strong>:</span>
                              <span className="font-bold text-emerald-700">Kurang {(freeWholesaleWeight - cartSummary.totalWeight).toFixed(1)} Kg lagi</span>
                            </p>
                            <div className="w-full bg-slate-200/55 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                                style={{ width: `${Math.min(100, (cartSummary.totalWeight / freeWholesaleWeight) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2.5">
                          <span className="text-base shrink-0">💡</span>
                          <div className="flex-1">
                            <p className="font-extrabold text-amber-850 text-[11px] uppercase tracking-wider">Penawaran Subsidi Ongkos Kirim</p>
                            <p className="text-[10px] text-slate-650 font-medium mt-0.5 leading-relaxed">
                              {subMinWeight < 9999 && subMinAmount < 9999999 ? (
                                <span>
                                  Tambah <strong className="text-amber-850 font-extrabold">{(subMinWeight - cartSummary.totalWeight).toFixed(1)} Kg</strong> lagi untuk subsidi <strong className="text-emerald-700 font-extrabold">{formatIDR(subWeightVal)}</strong> ATAU belanja <strong className="text-amber-800 font-extrabold">{formatIDR(subMinAmount - cartSummary.subtotalActual)}</strong> lagi untuk subsidi <strong className="text-emerald-700 font-extrabold">{formatIDR(subAmountVal)}</strong>!
                                </span>
                              ) : subMinWeight < 9999 ? (
                                <span>
                                  Tambah <strong className="text-amber-800 font-extrabold">{(subMinWeight - cartSummary.totalWeight).toFixed(1)} Kg</strong> lagi untuk mendapat subsidi <strong className="text-emerald-700 font-extrabold">{formatIDR(subWeightVal)}</strong>!
                                </span>
                              ) : (
                                <span>
                                  Belanja <strong className="text-amber-800 font-extrabold">{formatIDR(subMinAmount - cartSummary.subtotalActual)}</strong> lagi untuk mendapat subsidi <strong className="text-emerald-700 font-extrabold">{formatIDR(subAmountVal)}</strong>!
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {/* Progress bar to nearest subsidy */}
                        {(() => {
                          const progressWeight = subMinWeight < 9999 ? (cartSummary.totalWeight / subMinWeight) * 100 : 0;
                          const progressAmount = subMinAmount < 9999999 ? (cartSummary.subtotalActual / subMinAmount) * 100 : 0;
                          const bestProgress = Math.min(99.9, Math.max(progressWeight, progressAmount));
                          if (bestProgress > 0) {
                            return (
                              <div className="w-full bg-slate-200/55 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="bg-amber-500 h-full transition-all duration-500 rounded-full"
                                  style={{ width: `${bestProgress}%` }}
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Math values breakdown */}
                <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Subtotal Berat:</span>
                    <span className="font-bold text-slate-800">~{cartSummary.totalWeight.toFixed(1)} Kg</span>
                  </div>
                  {isShippingEnabled && (
                    <div className="flex justify-between items-center">
                      <span>Ongkos Kirim ({shippingServiceLabelText}) ({distanceVal} Km):</span>
                      <span className="font-bold text-slate-800">
                        {isWholesaleFree ? (
                          <span className="text-emerald-600 font-extrabold uppercase">Gratis (Grosir)</span>
                        ) : distanceVal > 0 ? (
                          appliedSubsidyAmount > 0 ? (
                            <span className="flex items-center gap-1.5 justify-end">
                              <span className="line-through text-slate-400 font-normal text-xs">{formatIDR(baseShippingCost)}</span>
                              {shippingCost === 0 ? (
                                <span className="text-emerald-600 font-extrabold uppercase text-xs">Subsidi Penuh</span>
                              ) : (
                                <span className="text-emerald-600 font-extrabold">{formatIDR(shippingCost)}</span>
                              )}
                            </span>
                          ) : (
                            formatIDR(shippingCost)
                          )
                        ) : (
                          <span className="text-amber-600 italic text-xs">Masukkan Jarak</span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-emerald-850 bg-emerald-50/80 border border-emerald-100 p-2.5 rounded-xl text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Total Hemat Grosir:
                    </span>
                    <span className="font-bold">-{formatIDR(cartSummary.savings)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200/50">
                    <span>Total Pembayaran:</span>
                    <span className="text-lg text-emerald-600 font-extrabold">{formatIDR(grandTotal)}</span>
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
