import { useState } from "react";
import { Star, User, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";

interface Review {
  id: number;
  usuario_nombre: string;
  puntuacion: number;
  comentario: string;
  fecha: string;
  util: number;
}

interface ProductReviewsProps {
  productoId: number;
}

// Mock reviews para demostrar el UI
const mockReviews: Review[] = [
  {
    id: 1,
    usuario_nombre: "Maria G.",
    puntuacion: 5,
    comentario: "Excelente producto, mi piel se siente increible. Muy hidratante y de absorcion rapida. Lo recomiendo totalmente.",
    fecha: "2024-11-15",
    util: 12,
  },
  {
    id: 2,
    usuario_nombre: "Laura P.",
    puntuacion: 4,
    comentario: "Buen producto, el aroma es muy agradable y natural. Quiza un poco caro pero vale la pena por la calidad.",
    fecha: "2024-11-10",
    util: 8,
  },
  {
    id: 3,
    usuario_nombre: "Carmen R.",
    puntuacion: 5,
    comentario: "Me encanta que sea 100% natural. Llevo usandolo dos semanas y noto la diferencia.",
    fecha: "2024-11-05",
    util: 6,
  },
];

function StarRating({ rating, onRate, interactive = false }: {
  rating: number;
  onRate?: (rating: number) => void;
  interactive?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${interactive ? "cursor-pointer" : "cursor-default"}`}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate?.(star)}
        >
          <Star
            className={`h-5 w-5 ${
              star <= (hovered || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productoId }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews] = useState<Review[]>(mockReviews);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");

  const promedioRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.puntuacion, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.puntuacion === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.puntuacion === rating).length / reviews.length) * 100
      : 0,
  }));

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui iria la logica para enviar la resena al backend
    console.log("Nueva resena:", { productoId, rating: newRating, comment: newComment });
    setShowForm(false);
    setNewRating(0);
    setNewComment("");
  };

  return (
    <div className="space-y-8">
      {/* Resumen de resenas */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="font-display text-4xl font-bold text-carbon-800">
              {promedioRating.toFixed(1)}
            </span>
            <div>
              <StarRating rating={Math.round(promedioRating)} />
              <p className="text-sm text-carbon-500 mt-1">
                {reviews.length} resena{reviews.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm text-carbon-600 w-12">{rating} est.</span>
              <Progress value={percentage} className="flex-1 h-2" />
              <span className="text-sm text-carbon-500 w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Boton para escribir resena */}
      <div className="flex justify-center md:justify-start">
        {user ? (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-salvia-500 hover:bg-salvia-600"
          >
            {showForm ? "Cancelar" : "Escribir una resena"}
          </Button>
        ) : (
          <p className="text-carbon-500 text-sm">
            <a href="/login" className="text-salvia-600 hover:underline">
              Inicia sesion
            </a>{" "}
            para dejar una resena
          </p>
        )}
      </div>

      {/* Formulario de nueva resena */}
      {showForm && (
        <Card className="border-salvia-200">
          <CardContent className="p-6">
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-carbon-700 mb-2">
                  Tu puntuacion
                </label>
                <StarRating
                  rating={newRating}
                  onRate={setNewRating}
                  interactive
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-carbon-700 mb-2">
                  Tu resena
                </label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Comparte tu experiencia con este producto..."
                  rows={4}
                  className="border-crudo-300"
                />
              </div>
              <Button
                type="submit"
                disabled={newRating === 0 || newComment.length < 10}
                className="bg-salvia-500 hover:bg-salvia-600"
              >
                Enviar resena
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de resenas */}
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold text-carbon-800">
          Resenas de clientes
        </h3>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <Card key={review.id} className="border-crudo-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-crudo-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-crudo-500" />
                    </div>
                    <div>
                      <p className="font-medium text-carbon-800">
                        {review.usuario_nombre}
                      </p>
                      <p className="text-xs text-carbon-500">
                        {new Date(review.fecha).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.puntuacion} />
                </div>
                <p className="text-carbon-600 mb-3">{review.comentario}</p>
                <button className="flex items-center gap-1 text-sm text-carbon-500 hover:text-salvia-600">
                  <ThumbsUp className="h-4 w-4" />
                  <span>Util ({review.util})</span>
                </button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-carbon-500 text-center py-8">
            Aun no hay resenas para este producto. Se el primero en opinar.
          </p>
        )}
      </div>
    </div>
  );
}
