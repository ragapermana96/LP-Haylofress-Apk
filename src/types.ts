export interface DynamicCategory {
  id: string;
  name: string;
  order: number;
}

export type Category = string;

export interface Product {
  id: string;
  name: string;
  category: Category;
  unit: string;
  priceNormal: number;
  priceDiscount: number;
  priceGrosir1: number; // min 10
  priceGrosir2: number; // min 100
  priceGrosir3: number; // min 500
  imageUrl: string;
  description: string;
  visible?: boolean;
  order?: number;
  categoryName?: string;
  isBundle?: boolean; // dynamic check for bundle packages
}

export interface Bundle {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  promoPrice: number;
  imageUrl: string;
  items: string[];
  visible?: boolean;
  order?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  notes: string;
  buyerType: 'rumah_tangga' | 'umkm' | 'reseller';
  mapsLink?: string;
}

export function getProductPriceDetail(product: Product, quantity: number): { price: number; type: 'normal' | 'discount' | 'grosir1' | 'grosir2' | 'grosir3'; label: string } {
  if (quantity >= 500) {
    const val = product.priceGrosir3 || product.priceGrosir2 || product.priceGrosir1 || (product.priceDiscount > 0 ? product.priceDiscount : product.priceNormal);
    return { price: val, type: 'grosir3', label: 'Grosir 3 (≥ 500 Kg)' };
  } else if (quantity >= 100) {
    const val = product.priceGrosir2 || product.priceGrosir1 || (product.priceDiscount > 0 ? product.priceDiscount : product.priceNormal);
    return { price: val, type: 'grosir2', label: 'Grosir 2 (100 - 500 Kg)' };
  } else if (quantity >= 10) {
    const val = product.priceGrosir1 || (product.priceDiscount > 0 ? product.priceDiscount : product.priceNormal);
    return { price: val, type: 'grosir1', label: 'Grosir 1 (10 - 99 Kg)' };
  } else {
    if (product.priceDiscount && product.priceDiscount > 0 && product.priceDiscount < product.priceNormal) {
      return { price: product.priceDiscount, type: 'discount', label: 'Diskon/Promo' };
    }
    return { price: product.priceNormal, type: 'normal', label: 'Eceran/Normal' };
  }
}
