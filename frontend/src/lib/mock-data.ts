/**
 * Datos mock para desarrollo sin backend
 * The Lobby Beauty - Servicios de belleza naturales
 */

import type { Servicio, Categoria } from "@/types";

export const categorias: Categoria[] = [
  {
    id: 1,
    nombre: "Manicura",
    slug: "manicura",
    descripcion: "Servicios profesionales de manicura con productos naturales",
    icono: "Hand",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    nombre: "Pedicura",
    slug: "pedicura",
    descripcion: "Servicios profesionales de pedicura con productos naturales",
    icono: "Footprints",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    nombre: "Depilación",
    slug: "depilacion",
    descripcion: "Depilación con ceras naturales y técnicas suaves",
    icono: "Sparkles",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 4,
    nombre: "Cejas",
    slug: "cejas",
    descripcion: "Diseño y cuidado de cejas con productos naturales",
    icono: "Eye",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 5,
    nombre: "Pestañas",
    slug: "pestanas",
    descripcion: "Extensiones y tratamientos de pestañas",
    icono: "Eye",
    created_at: "2024-01-01T00:00:00Z",
  },
];

export const servicios: Servicio[] = [
  // MANICURA
  {
    id: 1,
    nombre: "Manicura Natural",
    descripcion:
      "Manicura básica con esmaltes libres de TPO y DMPT. Incluye limado, cutículas e hidratación con aceites esenciales de origen natural.",
    categoria: "manicura",
    duracion_minutos: 30,
    precio: 18.0,
    es_libre_toxicos: true,
    imagen_url: "/images/manicura-natural.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    nombre: "Manicura Semipermanente Eco",
    descripcion:
      "Esmalte semipermanente con fórmula ecológica, sin químicos tóxicos. Duración hasta 3 semanas sin dañar la uña natural.",
    categoria: "manicura",
    duracion_minutos: 45,
    precio: 28.0,
    es_libre_toxicos: true,
    imagen_url: "/images/manicura-semi.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 3,
    nombre: "Manicura Spa Natural",
    descripcion:
      "Experiencia completa con exfoliación de sal marina, mascarilla natural de arcilla y aloe vera, masaje relajante e hidratación profunda.",
    categoria: "manicura",
    duracion_minutos: 60,
    precio: 38.0,
    es_libre_toxicos: true,
    imagen_url: "/images/manicura-spa.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 4,
    nombre: "Diseño de Uñas Artístico",
    descripcion:
      "Nail art personalizado con productos veganos y libres de tóxicos. Desde diseños minimalistas hasta los más elaborados.",
    categoria: "manicura",
    duracion_minutos: 75,
    precio: 45.0,
    es_libre_toxicos: true,
    imagen_url: "/images/nail-art.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 5,
    nombre: "Retirada de Semipermanente",
    descripcion:
      "Retirada segura del esmalte semipermanente sin dañar la uña, con aceites nutritivos para restaurar la hidratación.",
    categoria: "manicura",
    duracion_minutos: 20,
    precio: 8.0,
    es_libre_toxicos: true,
    imagen_url: "/images/retirada.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },

  // PEDICURA
  {
    id: 6,
    nombre: "Pedicura Natural",
    descripcion:
      "Pedicura básica con productos naturales. Incluye baño de pies con sales minerales, limado, tratamiento de cutículas y esmaltado.",
    categoria: "pedicura",
    duracion_minutos: 45,
    precio: 25.0,
    es_libre_toxicos: true,
    imagen_url: "/images/pedicura-natural.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 7,
    nombre: "Pedicura Semipermanente Eco",
    descripcion:
      "Pedicura con esmalte semipermanente ecológico de larga duración. Perfecta para lucir pies impecables durante semanas.",
    categoria: "pedicura",
    duracion_minutos: 60,
    precio: 35.0,
    es_libre_toxicos: true,
    imagen_url: "/images/pedicura-semi.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 8,
    nombre: "Pedicura Spa Premium",
    descripcion:
      "Tratamiento completo con exfoliación de piedra pómez natural, mascarilla de arcilla verde, masaje relajante con piedras calientes e hidratación intensiva.",
    categoria: "pedicura",
    duracion_minutos: 90,
    precio: 55.0,
    es_libre_toxicos: true,
    imagen_url: "/images/pedicura-spa.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 9,
    nombre: "Tratamiento Pies Cansados",
    descripcion:
      "Masaje especializado con aceites esenciales de menta y eucalipto para pies cansados y pesados. Ideal después de largas jornadas.",
    categoria: "pedicura",
    duracion_minutos: 45,
    precio: 30.0,
    es_libre_toxicos: true,
    imagen_url: "/images/pies-cansados.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },

  // DEPILACIÓN
  {
    id: 10,
    nombre: "Depilación Cejas",
    descripcion:
      "Diseño y depilación de cejas con cera natural de abeja. Incluye perfilado según la forma de tu rostro.",
    categoria: "depilacion",
    duracion_minutos: 15,
    precio: 8.0,
    es_libre_toxicos: true,
    imagen_url: "/images/depi-cejas.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 11,
    nombre: "Depilación Labio Superior",
    descripcion: "Depilación facial suave con cera natural, ideal para pieles sensibles.",
    categoria: "depilacion",
    duracion_minutos: 10,
    precio: 6.0,
    es_libre_toxicos: true,
    imagen_url: "/images/depi-labio.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 12,
    nombre: "Depilación Medias Piernas",
    descripcion:
      "Depilación de medias piernas con cera tibia natural. Resultados suaves y duraderos.",
    categoria: "depilacion",
    duracion_minutos: 30,
    precio: 18.0,
    es_libre_toxicos: true,
    imagen_url: "/images/depi-medias.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 13,
    nombre: "Depilación Piernas Completas",
    descripcion:
      "Depilación completa de piernas con cera natural de alta calidad. Piel suave y sin irritaciones.",
    categoria: "depilacion",
    duracion_minutos: 45,
    precio: 28.0,
    es_libre_toxicos: true,
    imagen_url: "/images/depi-piernas.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 14,
    nombre: "Depilación Axilas",
    descripcion: "Depilación de axilas con cera natural hipoalergénica, perfecta para pieles sensibles.",
    categoria: "depilacion",
    duracion_minutos: 15,
    precio: 10.0,
    es_libre_toxicos: true,
    imagen_url: "/images/depi-axilas.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 15,
    nombre: "Depilación Brazos",
    descripcion: "Depilación completa de brazos con cera tibia natural para una piel perfecta.",
    categoria: "depilacion",
    duracion_minutos: 30,
    precio: 20.0,
    es_libre_toxicos: true,
    imagen_url: "/images/depi-brazos.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 16,
    nombre: "Pack Depilación Integral",
    descripcion:
      "Piernas completas + axilas + ingles. El pack más completo con un ahorro garantizado.",
    categoria: "depilacion",
    duracion_minutos: 90,
    precio: 55.0,
    es_libre_toxicos: true,
    imagen_url: "/images/depi-integral.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },

  // CEJAS
  {
    id: 17,
    nombre: "Diseño de Cejas Natural",
    descripcion:
      "Diseño personalizado según la forma de tu rostro con productos 100% naturales. Realzamos tu mirada respetando tu belleza natural.",
    categoria: "cejas",
    duracion_minutos: 20,
    precio: 12.0,
    es_libre_toxicos: true,
    imagen_url: "/images/diseno-cejas.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 18,
    nombre: "Tinte de Cejas Vegano",
    descripcion:
      "Coloración de cejas con tintes vegetales sin amoniaco ni parabenos. Resultados naturales y duraderos.",
    categoria: "cejas",
    duracion_minutos: 20,
    precio: 15.0,
    es_libre_toxicos: true,
    imagen_url: "/images/tinte-cejas.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 19,
    nombre: "Laminado de Cejas",
    descripcion:
      "Tratamiento para cejas más definidas, ordenadas y con efecto lifting. Utilizamos productos naturales para un resultado espectacular.",
    categoria: "cejas",
    duracion_minutos: 45,
    precio: 35.0,
    es_libre_toxicos: true,
    imagen_url: "/images/laminado-cejas.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 20,
    nombre: "Pack Cejas Completo",
    descripcion:
      "Diseño + tinte + laminado. El tratamiento definitivo para unas cejas perfectas y naturales.",
    categoria: "cejas",
    duracion_minutos: 60,
    precio: 50.0,
    es_libre_toxicos: true,
    imagen_url: "/images/pack-cejas.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },

  // PESTAÑAS
  {
    id: 21,
    nombre: "Tinte de Pestañas Natural",
    descripcion:
      "Coloración de pestañas con tinte vegetal de larga duración. Realza tu mirada sin necesidad de máscara.",
    categoria: "pestanas",
    duracion_minutos: 20,
    precio: 18.0,
    es_libre_toxicos: true,
    imagen_url: "/images/tinte-pestanas.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 22,
    nombre: "Lifting de Pestañas",
    descripcion:
      "Elevación y curvado de tus pestañas naturales con productos suaves. Efecto de ojos más abiertos y luminosos.",
    categoria: "pestanas",
    duracion_minutos: 60,
    precio: 45.0,
    es_libre_toxicos: true,
    imagen_url: "/images/lifting-pestanas.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 23,
    nombre: "Extensiones Pestañas Clásicas",
    descripcion:
      "Extensiones pelo a pelo con adhesivos hipoalergénicos. Aspecto natural y elegante para el día a día.",
    categoria: "pestanas",
    duracion_minutos: 90,
    precio: 65.0,
    es_libre_toxicos: true,
    imagen_url: "/images/ext-clasicas.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 24,
    nombre: "Extensiones Pestañas Volumen",
    descripcion:
      "Técnica de volumen ruso con materiales premium libres de formaldehído. Mirada impactante y glamurosa.",
    categoria: "pestanas",
    duracion_minutos: 120,
    precio: 85.0,
    es_libre_toxicos: true,
    imagen_url: "/images/ext-volumen.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 25,
    nombre: "Relleno de Extensiones",
    descripcion:
      "Mantenimiento de tus extensiones cada 2-3 semanas para lucir siempre perfecta.",
    categoria: "pestanas",
    duracion_minutos: 45,
    precio: 35.0,
    es_libre_toxicos: true,
    imagen_url: "/images/relleno.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 26,
    nombre: "Pack Mirada Perfecta",
    descripcion:
      "Lifting de pestañas + tinte de pestañas + diseño de cejas. Todo lo que necesitas para una mirada espectacular.",
    categoria: "pestanas",
    duracion_minutos: 75,
    precio: 60.0,
    es_libre_toxicos: true,
    imagen_url: "/images/pack-mirada.jpg",
    activo: true,
    created_at: "2024-01-01T00:00:00Z",
  },
];

// Función para obtener servicios por categoría
export function getServiciosPorCategoria(categoria: string): Servicio[] {
  return servicios.filter((s) => s.categoria === categoria && s.activo);
}

// Función para obtener un servicio por ID
export function getServicioPorId(id: number): Servicio | undefined {
  return servicios.find((s) => s.id === id);
}

// Función para obtener servicios destacados (los más populares/económicos de cada categoría)
export function getServiciosDestacados(): Servicio[] {
  const destacados: Servicio[] = [];
  const categoriasList = ["manicura", "pedicura", "depilacion", "cejas", "pestanas"];

  categoriasList.forEach((cat) => {
    const servicioCat = servicios.find((s) => s.categoria === cat && s.activo);
    if (servicioCat) destacados.push(servicioCat);
  });

  return destacados;
}
