import React, { useEffect, useState } from 'react';
import { supabaseService, LiveMenuItem, LiveRestaurant } from '../services/supabaseService';
import { UtensilsCrossed, Plus, RefreshCw, Star, X } from 'lucide-react';

export const MenuPage: React.FC = () => {
  const [items, setItems] = useState<LiveMenuItem[]>([]);
  const [restaurants, setRestaurants] = useState<LiveRestaurant[]>([]);
  const [selectedRestId, setSelectedRestId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 199,
    restaurant_id: '',
    is_veg: true,
    is_bestseller: false,
    is_available: true,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
    rating: 4.8,
  });

  const fetchData = async () => {
    setLoading(true);
    const [m, r] = await Promise.all([
      supabaseService.getMenuItems(),
      supabaseService.getRestaurants(),
    ]);
    setItems(m);
    setRestaurants(r);
    if (r.length > 0 && !form.restaurant_id) {
      setForm((prev) => ({ ...prev, restaurant_id: r[0].id }));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAvailable = async (id: string, current: boolean) => {
    const ok = await supabaseService.toggleMenuItemAvailability(id, !current);
    if (ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, is_available: !current } : i))
      );
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const autoId = 'item_' + Date.now().toString().slice(-6);
    const newItem = await supabaseService.createMenuItem({
      ...form,
      id: autoId,
    });
    setSubmitting(false);
    if (newItem) {
      setItems([newItem, ...items]);
      setShowAddModal(false);
    }
  };

  const filtered = items.filter((i) =>
    selectedRestId === 'ALL' ? true : i.restaurant_id === selectedRestId
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Dishes & Menu Catalogue
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-orange-100 text-orange-800 border border-orange-200">
              {items.length} Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage culinary offerings, pricing, Veg/Non-Veg indicators, and daily in-stock availability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
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
            Add Dish
          </button>
        </div>
      </div>

      {/* Filter by Restaurant */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedRestId('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            selectedRestId === 'ALL'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Restaurants
        </button>
        {restaurants.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRestId(r.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              selectedRestId === r.id
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-slate-500 text-sm">No menu items found in Supabase.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-xs border-2 flex items-center justify-center text-[8px] font-bold ${
                        item.is_veg
                          ? 'border-emerald-600 text-emerald-600'
                          : 'border-rose-700 text-rose-700'
                      }`}
                    >
                      ●
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {item.name}
                    </h3>
                  </div>
                  <span className="font-extrabold text-sm text-slate-900">₹{item.price}</span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400">
                  {item.is_available ? 'IN STOCK' : 'OUT OF STOCK'}
                </span>
                <button
                  onClick={() => handleToggleAvailable(item.id, item.is_available)}
                  className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                    item.is_available
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {item.is_available ? 'Available' : 'Sold Out'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dish Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add New Dish</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Restaurant</label>
                <select
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500 bg-white"
                  value={form.restaurant_id}
                  onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dish Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Dal Baati Churma Special"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Price (₹)</label>
                <input
                  required
                  type="number"
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-rose-500"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vegCheck"
                  checked={form.is_veg}
                  onChange={(e) => setForm({ ...form, is_veg: e.target.checked })}
                  className="rounded text-rose-600 cursor-pointer"
                />
                <label htmlFor="vegCheck" className="text-slate-700 font-semibold cursor-pointer">
                  Vegetarian Dish (Veg) 🌱
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
                  {submitting ? 'Adding...' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
