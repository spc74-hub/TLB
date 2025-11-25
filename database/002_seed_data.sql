-- ============================================
-- The Lobby Beauty - Datos de Ejemplo
-- ============================================
-- Ejecutar después del schema para poblar con datos iniciales

-- ============================================
-- SERVICIOS DE MANICURA
-- ============================================
INSERT INTO servicios (nombre, descripcion, categoria, duracion_minutos, precio, es_libre_toxicos) VALUES
    (
        'Manicura Natural',
        'Manicura básica con esmaltes libres de TPO y DMPT. Incluye limado, cutículas e hidratación.',
        'manicura',
        30,
        18.00,
        TRUE
    ),
    (
        'Manicura Semipermanente Eco',
        'Esmalte semipermanente con fórmula ecológica, sin químicos tóxicos. Duración hasta 3 semanas.',
        'manicura',
        45,
        28.00,
        TRUE
    ),
    (
        'Manicura Spa Natural',
        'Experiencia completa con exfoliación, mascarilla natural, masaje e hidratación profunda.',
        'manicura',
        60,
        38.00,
        TRUE
    ),
    (
        'Diseño de Uñas Artístico',
        'Nail art personalizado con productos veganos y libres de tóxicos.',
        'manicura',
        75,
        45.00,
        TRUE
    ),
    (
        'Retirada de Semipermanente',
        'Retirada segura del esmalte semipermanente sin dañar la uña.',
        'manicura',
        20,
        8.00,
        TRUE
    );

-- ============================================
-- SERVICIOS DE PEDICURA
-- ============================================
INSERT INTO servicios (nombre, descripcion, categoria, duracion_minutos, precio, es_libre_toxicos) VALUES
    (
        'Pedicura Natural',
        'Pedicura básica con productos naturales. Incluye baño de pies, limado y esmaltado.',
        'pedicura',
        45,
        25.00,
        TRUE
    ),
    (
        'Pedicura Semipermanente Eco',
        'Pedicura con esmalte semipermanente ecológico de larga duración.',
        'pedicura',
        60,
        35.00,
        TRUE
    ),
    (
        'Pedicura Spa Premium',
        'Tratamiento completo con exfoliación, mascarilla de arcilla, masaje relajante e hidratación.',
        'pedicura',
        90,
        55.00,
        TRUE
    ),
    (
        'Tratamiento Pies Cansados',
        'Masaje especializado con aceites esenciales para pies cansados y pesados.',
        'pedicura',
        45,
        30.00,
        TRUE
    );

-- ============================================
-- SERVICIOS DE DEPILACIÓN
-- ============================================
INSERT INTO servicios (nombre, descripcion, categoria, duracion_minutos, precio, es_libre_toxicos) VALUES
    (
        'Depilación Cejas',
        'Diseño y depilación de cejas con cera natural de abeja.',
        'depilacion',
        15,
        8.00,
        TRUE
    ),
    (
        'Depilación Labio Superior',
        'Depilación facial suave con cera natural.',
        'depilacion',
        10,
        6.00,
        TRUE
    ),
    (
        'Depilación Medias Piernas',
        'Depilación de medias piernas con cera tibia natural.',
        'depilacion',
        30,
        18.00,
        TRUE
    ),
    (
        'Depilación Piernas Completas',
        'Depilación completa de piernas con cera natural de alta calidad.',
        'depilacion',
        45,
        28.00,
        TRUE
    ),
    (
        'Depilación Axilas',
        'Depilación de axilas con cera natural hipoalergénica.',
        'depilacion',
        15,
        10.00,
        TRUE
    ),
    (
        'Depilación Brazos',
        'Depilación completa de brazos con cera tibia natural.',
        'depilacion',
        30,
        20.00,
        TRUE
    ),
    (
        'Pack Depilación Integral',
        'Piernas completas + axilas + ingles. Ahorro garantizado.',
        'depilacion',
        90,
        55.00,
        TRUE
    );

-- ============================================
-- SERVICIOS DE CEJAS
-- ============================================
INSERT INTO servicios (nombre, descripcion, categoria, duracion_minutos, precio, es_libre_toxicos) VALUES
    (
        'Diseño de Cejas Natural',
        'Diseño personalizado según tu rostro con productos naturales.',
        'cejas',
        20,
        12.00,
        TRUE
    ),
    (
        'Tinte de Cejas Vegano',
        'Coloración de cejas con tintes vegetales sin amoniaco.',
        'cejas',
        20,
        15.00,
        TRUE
    ),
    (
        'Laminado de Cejas',
        'Tratamiento para cejas más definidas y ordenadas con productos naturales.',
        'cejas',
        45,
        35.00,
        TRUE
    ),
    (
        'Pack Cejas Completo',
        'Diseño + tinte + laminado. El look perfecto para tus cejas.',
        'cejas',
        60,
        50.00,
        TRUE
    );

-- ============================================
-- SERVICIOS DE PESTAÑAS
-- ============================================
INSERT INTO servicios (nombre, descripcion, categoria, duracion_minutos, precio, es_libre_toxicos) VALUES
    (
        'Tinte de Pestañas Natural',
        'Coloración de pestañas con tinte vegetal de larga duración.',
        'pestanas',
        20,
        18.00,
        TRUE
    ),
    (
        'Lifting de Pestañas',
        'Elevación y curvado de pestañas naturales con productos suaves.',
        'pestanas',
        60,
        45.00,
        TRUE
    ),
    (
        'Extensiones Pestañas Clásicas',
        'Extensiones pelo a pelo con adhesivos hipoalergénicos.',
        'pestanas',
        90,
        65.00,
        TRUE
    ),
    (
        'Extensiones Pestañas Volumen',
        'Técnica de volumen ruso con materiales premium libres de formaldehído.',
        'pestanas',
        120,
        85.00,
        TRUE
    ),
    (
        'Relleno de Extensiones',
        'Mantenimiento de extensiones (cada 2-3 semanas).',
        'pestanas',
        45,
        35.00,
        TRUE
    ),
    (
        'Pack Mirada Perfecta',
        'Lifting de pestañas + tinte + diseño de cejas.',
        'pestanas',
        75,
        60.00,
        TRUE
    );

-- ============================================
-- Mensaje de confirmación
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Datos de ejemplo insertados correctamente';
    RAISE NOTICE '📊 Total servicios: %', (SELECT COUNT(*) FROM servicios);
END $$;
