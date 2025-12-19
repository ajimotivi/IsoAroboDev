import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layout } from '@/components/layout/Layout';
import { orders, Order } from '@/lib/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerWithOrders extends Profile {
  order_count: number;
  total_spent: number;
}

const CustomerManagement = () => {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithOrders | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !hasPermission('view_customers'))) {
      navigate('/admin');
    }
  }, [user, hasPermission, authLoading, navigate]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // TODO: Implement customers list endpoint
      // For now, we'll extract unique customers from orders
      const ordersResponse = await orders.list();
      const allOrders = ordersResponse.data.orders || [];
      
      // Group orders by user_id to get customer stats
      const customerMap = new Map<string, CustomerWithOrders>();
      
      allOrders.forEach(order => {
        const existing = customerMap.get(order.user_id);
        if (existing) {
          existing.order_count++;
          existing.total_spent += order.total;
        } else {
          customerMap.set(order.user_id, {
            id: order.user_id,
            email: `customer-${order.user_id.slice(0, 8)}@example.com`, // Placeholder
            full_name: null,
            phone: null,
            address: order.shipping_address,
            city: order.shipping_city,
            postal_code: order.shipping_postal_code,
            country: order.shipping_country,
            avatar_url: null,
            created_at: order.created_at,
            updated_at: order.updated_at,
            order_count: 1,
            total_spent: order.total,
          });
        }
      });
      
      setCustomers(Array.from(customerMap.values()));
      
      if (allOrders.length === 0) {
        toast.info('No customer data available yet');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = async (customer: CustomerWithOrders) => {
    setSelectedCustomer(customer);
    
    try {
      const ordersResponse = await orders.list();
      const customerOrdersList = ordersResponse.data.orders.filter(
        o => o.user_id === customer.id
      );
      setCustomerOrders(customerOrdersList);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setCustomerOrders([]);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container-main py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-48" />
            <div className="h-64 bg-secondary rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title">Customers</h1>
            <p className="text-muted-foreground">{customers.length} total customers</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <p className="text-muted-foreground">No customers found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Customer data is derived from order information
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>First Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-mono text-xs">{customer.id.slice(0, 8)}...</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.city ? `${customer.city}, ${customer.country}` : 'N/A'}</TableCell>
                    <TableCell>{customer.order_count}</TableCell>
                    <TableCell>${customer.total_spent.toFixed(2)}</TableCell>
                    <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Customer ID</p>
                    <p className="font-mono text-sm">{selectedCustomer.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </p>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone
                    </p>
                    <p className="font-medium">{selectedCustomer.phone || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Address
                    </p>
                    <p className="font-medium">
                      {selectedCustomer.address ? (
                        <>
                          {selectedCustomer.address}<br />
                          {selectedCustomer.city}, {selectedCustomer.postal_code}<br />
                          {selectedCustomer.country}
                        </>
                      ) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Order History ({customerOrders.length})</h3>
                  {customerOrders.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {customerOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                          <div>
                            <p className="font-mono text-sm">{order.order_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${Number(order.total).toFixed(2)}</p>
                            <p className="text-xs capitalize text-muted-foreground">{order.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No orders yet</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default CustomerManagement;