//type definition for products

export interface Product {
    id: string;
    name: string;
    category: 'Electronics' | 'Clothing' | 'Home' | 'Beauty' | 'Sports';
    price: number;
    stock: number;
    image?: string;
    sku: string;
}

export interface Sale {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
    timestamp: Date;
    paymentMethod: 'Credit Card' | 'PayPal' | 'Crypto' | 'Debit Card';
    status: 'completed' | 'pending' | 'refunded';
}

export interface DashboardMetrics {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    conversionRate: number;
    growthRate: number;
}

export interface TimeFilter {
    value: '24h' | '7d' | '30d' | '90d';
    label: string;
    hours: number;
}