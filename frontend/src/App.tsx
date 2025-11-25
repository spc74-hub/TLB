import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout";
import {
  Home,
  Servicios,
  ServicioDetalle,
  Nosotros,
  Contacto,
  Reservar,
} from "@/pages";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="servicios" element={<Servicios />} />
        <Route path="servicios/:id" element={<ServicioDetalle />} />
        <Route path="reservar" element={<Reservar />} />
        <Route path="nosotros" element={<Nosotros />} />
        <Route path="contacto" element={<Contacto />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

// Página 404
function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-crudo-50">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold text-salvia-300 mb-4">
          404
        </h1>
        <h2 className="font-display text-2xl font-bold text-carbon-800 mb-4">
          Página no encontrada
        </h2>
        <p className="text-carbon-600 mb-6">
          Lo sentimos, la página que buscas no existe.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-salvia-500 text-white rounded-lg hover:bg-salvia-600 transition-colors"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

export default App;
