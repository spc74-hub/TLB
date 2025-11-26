import { Link } from "react-router-dom";
import { Clock, Leaf, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Servicio } from "@/lib/supabase";

interface ServiceCardProps {
  servicio: Servicio;
  variante?: "default" | "compact" | "featured";
}

export function ServiceCard({ servicio, variante = "default" }: ServiceCardProps) {
  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(precio);
  };

  const formatDuracion = (minutos: number) => {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  };

  if (variante === "compact") {
    return (
      <Link to={`/servicios/${servicio.id}`}>
        <Card className="h-full hover:shadow-md transition-shadow bg-white border-crudo-200 hover:border-salvia-300">
          <CardContent className="p-4">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-carbon-800 truncate">
                  {servicio.nombre}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-carbon-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuracion(servicio.duracion_minutos)}
                  </span>
                  {servicio.es_libre_toxicos && (
                    <span className="flex items-center gap-1 text-salvia-600">
                      <Leaf className="h-3.5 w-3.5" />
                      Natural
                    </span>
                  )}
                </div>
              </div>
              <span className="font-semibold text-salvia-600 whitespace-nowrap">
                {formatPrecio(servicio.precio)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variante === "featured") {
    return (
      <Card className="h-full overflow-hidden bg-white border-crudo-200 hover:shadow-lg transition-shadow group">
        <div className="aspect-[4/3] bg-gradient-to-br from-crudo-100 to-salvia-50 relative overflow-hidden">
          {servicio.imagen_url ? (
            <img
              src={servicio.imagen_url}
              alt={servicio.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Leaf className="h-16 w-16 text-salvia-300 group-hover:scale-110 transition-transform" />
            </div>
          )}
          {servicio.es_libre_toxicos && (
            <Badge className="absolute top-3 left-3 bg-salvia-500 hover:bg-salvia-500 text-white">
              <Leaf className="h-3 w-3 mr-1" />
              Libre de tóxicos
            </Badge>
          )}
        </div>
        <CardContent className="p-5">
          <h3 className="font-display text-xl font-semibold text-carbon-800 mb-2">
            {servicio.nombre}
          </h3>
          <p className="text-carbon-600 text-sm line-clamp-2 mb-4">
            {servicio.descripcion}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-carbon-500">
              <Clock className="h-4 w-4" />
              {formatDuracion(servicio.duracion_minutos)}
            </div>
            <span className="text-xl font-bold text-salvia-600">
              {formatPrecio(servicio.precio)}
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-5 pt-0 gap-2">
          <Button
            asChild
            variant="outline"
            className="flex-1 border-salvia-300 text-salvia-700 hover:bg-salvia-50"
          >
            <Link to={`/servicios/${servicio.id}`}>Ver más</Link>
          </Button>
          <Button asChild className="flex-1 bg-salvia-500 hover:bg-salvia-600">
            <Link to={`/reservar?servicio=${servicio.id}`}>Reservar</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="h-full bg-white border-crudo-200 hover:shadow-md hover:border-salvia-300 transition-all">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-display text-lg font-semibold text-carbon-800 flex-1">
            {servicio.nombre}
          </h3>
          {servicio.es_libre_toxicos && (
            <Badge
              variant="secondary"
              className="ml-2 bg-salvia-100 text-salvia-700 border-salvia-200 flex-shrink-0"
            >
              <Leaf className="h-3 w-3 mr-1" />
              Natural
            </Badge>
          )}
        </div>

        <p className="text-carbon-600 text-sm line-clamp-2 mb-4">
          {servicio.descripcion}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-carbon-500">
            <Clock className="h-4 w-4" />
            <span>{formatDuracion(servicio.duracion_minutos)}</span>
          </div>
          <span className="text-lg font-bold text-salvia-600">
            {formatPrecio(servicio.precio)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="flex-1 text-carbon-600 hover:text-salvia-700 hover:bg-salvia-50"
        >
          <Link to={`/servicios/${servicio.id}`}>
            Más info
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="flex-1 bg-salvia-500 hover:bg-salvia-600"
        >
          <Link to={`/reservar?servicio=${servicio.id}`}>Reservar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
