import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Package,
  Scissors,
  Users,
  ShoppingBag,
  Settings,
  Menu,
  X,
  ChevronLeft,
  UserCircle,
  Receipt,
  Wallet,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Agenda",
    href: "/admin/agenda",
    icon: Calendar,
  },
  {
    title: "Servicios",
    href: "/admin/servicios",
    icon: Scissors,
  },
  {
    title: "Productos",
    href: "/admin/productos",
    icon: Package,
  },
  {
    title: "Empleados",
    href: "/admin/empleados",
    icon: Users,
  },
  {
    title: "Pedidos",
    href: "/admin/pedidos",
    icon: ShoppingBag,
  },
  {
    title: "Clientes (CRM)",
    href: "/admin/clientes",
    icon: UserCircle,
  },
  {
    title: "Ingresos",
    href: "/admin/ingresos",
    icon: TrendingUp,
  },
  {
    title: "Gastos",
    href: "/admin/gastos",
    icon: Receipt,
  },
  {
    title: "Tesorería",
    href: "/admin/tesoreria",
    icon: Wallet,
  },
  {
    title: "Cuenta Resultados",
    href: "/admin/cuenta-resultados",
    icon: BarChart3,
  },
  {
    title: "Configuración",
    href: "/admin/configuracion",
    icon: Settings,
    disabled: true,
  },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { perfil } = useAuth();

  return (
    <div className="min-h-screen bg-crudo-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-crudo-200 px-4 py-3 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <span className="font-display text-lg font-bold text-carbon-800">
            Admin Panel
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-white border-r border-crudo-200 transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-crudo-200">
          {sidebarOpen ? (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-salvia-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">TLB</span>
              </div>
              <span className="font-display text-lg font-bold text-carbon-800">
                Admin
              </span>
            </Link>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 bg-salvia-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">TLB</span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                !sidebarOpen && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <div
                  key={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-carbon-400 cursor-not-allowed",
                    !sidebarOpen && "justify-center"
                  )}
                  title={sidebarOpen ? undefined : item.title}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm">
                      {item.title}
                      <span className="ml-2 text-xs text-carbon-300">(próximamente)</span>
                    </span>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-salvia-100 text-salvia-700"
                    : "text-carbon-600 hover:bg-crudo-100",
                  !sidebarOpen && "justify-center"
                )}
                title={sidebarOpen ? undefined : item.title}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-crudo-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-salvia-200 rounded-full flex items-center justify-center">
                <span className="text-salvia-700 font-medium text-sm">
                  {perfil?.nombre?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-carbon-800 truncate">
                  {perfil?.nombre || "Usuario"}
                </p>
                <p className="text-xs text-carbon-500 truncate">
                  {perfil?.rol || "admin"}
                </p>
              </div>
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-xs">
                  Salir
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-salvia-200 rounded-full flex items-center justify-center">
                <span className="text-salvia-700 font-medium text-sm">
                  {perfil?.nombre?.charAt(0) || "U"}
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "transition-all duration-300 pt-16 lg:pt-0",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
