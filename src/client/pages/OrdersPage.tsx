import React, { useEffect, useState } from 'react';
import { supabaseService, LiveOrder } from '../services/supabaseService';
import {
  ShoppingBag,
  RefreshCw,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChefHat,
  Filter,
  DollarSign,
  AlertCircle
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchOrders = async () => {
    setLoading(true);
    const data = await supabaseService.getOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 10 seconds for real-time order updates
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, nextStatus: LiveOrder['status']) => {
    const ok = await supabaseService.updateOrderStatus(orderId, nextStatus);
    if (ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    }
  };

  const filtered = orders.filter((o) =>
    filterStatus === 'ALL' ? true : o.status === filterStatus
  );

  const getStatusBadge = (status: LiveOrder['status']) => {
    switch (status) {
      case 'PLACED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> New Order
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <ChefHat className="w-3 h-3 text-blue-600" /> Cooking
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Truck className="w-3 h-3 text-purple-600" /> On the Way
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Live Orders Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Supabase Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time feed of all customer orders placed from the PAROSA Android Mobile App.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : 'text-slate-500'}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'PLACED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === st
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {st === 'ALL' ? 'All Orders' : st.replace(/_/g, ' ')}
            <span className="ml-1.5 opacity-75 font-mono text-[10px]">
              ({orders.filter((o) => (st === 'ALL' ? true : o.status === st)).length})
            </span>
          </button>
        ))}
      </div>

      {/* Orders List / Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Orders in this Status</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When customers place orders on the PAROSA Android app, they will automatically appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="font-mono text-xs font-bold text-slate-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {order.restaurant_name || 'Royal Rajputana Thali'}
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Customer:</span>
                    <span className="font-semibold text-slate-800">
                      {order.customer_name || 'Parosa Customer'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Phone:</span>
                    <span className="font-mono text-slate-700">
                      {order.customer_phone || '+91 98290 12345'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Total Amount:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{Math.round(order.grand_total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Payment:</span>
                    <span className="font-semibold text-emerald-600">
                      {order.payment_method || 'UPI'} • {order.payment_status || 'PAID'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                {order.status === 'PLACED' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'PREPARING')}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <ChefHat className="w-3.5 h-3.5" /> Accept & Cook
                  </button>
                )}
                {order.status === 'PREPARING' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'OUT_FOR_DELIVERY')}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Truck className="w-3.5 h-3.5" /> Dispatch
                  </button>
                )}
                {order.status === 'OUT_FOR_DELIVERY' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'DELIVERED')}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Delivered
                  </button>
                )}
                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                    className="py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
