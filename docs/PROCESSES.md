# The Lobby Beauty — Flujos de Negocio

## 1. Reserva de cita (cliente)

Flujo completo desde que la clienta decide reservar hasta que recibe confirmación.

```mermaid
flowchart TD
    A[Clienta visita /reservar] --> B[Paso 1: Elige servicio]
    B --> C[Paso 2: Elige fecha en calendario]
    C --> D{¿Hay disponibilidad?}
    D -->|No| C
    D -->|Sí| E[Selecciona franja horaria]
    E --> F[Paso 3: Introduce datos personales]
    F --> G{¿Email/teléfono ya existe en CRM?}
    G -->|Sí| H[Actualiza cliente existente]
    G -->|No| I[Crea nuevo cliente en CRM]
    H --> J[Crea reserva en BD]
    I --> J
    J --> K[Vincula reserva al cliente]
    K --> L[Incrementa total_reservas del cliente]
    L --> M{¿Resend configurado?}
    M -->|Sí| N[Envía email confirmación]
    M -->|No| O[Skip email]
    N --> P{¿Twilio configurado?}
    O --> P
    P -->|Sí| Q[Envía WhatsApp confirmación]
    P -->|No| R[Skip WhatsApp]
    Q --> S[Paso 4: Muestra confirmación con referencia]
    R --> S
```

**Actores:** Clienta, Sistema (backend), CRM, Resend (email), Twilio (WhatsApp)

**Validaciones:**
- El servicio debe estar activo
- La fecha debe ser futura
- No puede haber otra reserva no-cancelada en la misma fecha/hora
- La duración del servicio no debe solapar con otras reservas

**Errores posibles:**
- Servicio no encontrado o inactivo → Error 404
- Horario ya ocupado (reservado entre petición y confirmación) → Error 400
- Fallos de email/WhatsApp → Se registran pero no bloquean la reserva

---

## 2. Compra online (e-commerce)

Flujo desde que la clienta añade productos al carrito hasta que recibe el pedido.

```mermaid
flowchart TD
    A[Clienta navega /tienda] --> B[Añade productos al carrito]
    B --> C[Revisa carrito /carrito]
    C --> D{¿Total > 50€?}
    D -->|Sí| E[Envío gratuito]
    D -->|No| F[Envío 4,95€]
    E --> G[Procede al checkout]
    F --> G
    G --> H[Introduce datos de envío]
    H --> I[Backend crea Stripe Checkout Session]
    I --> J[Redirect a página de pago Stripe]
    J --> K{¿Pago exitoso?}
    K -->|No| L[Vuelve al carrito]
    K -->|Sí| M[Stripe webhook notifica al backend]
    M --> N[Backend crea pedido en BD]
    N --> O[Crea items del pedido]
    O --> P{¿Email/teléfono existe en CRM?}
    P -->|Sí| Q[Actualiza cliente]
    P -->|No| R[Crea cliente en CRM]
    Q --> S[Vincula pedido al cliente]
    R --> S
    S --> T[Envía email confirmación a clienta]
    T --> U[Notifica admin por email]
    U --> V[Redirect a /pago-exitoso]
```

**Actores:** Clienta, Frontend (carrito localStorage), Backend, Stripe, CRM, Resend

**Datos del pedido:**
- Productos con cantidades y precios
- Dirección de envío completa
- ID de sesión Stripe
- Estado inicial: "pagado" (si webhook OK) o "pendiente"

**Fallback:**
- Si el webhook de Stripe no llega, existe endpoint `verify-session` que la clienta puede usar al volver a la página de éxito

---

## 3. Gestión de cobros (admin)

Flujo para registrar el cobro efectivo de un pedido y reflejarlo en tesorería.

```mermaid
flowchart TD
    A[Admin ve pedidos pendientes de cobro] --> B[Selecciona pedido]
    B --> C[Elige método de cobro]
    C --> D{Método}
    D -->|Efectivo| E[Cuenta: Caja Efectivo]
    D -->|Tarjeta/TPV| F[Cuenta: Banco Principal]
    D -->|Transferencia| F
    E --> G[Registra cobro en pedido]
    F --> G
    G --> H[Crea movimiento de caja tipo 'ingreso']
    H --> I[Trigger actualiza balance de cuenta]
    I --> J[Pedido marcado como cobrado]
```

**Actores:** Admin, Sistema

**Campos registrados:**
- Método de cobro (efectivo, tarjeta, TPV, transferencia)
- Fecha de cobro
- Cuenta destino (automática según método)

---

## 4. Control de gastos (ERP)

Flujo de registro y pago de gastos del negocio.

```mermaid
flowchart TD
    A[Admin registra gasto] --> B{¿Es recurrente?}
    B -->|Sí| C[Configura frecuencia y fechas]
    B -->|No| D[Gasto puntual]
    C --> E[Guarda gasto con recurrencia]
    D --> E
    E --> F[Gasto en estado 'pendiente de pago']
    F --> G{Admin marca como pagado}
    G --> H{¿Crear movimiento de caja?}
    H -->|Sí| I[Selecciona cuenta de pago]
    I --> J[Crea movimiento tipo 'gasto']
    J --> K[Trigger actualiza balance cuenta]
    K --> L[Gasto marcado como pagado]
    H -->|No| L
```

**Recurrencia:**
- Frecuencias: semanal, quincenal, mensual, bimestral, trimestral, semestral, anual
- Se puede definir fecha de inicio y fin de recurrencia
- El gasto padre genera ocurrencias hijas

---

## 5. Cierre de caja diario

Proceso de reconciliación de caja al final del día.

```mermaid
flowchart TD
    A[Admin inicia cierre de caja] --> B[Selecciona cuenta]
    B --> C[Sistema calcula balance teórico]
    C --> D[Suma todos los movimientos del día]
    D --> E[Balance apertura + ingresos - gastos = cierre teórico]
    E --> F[Admin cuenta dinero real]
    F --> G[Introduce balance real contado]
    G --> H[Sistema calcula diferencia]
    H --> I{¿Diferencia = 0?}
    I -->|Sí| J[Cierre OK ✓]
    I -->|No| K[Registra descuadre]
    J --> L[Guarda cierre en BD]
    K --> L
    L --> M[El balance de cierre se usa como apertura del día siguiente]
```

**Datos del cierre:**
- Balance de apertura
- Total ingresos del día (desglosado por tipo)
- Total gastos del día (desglosado por tipo)
- Balance cierre teórico (calculado)
- Balance cierre real (contado)
- Diferencia (automática)
- Número de operaciones
- Notas del operador

---

## 6. CRM automático — Creación de cliente

Flujo interno que ocurre automáticamente con cada reserva o pedido.

```mermaid
sequenceDiagram
    participant R as Reserva/Pedido
    participant B as Backend
    participant CRM as Tabla clientes
    participant Link as Tabla link

    R->>B: Nueva reserva/pedido con email y teléfono
    B->>CRM: ¿Existe cliente con este email?
    alt Email encontrado
        CRM-->>B: Cliente existente (ID)
        B->>CRM: Actualizar datos si más completos
    else Email no encontrado
        B->>CRM: ¿Existe cliente con este teléfono?
        alt Teléfono encontrado
            CRM-->>B: Cliente existente (ID)
            B->>CRM: Actualizar datos
        else No encontrado
            B->>CRM: Crear nuevo cliente
            CRM-->>B: Nuevo ID
        end
    end
    B->>Link: Vincular reserva/pedido al cliente
    B->>CRM: Incrementar total_reservas o total_pedidos
    B->>CRM: Actualizar ultima_visita o ultima_compra
```

**Origen asignado:**
- Desde reserva web → `origen: 'reserva'`
- Desde pedido web → `origen: 'pedido'`
- Creado manualmente por admin → `origen: 'manual'`
- Importado desde CSV → `origen: 'importacion'`

---

## 7. Cancelación de reserva

```mermaid
flowchart TD
    A[Clienta o Admin cancela reserva] --> B[Backend actualiza estado a 'cancelada']
    B --> C{¿Resend configurado?}
    C -->|Sí| D[Envía email de cancelación]
    C -->|No| E[Skip]
    D --> F{¿Twilio configurado?}
    E --> F
    F -->|Sí| G[Envía WhatsApp de cancelación]
    F -->|No| H[Skip]
    G --> I[Horario liberado para nuevas reservas]
    H --> I
```

**Nota:** La restricción UNIQUE en `reservas(fecha, hora) WHERE estado != 'cancelada'` permite que al cancelar, el horario quede libre automáticamente para nuevas reservas.

---

## 8. Transferencia entre cuentas

```mermaid
flowchart TD
    A[Admin inicia transferencia] --> B[Selecciona cuenta origen]
    B --> C[Selecciona cuenta destino]
    C --> D[Introduce importe y concepto]
    D --> E[Backend crea movimiento tipo 'gasto' en cuenta origen]
    E --> F[Backend crea movimiento tipo 'ingreso' en cuenta destino]
    F --> G[Vincula ambos movimientos entre sí]
    G --> H[Triggers actualizan balances de ambas cuentas]
```

**Datos registrados:**
- Ambos movimientos con `referencia_tipo: 'transferencia'`
- Campo `cuenta_destino_id` en el movimiento origen
- Campo `movimiento_relacionado_id` vincula los dos movimientos
