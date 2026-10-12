/**
 * Domain Entities for Food Delivery Operations (Zomato/Swiggy Grade)
 */

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type RestaurantStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface City {
  id: string; // e.g. "ALWAR", "JAIPUR", "DELHI", "MUMBAI", "BENGALURU"
  name: string;
  state: string;
  activeRestaurantsCount: number;
  activeDeliveryPartnersCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  profilePic?: string;
  addresses: {
    label: string;
    street: string;
    city: string;
    isDefault: boolean;
  }[];
  totalOrders: number;
  totalSpending: number;
  walletBalance: number;
  status: 'ACTIVE' | 'SUSPENDED';
  city: string;
  registrationDate: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  discountPrice?: number;
  isVeg: boolean;
  isAvailable: boolean;
  preparationTimeMinutes: number;
  taxPercent: number;
  imageUrl?: string;
  addOns?: {
    name: string;
    price: number;
  }[];
}

export interface Restaurant {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  documents: {
    fssaiLicense: string;
    gstCertificate: string;
    panCard: string;
    verified: boolean;
  };
  openingTime: string;
  closingTime: string;
  deliveryRadiusKm: number;
  commissionRatePercent: number;
  status: RestaurantStatus;
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  cuisineTypes: string[];
  createdAt: string;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  vehicleType: 'BIKE' | 'SCOOTER' | 'EV_BIKE' | 'CYCLE';
  vehicleNumber: string;
  isOnline: boolean;
  currentOrderId?: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  completedDeliveries: number;
  totalEarnings: number;
  rating: number;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addOns?: string[];
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  city: string;
  deliveryAddress: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'ONLINE_UPI' | 'CREDIT_CARD' | 'NET_BANKING' | 'COD';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  placedAt: string;
  deliveryDistanceKm: number;
  cancellationReason?: string;
  timeline: OrderTimelineEvent[];
}

export interface RefundRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  restaurantName: string;
  city: string;
  amount: number;
  reason: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  transactionRef?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumOrderValue: number;
  maximumDiscountAmount: number;
  startDate: string;
  endDate: string;
  usageLimitTotal: number;
  usedCount: number;
  usageLimitPerUser: number;
  applicableCities: string[]; // empty means all cities
  applicableRestaurantIds: string[]; // empty means all restaurants
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED';
  description: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  orderNumber?: string;
  city: string;
  category: 'FOOD_QUALITY' | 'DELIVERY_DELAY' | 'PAYMENT_ISSUE' | 'MISSING_ITEMS' | 'GENERAL';
  priority: TicketPriority;
  subject: string;
  description: string;
  assignedAgent?: string;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface DashboardMetrics {
  totalCustomers: number;
  activeCustomers: number;
  totalRestaurants: number;
  activeRestaurants: number;
  pendingRestaurants: number;
  totalDeliveryPartners: number;
  activeDeliveryPartners: number;
  todayOrdersCount: number;
  pendingOrdersCount: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  todayRevenue: number;
  monthlyRevenue: number;
  refundAmountTotal: number;
  dailyOrdersTrend: { date: string; orders: number; revenue: number }[];
  ordersByStatus: { status: string; count: number; color: string }[];
  topRestaurants: { id: string; name: string; city: string; orders: number; revenue: number }[];
  cityPerformance: { city: string; orders: number; revenue: number; restaurants: number }[];
}
