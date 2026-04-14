import { Hand, Sparkles, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoriaServicio } from '@/lib/api';

interface CategoryFilterProps {
  categoriaActiva: CategoriaServicio | "todas";
  onCategoriaChange: (categoria: CategoriaServicio | "todas") => void;
}

const categorias: {
  id: CategoriaServicio | "todas";
  nombre: string;
  icono: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "todas", nombre: "Todos", icono: Sparkles },
  { id: "manicura", nombre: "Manicura", icono: Hand },
  { id: "pedicura", nombre: "Pedicura", icono: Sparkles },
  { id: "depilacion", nombre: "Depilación", icono: Sparkles },
  { id: "cejas", nombre: "Cejas", icono: Eye },
  { id: "pestanas", nombre: "Pestañas", icono: Eye },
];

export function CategoryFilter({
  categoriaActiva,
  onCategoriaChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categorias.map((cat) => {
        const isActive = categoriaActiva === cat.id;
        const Icon = cat.icono;

        return (
          <button
            key={cat.id}
            onClick={() => onCategoriaChange(cat.id)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              "border focus:outline-none focus:ring-2 focus:ring-salvia-400 focus:ring-offset-2",
              isActive
                ? "bg-salvia-500 text-white border-salvia-500"
                : "bg-white text-carbon-600 border-crudo-300 hover:border-salvia-400 hover:text-salvia-700"
            )}
          >
            <Icon className="h-4 w-4" />
            {cat.nombre}
          </button>
        );
      })}
    </div>
  );
}
