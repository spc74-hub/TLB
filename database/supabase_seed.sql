-- ============================================
-- THE LOBBY BEAUTY - DATOS INICIALES (SEED)
-- Ejecutar DESPUÉS del esquema
-- ============================================

-- ============================================
-- CATEGORÍAS DE SERVICIOS
-- ============================================

INSERT INTO categorias_servicios (nombre, slug, descripcion, icono, orden) VALUES
('Manicura', 'manicura', 'Servicios profesionales de manicura con productos naturales', 'Hand', 1),
('Pedicura', 'pedicura', 'Servicios profesionales de pedicura con productos naturales', 'Footprints', 2),
('Depilación', 'depilacion', 'Depilación con ceras naturales y técnicas suaves', 'Sparkles', 3),
('Cejas', 'cejas', 'Diseño y cuidado de cejas con productos naturales', 'Eye', 4),
('Pestañas', 'pestanas', 'Extensiones y tratamientos de pestañas', 'Eye', 5);

-- ============================================
-- SERVICIOS
-- ============================================

INSERT INTO servicios (nombre, descripcion, categoria, duracion_minutos, precio, es_libre_toxicos, activo, destacado) VALUES
-- MANICURA
('Manicura Natural', 'Manicura básica con esmaltes libres de TPO y DMPT. Incluye limado, cutículas e hidratación con aceites esenciales de origen natural.', 'manicura', 30, 18.00, true, true, true),
('Manicura Semipermanente Eco', 'Esmalte semipermanente con fórmula ecológica, sin químicos tóxicos. Duración hasta 3 semanas sin dañar la uña natural.', 'manicura', 45, 28.00, true, true, false),
('Manicura Spa Natural', 'Experiencia completa con exfoliación de sal marina, mascarilla natural de arcilla y aloe vera, masaje relajante e hidratación profunda.', 'manicura', 60, 38.00, true, true, true),
('Diseño de Uñas Artístico', 'Nail art personalizado con productos veganos y libres de tóxicos. Desde diseños minimalistas hasta los más elaborados.', 'manicura', 75, 45.00, true, true, false),
('Retirada de Semipermanente', 'Retirada segura del esmalte semipermanente sin dañar la uña, con aceites nutritivos para restaurar la hidratación.', 'manicura', 20, 8.00, true, true, false),

-- PEDICURA
('Pedicura Natural', 'Pedicura básica con productos naturales. Incluye baño de pies con sales minerales, limado, tratamiento de cutículas y esmaltado.', 'pedicura', 45, 25.00, true, true, true),
('Pedicura Semipermanente Eco', 'Pedicura con esmalte semipermanente ecológico de larga duración. Perfecta para lucir pies impecables durante semanas.', 'pedicura', 60, 35.00, true, true, false),
('Pedicura Spa Premium', 'Tratamiento completo con exfoliación de piedra pómez natural, mascarilla de arcilla verde, masaje relajante con piedras calientes e hidratación intensiva.', 'pedicura', 90, 55.00, true, true, true),
('Tratamiento Pies Cansados', 'Masaje especializado con aceites esenciales de menta y eucalipto para pies cansados y pesados. Ideal después de largas jornadas.', 'pedicura', 45, 30.00, true, true, false),

-- DEPILACIÓN
('Depilación Cejas', 'Diseño y depilación de cejas con cera natural de abeja. Incluye perfilado según la forma de tu rostro.', 'depilacion', 15, 8.00, true, true, false),
('Depilación Labio Superior', 'Depilación facial suave con cera natural, ideal para pieles sensibles.', 'depilacion', 10, 6.00, true, true, false),
('Depilación Medias Piernas', 'Depilación de medias piernas con cera tibia natural. Resultados suaves y duraderos.', 'depilacion', 30, 18.00, true, true, false),
('Depilación Piernas Completas', 'Depilación completa de piernas con cera natural de alta calidad. Piel suave y sin irritaciones.', 'depilacion', 45, 28.00, true, true, true),
('Depilación Axilas', 'Depilación de axilas con cera natural hipoalergénica, perfecta para pieles sensibles.', 'depilacion', 15, 10.00, true, true, false),
('Pack Depilación Integral', 'Piernas completas + axilas + ingles. El pack más completo con un ahorro garantizado.', 'depilacion', 90, 55.00, true, true, true),

-- CEJAS
('Diseño de Cejas Natural', 'Diseño personalizado según la forma de tu rostro con productos 100% naturales. Realzamos tu mirada respetando tu belleza natural.', 'cejas', 20, 12.00, true, true, true),
('Tinte de Cejas Vegano', 'Coloración de cejas con tintes vegetales sin amoniaco ni parabenos. Resultados naturales y duraderos.', 'cejas', 20, 15.00, true, true, false),
('Laminado de Cejas', 'Tratamiento para cejas más definidas, ordenadas y con efecto lifting. Utilizamos productos naturales para un resultado espectacular.', 'cejas', 45, 35.00, true, true, true),
('Pack Cejas Completo', 'Diseño + tinte + laminado. El tratamiento definitivo para unas cejas perfectas y naturales.', 'cejas', 60, 50.00, true, true, false),

-- PESTAÑAS
('Tinte de Pestañas Natural', 'Coloración de pestañas con tinte vegetal de larga duración. Realza tu mirada sin necesidad de máscara.', 'pestanas', 20, 18.00, true, true, false),
('Lifting de Pestañas', 'Elevación y curvado de tus pestañas naturales con productos suaves. Efecto de ojos más abiertos y luminosos.', 'pestanas', 60, 45.00, true, true, true),
('Extensiones Pestañas Clásicas', 'Extensiones pelo a pelo con adhesivos hipoalergénicos. Aspecto natural y elegante para el día a día.', 'pestanas', 90, 65.00, true, true, false),
('Extensiones Pestañas Volumen', 'Técnica de volumen ruso con materiales premium libres de formaldehído. Mirada impactante y glamurosa.', 'pestanas', 120, 85.00, true, true, true),
('Relleno de Extensiones', 'Mantenimiento de tus extensiones cada 2-3 semanas para lucir siempre perfecta.', 'pestanas', 45, 35.00, true, true, false),
('Pack Mirada Perfecta', 'Lifting de pestañas + tinte de pestañas + diseño de cejas. Todo lo que necesitas para una mirada espectacular.', 'pestanas', 75, 60.00, true, true, true);

-- ============================================
-- CATEGORÍAS DE PRODUCTOS
-- ============================================

INSERT INTO categorias_productos (nombre, slug, descripcion, icono, orden) VALUES
('Manicura', 'manicura', 'Esmaltes, tratamientos y accesorios para uñas', 'Hand', 1),
('Pedicura', 'pedicura', 'Productos especializados para el cuidado de pies', 'Footprints', 2),
('Facial', 'facial', 'Cremas, sérums y tratamientos faciales', 'Sparkles', 3),
('Corporal', 'corporal', 'Hidratantes, exfoliantes y aceites corporales', 'Heart', 4),
('Cabello', 'cabello', 'Champús, mascarillas y tratamientos capilares', 'Scissors', 5),
('Accesorios', 'accesorios', 'Herramientas y accesorios de belleza', 'Gem', 6),
('Kits', 'kits', 'Sets y packs especiales con descuento', 'Gift', 7);

-- ============================================
-- PRODUCTOS
-- ============================================

INSERT INTO productos (nombre, descripcion, descripcion_corta, categoria, precio, precio_oferta, stock, es_natural, es_vegano, es_cruelty_free, activo, destacado) VALUES
-- MANICURA
('Esmalte Natural Rosa Nude', 'Esmalte de uñas 10-free con fórmula vegana y sin tóxicos. Color rosa nude elegante que combina con todo. Larga duración y brillo intenso sin dañar tus uñas.', 'Esmalte 10-free vegano color rosa nude', 'manicura', 12.95, NULL, 50, true, true, true, true, true),
('Esmalte Natural Rojo Cereza', 'Esmalte de uñas 10-free con un rojo intenso y vibrante. Fórmula vegana de alta cobertura que no requiere múltiples capas.', 'Esmalte 10-free vegano rojo intenso', 'manicura', 12.95, NULL, 45, true, true, true, true, false),
('Aceite Cutículas Nutritivo', 'Aceite 100% natural para cutículas con vitamina E, aceite de jojoba y extracto de lavanda. Nutre, suaviza y fortalece las cutículas secas o dañadas.', 'Aceite nutritivo con vitamina E y lavanda', 'manicura', 14.50, NULL, 35, true, true, true, true, true),
('Endurecedor de Uñas Natural', 'Tratamiento fortalecedor para uñas débiles y quebradizas. Fórmula enriquecida con biotina, calcio y queratina vegetal.', 'Tratamiento fortalecedor con biotina', 'manicura', 16.95, NULL, 28, true, true, true, true, false),
('Top Coat Brillo Extremo', 'Capa superior de acabado ultra brillante y protección duradera. Seca en 60 segundos y protege el color hasta 7 días.', 'Top coat secado rápido ultra brillante', 'manicura', 11.95, NULL, 40, true, true, true, true, false),
('Quitaesmalte Sin Acetona', 'Quitaesmalte suave y efectivo sin acetona ni químicos agresivos. Enriquecido con vitamina E y aceite de almendras.', 'Quitaesmalte suave con vitamina E', 'manicura', 9.95, NULL, 60, true, true, true, true, false),

-- PEDICURA
('Crema Pies Reparadora', 'Crema intensiva para pies secos y agrietados con manteca de karité, urea al 10% y extracto de caléndula.', 'Crema intensiva con urea 10%', 'pedicura', 18.95, NULL, 42, true, true, true, true, true),
('Sales de Baño Relajantes', 'Sales de baño con magnesio del Mar Muerto, aceite esencial de eucalipto y menta. Relaja los pies cansados.', 'Sales del Mar Muerto con eucalipto', 'pedicura', 14.95, NULL, 55, true, true, true, true, false),
('Exfoliante Pies Piedra Pómez', 'Exfoliante cremoso con micropartículas de piedra pómez natural y aceite de coco.', 'Exfoliante natural con piedra pómez', 'pedicura', 13.50, NULL, 38, true, true, true, true, false),
('Spray Refrescante Pies', 'Spray refrescante con mentol, árbol de té y aloe vera. Alivia el cansancio, refresca y desodoriza.', 'Spray refrescante con mentol', 'pedicura', 11.95, 9.95, 48, true, true, true, true, true),

-- FACIAL
('Sérum Vitamina C', 'Sérum facial con 15% de vitamina C estabilizada, ácido hialurónico y vitamina E. Ilumina, unifica el tono y reduce manchas.', 'Sérum iluminador con 15% vitamina C', 'facial', 34.95, NULL, 30, true, true, true, true, true),
('Crema Hidratante Facial', 'Crema hidratante ligera con ácido hialurónico, extracto de pepino y aloe vera. Hidratación 24h sin sensación grasa.', 'Hidratante ligera con ácido hialurónico', 'facial', 28.95, NULL, 35, true, true, true, true, false),
('Mascarilla Arcilla Verde', 'Mascarilla purificante con arcilla verde francesa, árbol de té y extracto de té verde. Limpia profundamente los poros.', 'Mascarilla purificante de arcilla', 'facial', 19.95, NULL, 40, true, true, true, true, false),
('Contorno de Ojos Antiedad', 'Tratamiento específico para el contorno de ojos con retinol vegetal, cafeína y péptidos apply Reduce ojeras y bolsas.', 'Contorno antiedad con retinol vegetal', 'facial', 32.95, NULL, 25, true, true, true, true, true),
('Agua Micelar Natural', 'Agua micelar suave con agua de rosas, glicerina vegetal y extracto de manzanilla. Limpia y desmaquilla.', 'Agua micelar con agua de rosas', 'facial', 15.95, NULL, 50, true, true, true, true, false),

-- CORPORAL
('Aceite Corporal Nutritivo', 'Aceite seco multifunción con argán, rosa mosqueta y vitamina E. Nutre, repara y da luminosidad.', 'Aceite seco con argán y rosa mosqueta', 'corporal', 24.95, NULL, 32, true, true, true, true, true),
('Exfoliante Corporal Café', 'Exfoliante corporal con granos de café arábica, aceite de coco y extracto de vainilla. Activa la circulación.', 'Exfoliante anticelulítico de café', 'corporal', 21.95, NULL, 28, true, true, true, true, false),
('Manteca Corporal Karité', 'Manteca corporal ultra nutritiva con karité puro, cacao y aceite de almendras. Ideal para pieles muy secas.', 'Manteca ultra nutritiva de karité', 'corporal', 26.95, NULL, 22, true, true, true, true, false),
('Gel Ducha Avena', 'Gel de ducha suave con extracto de avena coloidal, miel y aloe vera. Limpia sin resecar.', 'Gel suave con avena y miel', 'corporal', 12.95, NULL, 45, true, false, true, true, false),

-- CABELLO
('Champú Natural Sin Sulfatos', 'Champú suave sin sulfatos, parabenos ni siliconas. Con extracto de coco, aloe vera y proteína de trigo.', 'Champú suave sin sulfatos ni siliconas', 'cabello', 16.95, NULL, 55, true, true, true, true, true),
('Mascarilla Capilar Reparadora', 'Mascarilla intensiva con aceite de argán, keratina vegetal y manteca de mango. Repara el cabello dañado.', 'Mascarilla reparadora con argán', 'cabello', 22.95, NULL, 30, true, true, true, true, false),
('Sérum Puntas Abiertas', 'Sérum reparador para puntas secas y abiertas con aceite de argán, jojoba y vitamina E.', 'Sérum reparador de puntas', 'cabello', 18.95, NULL, 35, true, true, true, true, false),

-- ACCESORIOS
('Set Limas de Cristal', 'Set de 3 limas de cristal templado de diferentes tamaños. Limado suave y preciso que sella la uña.', 'Set 3 limas de cristal con estuche', 'accesorios', 19.95, NULL, 40, false, true, true, true, false),
('Cepillo Facial Silicona', 'Cepillo limpiador facial de silicona suave con dos texturas. Limpia profundamente los poros.', 'Cepillo limpiador de silicona', 'accesorios', 14.95, NULL, 50, false, true, true, true, true),
('Esponja Konjac Carbón', 'Esponja konjac 100% natural con carbón activo. Ideal para pieles mixtas y grasas.', 'Esponja natural con carbón activo', 'accesorios', 8.95, NULL, 65, true, true, true, true, false),
('Neceser Algodón Orgánico', 'Neceser de viaje fabricado en algodón orgánico certificado GOTS. Forro impermeable interior.', 'Neceser ecológico de algodón orgánico', 'accesorios', 24.95, NULL, 25, true, true, true, true, false),

-- KITS
('Kit Manicura Completo', 'Todo lo que necesitas para una manicura perfecta en casa. Incluye: esmalte, top coat, aceite cutículas, quitaesmalte y lima.', 'Kit completo manicura natural', 'kits', 49.95, 39.95, 20, true, true, true, true, true),
('Kit Spa Pies', 'Tratamiento spa completo para tus pies. Incluye: sales de baño, exfoliante, crema reparadora y spray refrescante.', 'Kit completo spa para pies', 'kits', 54.95, 44.95, 18, true, true, true, true, true),
('Kit Rutina Facial', 'Rutina facial completa para una piel radiante. Incluye: agua micelar, sérum vitamina C, crema hidratante y contorno ojos.', 'Kit rutina facial completa', 'kits', 99.95, 79.95, 15, true, true, true, true, true),
('Kit Regalo Natural Beauty', 'El regalo perfecto para amantes de la belleza natural. Incluye: aceite corporal, gel ducha, manteca karité y neceser.', 'Kit regalo con productos estrella', 'kits', 79.95, 64.95, 12, true, false, true, true, true);

-- ============================================
-- HORARIOS DISPONIBLES
-- ============================================

INSERT INTO horarios (dia_semana, hora_inicio, hora_fin, activo) VALUES
-- Lunes a Viernes
(1, '09:00', '14:00', true),  -- Lunes mañana
(1, '16:00', '20:00', true),  -- Lunes tarde
(2, '09:00', '14:00', true),  -- Martes mañana
(2, '16:00', '20:00', true),  -- Martes tarde
(3, '09:00', '14:00', true),  -- Miércoles mañana
(3, '16:00', '20:00', true),  -- Miércoles tarde
(4, '09:00', '14:00', true),  -- Jueves mañana
(4, '16:00', '20:00', true),  -- Jueves tarde
(5, '09:00', '14:00', true),  -- Viernes mañana
(5, '16:00', '20:00', true),  -- Viernes tarde
-- Sábado
(6, '09:00', '14:00', true);  -- Sábado mañana

-- ============================================
-- FIN DE DATOS INICIALES
-- ============================================
