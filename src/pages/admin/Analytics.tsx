import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { orders, products as productsApi, Order, Product } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

const Analytics = () => {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
  });
  const [dailyData, setDailyData] = useState<DailyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; quantity: number }[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !hasPermission('view_analytics'))) {
      navigate('/admin');
    }
  }, [user, hasPermission, authLoading, navigate]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch orders
      const ordersResponse = await orders.list();
      const ordersList = ordersResponse.data.orders || [];

      // Fetch products count
      const productsResponse = await productsApi.list();
      const productsList = productsResponse.data.products || [];

      // Calculate stats
      const totalRevenue = ordersList.reduce((sum, o) => sum + Number(o.total), 0);
      const totalOrders = ordersList.length;
      
      // Get unique customers from orders
      const uniqueCustomers = new Set(ordersList.map(o => o.user_id)).size;
      
      setStats({
        totalRevenue,
        totalOrders,
        totalProducts: productsList.length,
        totalCustomers: uniqueCustomers,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      });

      // Group orders by date for chart
      const revenueByDate: Record<string, { revenue: number; orders: number }> = {};
      ordersList.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!revenueByDate[date]) {
          revenueByDate[date] = { revenue: 0, orders: 0 };
        }
        revenueByDate[date].revenue += Number(order.total);
        revenueByDate[date].orders += 1;
      });

      const dailyDataArray = Object.entries(revenueByDate).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }));

      setDailyData(dailyDataArray);

      // Top products would need order_items data
      // For now, we'll show top products by stock or featured
      const topProductsByStock = productsList
        .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
        .slice(0, 5)
        .map(p => ({
          name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
          quantity: p.review_count || 0
        }));

      setTopProducts(topProductsByStock);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container-main py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-48" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-secondary rounded-xl" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="mb-8">
          <h1 className="section-title">Analytics</h1>
          <p className="text-muted-foreground">Overview of store performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <DollarSign className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <ShoppingCart className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <Package className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
            <p className="text-sm text-muted-foreground">Products</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <Users className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.totalCustomers}</p>
            <p className="text-sm text-muted-foreground">Customers</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <TrendingUp className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">${stats.avgOrderValue.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Avg Order</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold mb-4">Revenue Over Time</h2>
            {dailyData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No revenue data available yet
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold mb-4">Top Products (By Reviews)</h2>
            {topProducts.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No product data available yet
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;