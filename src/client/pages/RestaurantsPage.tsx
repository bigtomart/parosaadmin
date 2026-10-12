import React, { useEffect, useState } from 'react';
import { supabaseService, LiveRestaurant } from '../services/supabaseService';
import {
  Store,
  Plus,
  RefreshCw,
  Star,
  Clock,
  MapPin,
  Check,
  X,
  Trash2,
  AlertCircle
} from 'lucide-react';

export const RestaurantsPage: React.FC = () => {
  const [restaurants, setRestaurants] = useState<LiveRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for new restaurant
  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
    cuisines: 'Rajasthani, North Indian',
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
    min_delivery_time: 25,
    max_delivery_time: 40,
    delivery_fee: 30,
    min_order_amount: 149,
    is_pure_veg: false,
    rating: 4.8,
    rating_count: 50,
    latitude: 26.9124,
    longitude: 75.7873,
    is_active: true,
  });

  const fetchRestaurants = async () => {
    setLoading(true);
    const data = await supabaseService.getRestaurants();
    setRestaurants(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleToggleActive = async (id: string, current: boolean) => {
    const ok = await supabaseService.toggleRestaurantStatus(id, !current);
    if (ok) {
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this restaurant?')) return;
    const ok = await supabaseService.deleteRestaurant(id);
    if (ok) {
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleAddRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const autoId = 'rest_' + Date.now().toString().slice(-6);
    const newRest = await supabaseService.createRestaurant({
      ...form,
      id: form.id.trim() || autoId,
    });
    setSubmitting(false);
    if (newRest) {
      setRestaurants([newRest, ...restaurants]);
      setShowAddModal(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Store className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Restaurant Partners Directory
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {restaurants.length} Live in Supabase
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage culinary partners, kitchen operational status, commission and cuisines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRestaurants}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : 'text-slate-500'}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Restaurant
          </button>
        </div>
      </div>

      {/* Grid */}
      {restaurants.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-slate-500 text-sm">No restaurants found in Supabase.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {restaurants.map((rest) => (
            <div
              key={rest.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  <img
                    src={rest.image_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500'}
                    alt={rest.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {rest.is_pure_veg && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                        PURE VEG 🌱
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleToggleActive(rest.id, rest.is_active)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors shadow-xs ${
                        rest.is_active
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800/80 text-slate-200'
                      }`}
                    >
                      {rest.is_active ? 'OPEN' : 'CLOSED'}
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                      {rest.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {rest.rating || 4.8}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1">{rest.cuisines}</p>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <div className="text-slate-400">Delivery</div>
                      <div className="font-bold text-slate-800">
                        {rest.min_delivery_time}-{rest.max_delivery_time}m
                      </div>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <div className="text-slate-400">Fee</div>
                      <div className="font-bold text-slate-800">₹{rest.delivery_fee}</div>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <div className="text-slate-400">Min Order</div>
                      <div className="font-bold text-slate-800">₹{rest.min_order_amount}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 flex justify-end gap-2 border-t border-slate-50">
                <button
                  onClick={() => handleDelete(rest.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Remove Restaurant"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Restaurant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add New Restaurant</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRestaurant} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Restaurant Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Royal Thali Haveli"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cuisines</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rajasthani, North Indian, Sweets"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500"
                  value={form.cuisines}
                  onChange={(e) => setForm({ ...form, cuisines: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Delivery Fee (₹)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500"
                    value={form.delivery_fee}
                    onChange={(e) => setForm({ ...form, delivery_fee: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pureVegCheck"
                  checked={form.is_pure_veg}
                  onChange={(e) => setForm({ ...form, is_pure_veg: e.target.checked })}
                  className="rounded text-rose-600 cursor-pointer"
                />
                <label htmlFor="pureVegCheck" className="text-slate-700 font-semibold cursor-pointer">
                  100% Pure Vegetarian Kitchen 🌱
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Add to Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
