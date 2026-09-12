import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { DashboardPage } from './pages/Dashboard/DashboardPage'
import { LoginPage } from './pages/Login/LoginPage'
import { ProductsPage } from './pages/Products/ProductsPage'
import { ProductFormPage } from './pages/Products/ProductFormPage'
import { InventoryPage } from './pages/Products/InventoryPage'
import { CategoriesPage } from './pages/Products/CategoriesPage'
import { BrandsPage } from './pages/Products/BrandsPage'
import { OrdersPage } from './pages/Orders/OrdersPage'
import { OrderDetailPage } from './pages/Orders/OrderDetailPage'
import { CustomersPage } from './pages/Customers/CustomersPage'
import { CustomerDetailPage } from './pages/Customers/CustomerDetailPage'
import { ReviewsPage } from './pages/Reviews/ReviewsPage'
import { MarketingPage } from './pages/Marketing/MarketingPage'
import { ContentPage } from './pages/Content/ContentPage'
import { ReportsPage } from './pages/Reports/ReportsPage'
import { SettingsPage } from './pages/Settings/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />

        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/inventory" element={<InventoryPage />} />
        <Route path="/products/categories" element={<CategoriesPage />} />
        <Route path="/products/brands" element={<BrandsPage />} />
        <Route path="/products/:id/edit" element={<ProductFormPage />} />

        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />

        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />

        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
