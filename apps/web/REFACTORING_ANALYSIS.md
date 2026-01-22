# Análisis y Estrategia de Refactorización - Frontend Web

## 📊 Análisis del Estado Actual

### Estructura Actual vs. Estructura Ideal

#### ✅ Módulos Bien Estructurados

**`modules/documents/`** - Estructura completa y correcta
```
documents/
├── components/        ✅
├── handlers/          ✅
├── hooks/             ✅
├── interfaces/        ✅ (pero 11 archivos - necesita consolidación)
├── pages/             ✅
├── routes.tsx         ✅
├── types/             ✅
└── utils/             ✅
```

**Problema menor:** Demasiados archivos de interfaces (11). Deberían consolidarse en menos archivos por responsabilidad.

---

#### ⚠️ Módulos Parcialmente Estructurados

**`modules/signature/`** - Falta estructura completa
```
signature/
├── components/        ✅
├── hooks/             ✅
├── interfaces/        ✅
├── pages/             ✅
├── routes.tsx         ✅
├── types/             ✅
├── handlers/          ❌ FALTA
└── utils/             ❌ FALTA
```

**`modules/auth/`** - Estructura mínima
```
auth/
├── components/        ✅
├── pages/             ✅
├── routes.tsx         ✅
├── hooks/             ❌ FALTA (lógica podría estar en frontend-core)
├── handlers/          ❌ FALTA
├── interfaces/        ✅ (parcial)
├── types/             ❌ FALTA
└── utils/             ❌ FALTA
```

**`modules/home/`** - Estructura básica
```
home/
├── components/        ✅
├── constants/         ✅
├── pages/             ✅
├── routes.tsx         ✅
├── hooks/             ❌ FALTA
├── handlers/          ❌ FALTA
├── interfaces/        ✅ (parcial, solo en components)
├── types/             ❌ FALTA
└── utils/             ❌ FALTA
```

---

#### ❌ Módulos con Problemas Críticos

**`modules/admin/`** - **ANTIPATRÓN: Página inline en routes.tsx**
```typescript
// ❌ MAL: routes.tsx contiene el componente de página
function AdminDashboardPage(): ReactElement {
  return <PageLayout>...</PageLayout>;
}

export function adminRoutes() {
  return [{ path: '/admin', element: <AdminDashboardPage /> }];
}
```

**Debería ser:**
```
admin/
├── pages/
│   └── AdminDashboardPage.tsx  ✅ Página separada
├── routes.tsx                  ✅ Solo rutas
└── index.ts
```

---

#### 🔴 Módulos Vacíos/Esqueletos (Solo routes.tsx)

Estos módulos solo tienen `routes.tsx` con rutas vacías:
- `modules/calendar/` - `calendarRoutes() { return []; }`
- `modules/cases/` - Solo estructura vacía
- `modules/chatbot/` - Solo estructura vacía
- `modules/discovery/` - Solo estructura vacía
- `modules/kyc/` - Solo estructura vacía
- `modules/memberships/` - Solo estructura vacía
- `modules/notifications/` - Solo estructura vacía
- `modules/payments/` - Solo estructura vacía
- `modules/users/` - Solo estructura vacía

**Problema:** Crean ruido y confusión. Deberían:
1. Eliminarse si no se van a usar pronto, o
2. Crearse con estructura mínima correcta si están planificados

---

### 🔍 Problemas de Organización Identificados

#### 1. Inconsistencia en Interfaces vs Types

**Problema:** Algunos módulos tienen `interfaces/`, otros tienen `types/`, y algunos tienen ambos.

**Estándar propuesto:**
- `interfaces/` - Interfaces TypeScript para hooks, handlers, componentes complejos, configuraciones
- `types/` - Tipos simples para props de componentes, tipos de datos, enums

**Estado actual:**
- `documents/` - Tiene ambos (interfaces/ con 11 archivos, types/ con 5 archivos) ✅ Pero necesita consolidación
- `signature/` - Solo interfaces/ (falta types/) ⚠️
- `auth/` - Interfaces solo en components/ ⚠️
- `home/` - Interfaces solo en components/ ⚠️

#### 2. Consolidación de Interfaces

**`documents/interfaces/` tiene 11 archivos:**
```
DocumentsComponentsInterfaces.ts
DocumentsHooksInterfaces.ts
ElementTypePopoverInterfaces.ts
ModalStateInterfaces.ts
PdfElementInteractionInterfaces.ts
PdfElementOverlayInterfaces.ts
PdfFileUploadInterfaces.ts
PdfGenerationInterfaces.ts
PdfPageCanvasInterfaces.ts
PdfPageRendererInterfaces.ts
PendingElementStateInterfaces.ts
WebElementInteractionHandlerInterfaces.ts
```

**Estrategia de consolidación:**
- Agrupar por responsabilidad (no un archivo por hook)
- `ComponentsInterfaces.ts` - Todas las interfaces de componentes
- `HooksInterfaces.ts` - Todas las interfaces de hooks
- `HandlersInterfaces.ts` - Interfaces de handlers
- `UtilsInterfaces.ts` - Interfaces de utilidades (si las hay)

#### 3. ui-kit Estructura Inconsistente

**Problema:** ui-kit tiene diferentes estructuras:

**`buttons/`** tiene:
```
buttons/
├── interfaces/
├── types/
├── constants/
```

**`layout/`** tiene:
```
layout/
├── components/
├── interfaces/
├── hooks/
├── enums/
├── config/
```

**Estándar propuesto para ui-kit:**
```
ui-kit/{component}/
├── {Component}.tsx          # Componente principal
├── {Component}Variants.tsx  # Variantes (si aplica)
├── constants/               # Constantes (estilos, tamaños, etc.)
├── interfaces/              # Interfaces TypeScript (consolidadas)
├── types/                   # Tipos simples, enums
├── components/              # Subcomponentes (si aplica)
└── index.ts                 # Barrel export
```

---

### 🎯 Problemas de Responsabilidades

#### Código que debería estar en `frontend-core` pero está en `web`:

1. **`modules/documents/hooks/useCheckUserEmail.ts`**
   - Es lógica de negocio (verificar si email es usuario registrado)
   - Debería estar en `packages/frontend-core/src/modules/auth/hooks/`

2. **`app/store/useAppStore.ts` y `useAuthStore.ts`**
   - Si son compartidos entre web y mobile → `frontend-core`
   - Si son solo web → OK quedarse aquí

#### Código que está bien en `web` (usa APIs del navegador):

- `useModalState` - Maneja estado UI web (modales, popovers)
- `usePendingElementState` - Preview de elementos antes de colocarlos
- `usePdfFileUpload` - Usa File API del navegador
- `usePdfPageRenderer` - Renderiza canvas en el navegador
- `WebElementInteractionHandler` - Maneja eventos del DOM
- `downloadPdfFile` - Descarga archivos (navegador)

---

## 📐 Estructura Objetivo (Refactorizada)

### Estructura Propuesta por Módulo

```
modules/{feature}/
├── components/              # Componentes React específicos del módulo
│   ├── {Component}.tsx
│   ├── interfaces/          # Interfaces solo de componentes (opcional, si son muchas)
│   └── index.ts
├── pages/                   # Componentes de página (routes)
│   ├── {Page}Page.tsx
│   └── index.ts
├── hooks/                   # Hooks web-specific (File API, DOM, etc.)
│   └── index.ts
├── handlers/                # Event handlers, adapters (opcional, si es complejo)
│   └── index.ts
├── interfaces/              # Interfaces TypeScript (consolidadas)
│   ├── ComponentsInterfaces.ts    # Interfaces de componentes
│   ├── HooksInterfaces.ts         # Interfaces de hooks
│   ├── HandlersInterfaces.ts      # Interfaces de handlers (si aplica)
│   └── index.ts
├── types/                   # Tipos simples, props, enums
│   └── index.ts
├── utils/                   # Utilidades web-specific (opcional)
│   └── index.ts
├── constants/               # Constantes del módulo (opcional)
│   └── index.ts
├── routes.tsx               # Configuración de rutas
└── index.ts                 # Barrel export público
```

### Reglas de Decisión: ¿Qué va dónde?

#### `components/` vs `pages/`
- **`components/`**: Componentes reutilizables dentro del módulo
- **`pages/`**: Componentes de nivel de ruta que se renderizan en el router

#### `interfaces/` vs `types/`
- **`interfaces/`**: Interfaces complejas para hooks, handlers, configuraciones
- **`types/`**: Tipos simples para props de componentes, tipos de datos, enums

#### `hooks/` vs `handlers/`
- **`hooks/`**: React hooks (usan useState, useEffect, etc.)
- **`handlers/`**: Clases o funciones que manejan eventos complejos o son adapters

#### ¿Cuándo crear una carpeta?
- Crear carpeta solo si tiene **más de 2-3 archivos** relacionados
- Si tiene 1-2 archivos, ponerlos en la raíz del módulo con buena organización

---

## 🚀 Estrategia de Refactorización

### Opción 1: Refactorización Incremental (RECOMENDADA) ⭐

**Ventajas:**
- Riesgo bajo, cambios pequeños
- No interrumpe desarrollo activo
- Permite probar cada módulo refactorizado
- Fácil de revertir si hay problemas

**Desventajas:**
- Toma más tiempo total
- Código coexiste (viejo y nuevo) temporalmente

**Plan de Ejecución:**

#### Fase 1: Preparación (1-2 días)
1. Crear estructura base refactorizada en paralelo
2. Documentar estándares finales
3. Crear scripts/templates para nuevo código

#### Fase 2: Módulos Críticos (1 semana)
1. **`admin/`** - Refactorizar primero (es el más problemático)
   - Mover `AdminDashboardPage` a `pages/`
   - Limpiar `routes.tsx`
2. **`auth/`** - Completar estructura
   - Agregar `hooks/`, `handlers/` si es necesario
   - Mover lógica a frontend-core si corresponde
3. **`signature/`** - Completar estructura
   - Agregar `handlers/` y `utils/` si son necesarios

#### Fase 3: Módulos Completos (1 semana)
1. **`documents/`** - Consolidar interfaces
   - Reducir 11 archivos de interfaces a 3-4 archivos consolidados
   - Verificar que todo funcione después de consolidación
2. **`home/`** - Completar estructura
   - Agregar carpetas faltantes si es necesario

#### Fase 4: Limpieza (2-3 días)
1. **Módulos vacíos** - Decidir:
   - Eliminar si no se usarán en 3 meses
   - O crear estructura mínima si están planificados
2. **ui-kit** - Estandarizar estructura
   - Consolidar interfaces donde sea necesario
   - Asegurar estructura consistente

#### Fase 5: Validación (1-2 días)
1. Ejecutar tests
2. Verificar que todo compile
3. Verificar que no haya imports rotos
4. Actualizar documentación

**Cronograma Total: ~3 semanas**

---

### Opción 2: Refactorización en Paralelo (Arriesgada)

**Ventajas:**
- Más rápido en teoría
- Cambios más limpios

**Desventajas:**
- Alto riesgo de romper cosas
- Difícil de testear incrementalmente
- Puede interrumpir desarrollo activo
- Difícil de revertir

**No recomendada** a menos que puedas detener el desarrollo activo.

---

## 📋 Plan Detallado de Refactorización (Opción 1 - Incremental)

### Paso 1: Crear Estructura Base y Estándares

1. **Crear documento de estándares** (este archivo)
2. **Crear templates/base para nuevos módulos:**
   ```
   templates/module-template/
   ├── components/
   │   └── index.ts
   ├── pages/
   │   └── index.ts
   ├── hooks/
   │   └── index.ts
   ├── interfaces/
   │   └── index.ts
   ├── types/
   │   └── index.ts
   ├── routes.tsx
   └── index.ts
   ```

### Paso 2: Refactorizar Módulo `admin/` (Prioridad Alta)

**Estado actual:**
```typescript
// routes.tsx tiene el componente inline
```

**Acciones:**
1. Crear `modules/admin/pages/AdminDashboardPage.tsx`
2. Mover componente de `routes.tsx` a la página
3. Actualizar `routes.tsx` para importar la página
4. Verificar que funcione
5. Ejecutar tests

**Tiempo estimado: 1-2 horas**

---

### Paso 3: Completar Estructura de `auth/`

**Acciones:**
1. Revisar si hay lógica que debería estar en `hooks/`
2. Crear `hooks/` si es necesario
3. Crear `types/` para tipos de props
4. Consolidar `interfaces/` en una ubicación central
5. Verificar que todo funcione

**Tiempo estimado: 2-3 horas**

---

### Paso 4: Completar Estructura de `signature/`

**Acciones:**
1. Evaluar si necesita `handlers/` (para eventos complejos)
2. Evaluar si necesita `utils/` (funciones auxiliares)
3. Crear carpetas si son necesarias
4. Mover código si corresponde

**Tiempo estimado: 2-3 horas**

---

### Paso 5: Consolidar Interfaces de `documents/`

**Estado actual:** 11 archivos de interfaces

**Estrategia de consolidación:**
```
interfaces/
├── ComponentsInterfaces.ts    # Consolida:
│   - DocumentsComponentsInterfaces.ts
│   - ElementTypePopoverInterfaces.ts
│   - PdfPageCanvasInterfaces.ts
├── HooksInterfaces.ts         # Consolida:
│   - DocumentsHooksInterfaces.ts
│   - ModalStateInterfaces.ts
│   - PdfElementInteractionInterfaces.ts
│   - PdfElementOverlayInterfaces.ts
│   - PdfFileUploadInterfaces.ts
│   - PdfGenerationInterfaces.ts
│   - PdfPageRendererInterfaces.ts
│   - PendingElementStateInterfaces.ts
├── HandlersInterfaces.ts      # Consolida:
│   - WebElementInteractionHandlerInterfaces.ts
└── index.ts
```

**Acciones:**
1. Crear archivos consolidados
2. Mover interfaces a archivos consolidados
3. Actualizar todos los imports
4. Eliminar archivos antiguos
5. Verificar que compile y funcione
6. Ejecutar tests

**Tiempo estimado: 4-6 horas**

---

### Paso 6: Completar Estructura de `home/`

**Acciones:**
1. Evaluar si necesita `hooks/`, `handlers/`, `utils/`
2. Crear carpetas si son necesarias
3. Consolidar interfaces en `interfaces/` central
4. Crear `types/` si es necesario

**Tiempo estimado: 1-2 horas**

---

### Paso 7: Estandarizar `ui-kit/`

**Acciones:**
1. Revisar cada componente en ui-kit
2. Consolidar estructuras inconsistentes
3. Asegurar que todos sigan el patrón:
   ```
   ui-kit/{component}/
   ├── {Component}.tsx
   ├── constants/ (si aplica)
   ├── interfaces/ (consolidadas)
   ├── types/ (si aplica)
   └── index.ts
   ```

**Tiempo estimado: 3-4 horas**

---

### Paso 8: Limpieza de Módulos Vacíos

**Decisión por módulo:**

| Módulo | Decisión | Acción |
|--------|----------|--------|
| `calendar/` | Evaluar uso | Eliminar o crear estructura mínima |
| `cases/` | Evaluar uso | Eliminar o crear estructura mínima |
| `chatbot/` | Evaluar uso | Eliminar o crear estructura mínima |
| `discovery/` | Evaluar uso | Eliminar o crear estructura mínima |
| `kyc/` | Evaluar uso | Eliminar o crear estructura mínima |
| `memberships/` | Evaluar uso | Eliminar o crear estructura mínima |
| `notifications/` | Evaluar uso | Eliminar o crear estructura mínima |
| `payments/` | Evaluar uso | Eliminar o crear estructura mínima |
| `users/` | Evaluar uso | Eliminar o crear estructura mínima |

**Si se eliminan:**
- Remover de `router.tsx`
- Eliminar carpetas
- Limpiar imports

**Si se crean con estructura mínima:**
```
{module}/
├── pages/
│   └── {Module}Page.tsx (placeholder)
├── routes.tsx
└── index.ts
```

**Tiempo estimado: 2-3 horas**

---

### Paso 9: Mover Código a `frontend-core` (si aplica)

**Código a evaluar para mover:**

1. **`useCheckUserEmail`** → `packages/frontend-core/src/modules/auth/hooks/`
   - Es lógica de negocio, no depende de APIs web

2. **`useAppStore`, `useAuthStore`** → Evaluar
   - Si son compartidos → mover a frontend-core
   - Si son solo web → quedarse aquí

**Acciones:**
1. Evaluar cada hook/store
2. Mover a frontend-core si corresponde
3. Actualizar imports en web
4. Re-exportar desde frontend-core
5. Verificar que todo funcione

**Tiempo estimado: 3-4 horas**

---

### Paso 10: Validación Final

**Checklist:**
- [ ] Todos los tests pasan
- [ ] Build compila sin errores
- [ ] No hay imports rotos
- [ ] No hay warnings de TypeScript
- [ ] Documentación actualizada
- [ ] Code coverage se mantiene >90%
- [ ] Linter pasa sin errores

**Tiempo estimado: 2-3 horas**

---

## 📊 Resumen de Tiempos

| Fase | Tareas | Tiempo Estimado |
|------|--------|-----------------|
| Fase 1 | Preparación y estándares | 1-2 días |
| Fase 2 | Módulos críticos (admin, auth, signature) | 1 semana |
| Fase 3 | Módulos completos (documents, home) | 1 semana |
| Fase 4 | Limpieza (módulos vacíos, ui-kit) | 2-3 días |
| Fase 5 | Validación final | 1-2 días |
| **TOTAL** | | **~3 semanas** |

---

## 🎯 Recomendaciones Finales

### Prioridad de Refactorización

1. **ALTA** - `admin/` (antipatrón crítico)
2. **ALTA** - Consolidar interfaces de `documents/` (mejora mantenibilidad)
3. **MEDIA** - Completar `auth/` y `signature/`
4. **MEDIA** - Estandarizar `ui-kit/`
5. **BAJA** - Limpiar módulos vacíos
6. **BAJA** - Mover código a frontend-core (evaluar caso por caso)

### Estrategia Recomendada

✅ **Usar Opción 1: Refactorización Incremental**
- Refactorizar un módulo a la vez
- Validar después de cada módulo
- Documentar cambios
- No interrumpir desarrollo activo

### Siguiente Paso

1. **Revisar este documento** con el equipo
2. **Aprobar estrategia** y prioridades
3. **Crear issues/tickets** para cada fase
4. **Iniciar con Fase 1** (admin module)

---

## 📝 Checklist de Refactorización por Módulo

Para cada módulo refactorizado, verificar:

- [ ] Estructura de carpetas sigue el estándar
- [ ] `routes.tsx` solo contiene configuración de rutas
- [ ] Páginas están en `pages/`
- [ ] Componentes están en `components/`
- [ ] Interfaces consolidadas en `interfaces/`
- [ ] Tipos simples en `types/`
- [ ] Hooks en `hooks/`
- [ ] Handlers en `handlers/` (si aplica)
- [ ] Utils en `utils/` (si aplica)
- [ ] `index.ts` exporta correctamente
- [ ] Todos los imports funcionan
- [ ] Tests pasan
- [ ] Build compila
- [ ] Linter pasa

---

*Documento creado: $(date)*
*Última actualización: $(date)*

