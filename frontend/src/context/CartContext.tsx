import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Producto, ItemCarrito } from "@/types";

interface CartContextType {
  items: ItemCarrito[];
  total: number;
  cantidadTotal: number;
  agregarProducto: (producto: Producto, cantidad?: number) => void;
  eliminarProducto: (productoId: number) => void;
  actualizarCantidad: (productoId: number, cantidad: number) => void;
  vaciarCarrito: () => void;
  estaEnCarrito: (productoId: number) => boolean;
  obtenerCantidad: (productoId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "tlb_carrito";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Guardar en localStorage cuando cambia el carrito
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const total = items.reduce((sum, item) => {
    const precio = item.producto.precio_oferta ?? item.producto.precio;
    return sum + precio * item.cantidad;
  }, 0);

  const cantidadTotal = items.reduce((sum, item) => sum + item.cantidad, 0);

  const agregarProducto = (producto: Producto, cantidad = 1) => {
    setItems((prevItems) => {
      const existente = prevItems.find((item) => item.producto.id === producto.id);
      if (existente) {
        return prevItems.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: Math.min(item.cantidad + cantidad, producto.stock) }
            : item
        );
      }
      return [...prevItems, { producto, cantidad: Math.min(cantidad, producto.stock) }];
    });
  };

  const eliminarProducto = (productoId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.producto.id !== productoId));
  };

  const actualizarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad <= 0) {
      eliminarProducto(productoId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.producto.id === productoId
          ? { ...item, cantidad: Math.min(cantidad, item.producto.stock) }
          : item
      )
    );
  };

  const vaciarCarrito = () => {
    setItems([]);
  };

  const estaEnCarrito = (productoId: number) => {
    return items.some((item) => item.producto.id === productoId);
  };

  const obtenerCantidad = (productoId: number) => {
    const item = items.find((item) => item.producto.id === productoId);
    return item?.cantidad ?? 0;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        cantidadTotal,
        agregarProducto,
        eliminarProducto,
        actualizarCantidad,
        vaciarCarrito,
        estaEnCarrito,
        obtenerCantidad,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}
