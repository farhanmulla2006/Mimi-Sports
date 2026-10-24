import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { CustomerAuthProvider } from './context/CustomerAuthContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import ProtectedCustomerRoute from './components/ProtectedCustomerRoute.jsx'
import Home from './pages/Home.jsx'
import Sports from './pages/Sports.jsx'
import Products from './pages/Products.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import CustomerLogin from './pages/CustomerLogin.jsx'
import CustomerRegister from './pages/CustomerRegister.jsx'
import CustomerAccount from './pages/CustomerAccount.jsx'
import CustomerAccountProfile from './pages/CustomerAccountProfile.jsx'
import CustomerOrdersList from './pages/CustomerOrdersList.jsx'
import CustomerOrderDetail from './pages/CustomerOrderDetail.jsx'
import Wishlist from './pages/Wishlist.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminProducts from './pages/admin/AdminProducts.jsx'
import AdminProductForm from './pages/admin/AdminProductForm.jsx'
import AdminProductImport from './pages/admin/AdminProductImport.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import AdminReviews from './pages/admin/AdminReviews.jsx'
import AdminPlaceholder from './pages/admin/AdminPlaceholder.jsx'

function App() {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <WishlistProvider>
          <CartProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sports" element={<Sports />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<CustomerLogin />} />
              <Route path="/register" element={<CustomerRegister />} />
              <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
              <Route path="/wishlist" element={<ProtectedCustomerRoute><Wishlist /></ProtectedCustomerRoute>} />

              <Route
                path="/account"
                element={
                  <ProtectedCustomerRoute>
                    <CustomerAccount />
                  </ProtectedCustomerRoute>
                }
              >
                <Route index element={<CustomerAccountProfile />} />
                <Route path="orders" element={<CustomerOrdersList />} />
                <Route path="orders/:orderNumber" element={<CustomerOrderDetail />} />
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductForm mode="create" />} />
                <Route path="products/:id/edit" element={<AdminProductForm mode="edit" />} />
                <Route path="products/import" element={<AdminProductImport />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="customers" element={<AdminPlaceholder title="Customers" />} />
                <Route path="settings" element={<AdminPlaceholder title="Settings" />} />
              </Route>

              <Route path="*" element={<Home />} />
            </Routes>
            </BrowserRouter>
          </CartProvider>
        </WishlistProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  )
}

export default App
