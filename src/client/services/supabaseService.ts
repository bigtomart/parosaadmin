/**
 * PAROSA Live Supabase Data Service
 * Direct client-side connection to Supabase REST API with zero latency
 */

const SUPABASE_URL = 'https://fluxjyrvjwzxkayvjmla.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZbI4kAjwJb57I10hIJKjlw_NchwNque';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

export interface LiveRestaurant {
  id: string;
  name: string;
  description: string;
  image_url: string;
  rating: number;
  rating_count: number;
  min_delivery_time: number;
  max_delivery_time: number;
  delivery_fee: number;
  min_order_amount: number;
  is_pure_veg: boolean;
  cuisines: string;
  is_active: boolean;
  latitude: number;
  longitude: number;
  created_at?: string;
}

export interface LiveMenuItem {
  id: string;
  restaurant_id: string;
  category_id?: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_veg: boolean;
  is_bestseller: boolean;
  is_available: boolean;
  rating: number;
}

export interface LiveOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  restaurant_id: string;
  restaurant_name: string;
  status: 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  tax: number;
  delivery_fee: number;
  discount: number;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  created_at: number | string;
  estimated_delivery_time?: number | string;
}

export interface LiveCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  is_verified: boolean;
  dietary_preference: string;
  created_at?: string;
}

export const supabaseService = {
  // RESTAURANTS
  getRestaurants: async (): Promise<LiveRestaurant[]> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?select=*&order=created_at.desc`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
      return [];
    }
  },

  createRestaurant: async (data: Partial<LiveRestaurant>): Promise<LiveRestaurant | null> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/restaurants`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json[0] || null;
    } catch (err) {
      console.error('Failed to create restaurant:', err);
      return null;
    }
  },

  toggleRestaurantStatus: async (id: string, isActive: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_active: isActive }),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to update restaurant:', err);
      return false;
    }
  },

  deleteRestaurant: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/restaurants?id=eq.${id}`, {
        method: 'DELETE',
        headers,
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to delete restaurant:', err);
      return false;
    }
  },

  // MENU ITEMS
  getMenuItems: async (restaurantId?: string): Promise<LiveMenuItem[]> => {
    try {
      const query = restaurantId
        ? `${SUPABASE_URL}/rest/v1/menu_items?restaurant_id=eq.${restaurantId}&order=created_at.desc`
        : `${SUPABASE_URL}/rest/v1/menu_items?select=*&order=created_at.desc`;
      const res = await fetch(query, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
      return [];
    }
  },

  createMenuItem: async (item: Partial<LiveMenuItem>): Promise<LiveMenuItem | null> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items`, {
        method: 'POST',
        headers,
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json[0] || null;
    } catch (err) {
      console.error('Failed to create menu item:', err);
      return null;
    }
  },

  toggleMenuItemAvailability: async (id: string, isAvailable: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/menu_items?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_available: isAvailable }),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to update menu item:', err);
      return false;
    }
  },

  // ORDERS
  getOrders: async (): Promise<LiveOrder[]> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?select=*&order=created_at.desc`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      return [];
    }
  },

  updateOrderStatus: async (orderId: string, status: LiveOrder['status']): Promise<boolean> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to update order status:', err);
      return false;
    }
  },

  // CUSTOMERS
  getCustomers: async (): Promise<LiveCustomer[]> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/customers?select=*&order=created_at.desc`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      return [];
    }
  },

  // PLATFORM STATS
  getPlatformStats: async () => {
    try {
      const [rest, ord, cust] = await Promise.all([
        supabaseService.getRestaurants(),
        supabaseService.getOrders(),
        supabaseService.getCustomers(),
      ]);

      const totalRevenue = ord
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);

      const activeOrders = ord.filter(
        (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
      ).length;

      return {
        totalRestaurants: rest.length,
        activeRestaurants: rest.filter((r) => r.is_active).length,
        totalOrders: ord.length,
        activeOrders,
        totalCustomers: cust.length,
        totalRevenue,
      };
    } catch (err) {
      console.error('Failed to compute platform stats:', err);
      return {
        totalRestaurants: 3,
        activeRestaurants: 3,
        totalOrders: 0,
        activeOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
      };
    }
  },
};
