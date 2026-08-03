import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Home from './pages/Home';
import Admin from './pages/Admin';
import NotFound from './pages/not-found';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CartProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/admin" component={Admin} />
              <Route component={NotFound} />
            </Switch>
          </WouterRouter>
          <Toaster position="top-center" />
        </CartProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
