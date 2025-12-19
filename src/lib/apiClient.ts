const API_BASE_URL = 'https://smarthubsec.com.ng/api';

const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      full_name: string | null;
      role?: string;
    };
    token: string;
  };
}

export const auth = {
  register: async (data: { email: string; password: string; full_name?: string }): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },
};

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category_id: string | null;
  category_name?: string;
  category_slug?: string;
  stock_quantity: number;
  is_featured: boolean;
  rating: number | null;
  review_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  };
}

export const products = {
  list: async (params?: {
    category?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProductsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.category) queryParams.append('category', params.category);
    if (params?.featured) queryParams.append('featured', '1');
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/products/list.php${queryString ? `?${queryString}` : ''}`;

    return apiRequest<ProductsResponse>(endpoint, { method: 'GET' });
  },
};

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
  created_at: string;
  updated_at: string;
}

export const cart = {
  add: async (productId: string, quantity: number = 1) => {
    return apiRequest<{ success: boolean; message: string }>('/cart/add.php', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  },

  list: async () => {
    return apiRequest<{ success: boolean; data: { items: CartItem[] } }>('/cart/list.php', {
      method: 'GET',
    });
  },

  update: async (itemId: string, quantity: number) => {
    return apiRequest<{ success: boolean; message: string }>('/cart/update.php', {
      method: 'PUT',
      body: JSON.stringify({ item_id: itemId, quantity }),
    });
  },

  remove: async (itemId: string) => {
    return apiRequest<{ success: boolean; message: string }>('/cart/remove.php', {
      method: 'DELETE',
      body: JSON.stringify({ item_id: itemId }),
    });
  },
};

export default { auth, products, cart };