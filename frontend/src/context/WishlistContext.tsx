import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Producto } from "@/types";

interface WishlistContextType {
  items: Producto[];
  cantidadTotal: number;
  agregarFavorito: (producto: Producto) => void;
  eliminarFavorito: (productoId: number) => void;
  toggleFavorito: (producto: Producto) => void;
  esFavorito: (productoId: number) => boolean;
  vaciarFavoritos: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = "tlb_favoritos";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Producto[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Guardar en localStorage cuando cambia la lista
  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const cantidadTotal = items.length;

  const agregarFavorito = (producto: Producto) => {
    setItems((prevItems) => {
      const existe = prevItems.find((item) => item.id === producto.id);
      if (existe) {
        return prevItems;
      }
      return [...prevItems, producto];
    });
  };

  const eliminarFavorito = (productoId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productoId));
  };

  const toggleFavorito = (producto: Producto) => {
    if (esFavorito(producto.id)) {
      eliminarFavorito(producto.id);
    } else {
      agregarFavorito(producto);
    }
  };

  const esFavorito = (productoId: number) => {
    return items.some((item) => item.id === productoId);
  };

  const vaciarFavoritos = () => {
    setItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        cantidadTotal,
        agregarFavorito,
        eliminarFavorito,
        toggleFavorito,
        esFavorito,
        vaciarFavoritos,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist debe usarse dentro de un WishlistProvider");
  }
  return context;
}
