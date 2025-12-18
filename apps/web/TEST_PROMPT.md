# Prompt para Crear Tests de Apps/Web

## Contexto

Eres un desarrollador senior creando unit tests para la aplicación web `@lawprotect/web` usando Jest y React Testing Library. El objetivo es alcanzar **90% de code coverage** siguiendo las mejores prácticas de testing para aplicaciones React.

## Estructura del Proyecto

La aplicación `apps/web` tiene la siguiente estructura:

```
apps/web/
├── src/
│   ├── app/                # App-level configuration (routing, layout, providers, store)
│   ├── modules/            # Feature modules (Screaming Architecture)
│   │   ├── home/          # Home module (pages, components, constants)
│   │   ├── documents/     # Documents module (components, hooks, handlers, pages)
│   │   ├── auth/          # Auth module (routes)
│   │   └── ...            # Otros módulos
│   ├── ui-kit/            # Reusable UI components (web-only)
│   │   ├── buttons/       # Button components
│   │   ├── carousel/      # Carousel components
│   │   ├── forms/         # Form components
│   │   ├── layout/        # Layout components
│   │   └── ...            # Otros componentes UI
│   ├── i18n/              # Web i18n config (imports from frontend-core)
│   └── main.tsx           # Entry point
├── __tests__/
│   ├── helpers/           # Test utilities (mocks, fixtures, test-helpers)
│   └── [misma estructura que src/]
└── __mocks__/             # Jest automáticos mocks
```

## Configuración Existente

- **Jest config**: `jest.config.cjs` (extiende `jest.base.cjs` del monorepo)
- **Test environment**: `jsdom` (para componentes React)
- **Module mappers**: Configurados para `@app/`, `@ui-kit/`, `@lawprotect/frontend-core`
- **Setup file**: `__tests__/setup.ts` (configuración global de tests)
- **Helpers existentes**: 
  - `__tests__/helpers/mocks.ts` - Factories para mocks (QueryClient, Router, localStorage, etc.)
  - `__tests__/helpers/test-helpers.ts` - Utilities (assertions, waitFor, etc.)
  - `__tests__/helpers/fixtures.ts` - Test data (users, routes, components props, etc.)

## Comandos de Testing

```bash
# Run all tests
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run tests with coverage
npm run test:unit:coverage
```

## Tareas

Crea unit tests completos para los siguientes módulos de `apps/web`, siguiendo estas reglas:

### Reglas Generales

1. **Estructura de archivos**: 
   - Crear test files en `__tests__/` manteniendo la misma estructura que `src/`
   - Naming: `[filename].test.ts` o `[filename].test.tsx` para componentes React

2. **Organización de tests**:
   - Usar `describe` blocks para agrupar tests lógicos
   - Usar nombres descriptivos: `it('should [acción] when [condición]', () => { ... })`
   - Seguir el patrón AAA: Arrange, Act, Assert

3. **Mocks y Helpers**:
   - **SIEMPRE** usar factories de `__tests__/helpers/mocks.ts` para crear mocks
   - **SIEMPRE** usar utilities de `__tests__/helpers/test-helpers.ts` cuando aplique
   - **SIEMPRE** usar fixtures de `__tests__/helpers/fixtures.ts` para datos de test
   - Mockear todas las dependencias externas (APIs, routing, storage)

4. **Cobertura**:
   - Alcanzar **90% coverage** mínimo
   - Probar todos los branches (if/else, switch, ternaries)
   - Probar edge cases (null, undefined, empty arrays, errors)
   - Probar error paths y validaciones
   - Probar interacciones de usuario (clicks, inputs, navigation)

5. **Testing Patterns**:
   - **React Components**: Usar `render` o `renderWithProviders` de `@testing-library/react`
   - **Hooks**: Usar `renderHook` de `@testing-library/react-hooks`
   - **Routing**: Usar `createRouterWrapper` o `MemoryRouter` para tests de routing
   - **React Query**: Usar `createQueryClientWrapper` o `createAppWrapper`
   - **User Interactions**: Usar `userEvent` de `@testing-library/user-event`

6. **Test Isolation**:
   - Cada test debe ser independiente
   - Usar `beforeEach` para setup, no compartir estado
   - Limpiar mocks con `jest.clearAllMocks()` en `beforeEach`
   - Limpiar QueryClient entre tests

### Módulos a Testear

#### 1. UI Kit Components

**`src/ui-kit/buttons/`**
- `Button.tsx` - Componente de botón reutilizable
- `IconButton.tsx` - Botón con ícono

**`src/ui-kit/carousel/`**
- `components/Carousel.tsx` - Componente de carousel
- `components/CarouselSlide.tsx` - Slide individual
- `components/CarouselIndicators.tsx` - Indicadores del carousel

**`src/ui-kit/forms/`**
- `TextField.tsx` - Campo de texto
- `Select.tsx` - Select dropdown

**`src/ui-kit/layout/`**
- `Header.tsx` - Header de la aplicación
- `PageLayout.tsx` - Layout de página
- `Section.tsx` - Sección de contenido
- `components/*` - Componentes de layout (GrayColumn, DecorativeSVG, etc.)

**`src/ui-kit/modals/`**
- `Modal.tsx` - Modal base
- `ConfirmModal.tsx` - Modal de confirmación

**`src/ui-kit/feedback/`**
- `Alert.tsx` - Componente de alerta
- `Toast.tsx` - Notificación toast
- `SpinnerOverlay.tsx` - Spinner de carga

#### 2. App-Level Code

**`src/app/`**
- `providers/AppProviders.tsx` - Providers de la app (QueryClient, Router, etc.)
- `layout/AppLayout.tsx` - Layout principal de la app
- `routing/router.tsx` - Configuración de rutas
- `routing/guards.tsx` - Route guards (autenticación, permisos)
- `store/useAuthStore.ts` - Zustand store de autenticación
- `store/useAppStore.ts` - Zustand store principal
- `adapters/LocalStorageAdapter.ts` - Adapter para localStorage
- `config/env.ts` - Configuración de variables de entorno

#### 3. Feature Modules

**`src/modules/home/`**
- `pages/HomePage.tsx` - Página principal
- `pages/OurServicesPage.tsx` - Página de servicios
- `pages/Sign365Page.tsx` - Página de Sign 365
- `components/HeroSection.tsx` - Sección hero
- `components/StepCard.tsx` - Tarjeta de paso
- `constants/getCarouselSlides.ts` - Constantes del carousel

**`src/modules/documents/`**
- `pages/SignDocumentPage.tsx` - Página de firma de documentos
- `components/PDFViewer.tsx` - Visor de PDF
- `components/SignatureCanvas.tsx` - Canvas de firma
- `components/TextInputModal.tsx` - Modal de input de texto
- `components/DateInputModal.tsx` - Modal de input de fecha
- `hooks/usePdfFileUpload.ts` - Hook para upload de PDF
- `hooks/usePdfGeneration.ts` - Hook para generación de PDF
- `hooks/usePdfElementInteraction.ts` - Hook para interacción con elementos PDF
- `hooks/useModalState.ts` - Hook para estado de modales
- `handlers/WebElementInteractionHandler.ts` - Handler de interacciones
- `utils/downloadPdfFile.ts` - Utilidad para descargar PDF

**`src/modules/auth/`**
- `routes.tsx` - Rutas de autenticación

**Otros módulos** (admin, calendar, cases, etc.)
- `routes.tsx` - Rutas del módulo

#### 4. i18n

**`src/i18n/`**
- `config/i18n.web.ts` - Configuración de i18n para web

### Ejemplo de Test File para Componente React

```typescript
/**
 * @fileoverview Tests for Button component
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../src/ui-kit/buttons/Button';
import { mockButtonProps } from '../helpers/fixtures';

describe('Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when rendered with default props', () => {
    it('should render button with text', () => {
      // Arrange
      const text = 'Click me';

      // Act
      render(<Button>{text}</Button>);

      // Assert
      expect(screen.getByRole('button', { name: text })).toBeInTheDocument();
    });
  });

  describe('when clicked', () => {
    it('should call onClick handler', async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click me</Button>);

      // Act
      await user.click(screen.getByRole('button'));

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('when disabled', () => {
    it('should not call onClick handler', async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = jest.fn();
      render(<Button onClick={handleClick} disabled>Click me</Button>);

      // Act
      await user.click(screen.getByRole('button'));

      // Assert
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
```

### Ejemplo de Test File para Hook

```typescript
/**
 * @fileoverview Tests for usePdfFileUpload hook
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { usePdfFileUpload } from '../../src/modules/documents/hooks/usePdfFileUpload';
import { createAppWrapper } from '../helpers/mocks';
import { mockPdfFile } from '../helpers/fixtures';

describe('usePdfFileUpload', () => {
  let wrapper: ReturnType<typeof createAppWrapper>;

  beforeEach(() => {
    wrapper = createAppWrapper();
    jest.clearAllMocks();
  });

  describe('when file is uploaded', () => {
    it('should process PDF file', async () => {
      // Arrange
      const { result } = renderHook(() => usePdfFileUpload(), { wrapper });

      // Act
      await result.current.uploadFile(mockPdfFile);

      // Assert
      await waitFor(() => {
        expect(result.current.file).toBeDefined();
      });
    });
  });
});
```

### Ejemplo de Test File para Página con Routing

```typescript
/**
 * @fileoverview Tests for HomePage
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderWithProviders } from '../helpers/mocks';
import { HomePage } from '../../src/modules/home/pages/HomePage';

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render carousel', () => {
    // Arrange & Act
    renderWithProviders(<HomePage />);

    // Assert
    expect(screen.getByRole('region', { name: /carousel/i })).toBeInTheDocument();
  });

  it('should render Sign 365 promo section', () => {
    // Arrange & Act
    renderWithProviders(<HomePage />);

    // Assert
    expect(screen.getByText(/sign 365/i)).toBeInTheDocument();
  });
});
```

### Checklist para Cada Test File

- [ ] File creado en `__tests__/` con estructura correcta
- [ ] Imports correctos (usar paths relativos desde `__tests__/`)
- [ ] Mocks creados usando factories de `helpers/mocks.ts`
- [ ] Test data usando fixtures de `helpers/fixtures.ts`
- [ ] Tests organizados con `describe` blocks lógicos
- [ ] Todos los branches cubiertos
- [ ] Edge cases probados (null, undefined, empty, errors)
- [ ] Error paths probados
- [ ] User interactions probados (clicks, inputs, navigation)
- [ ] Tests independientes y aislados
- [ ] Nombres descriptivos
- [ ] Coverage >= 90% para el archivo

### Comandos para Verificar

```bash
# Ver coverage actual
npm run test:unit:coverage

# Ver coverage de un archivo específico
npm run test:unit:coverage -- --collectCoverageFrom="src/ui-kit/buttons/**/*.tsx"

# Ver qué falta cubrir
npm run test:unit:coverage -- --coverageReporters=text
```

## Output Esperado

Para cada módulo, crear:
1. Test files completos en `__tests__/` con la misma estructura que `src/`
2. Tests que alcancen 90% coverage mínimo
3. Tests que sigan todas las mejores prácticas mencionadas
4. Tests que cubran interacciones de usuario y edge cases

## Prioridad

1. **UI Kit components** - Componentes reutilizables (buttons, forms, layout)
2. **App-level code** - Providers, routing, stores (crítico para la app)
3. **Feature modules críticos** - Home, Documents (páginas principales)
4. **Hooks y utilities** - Lógica de negocio reutilizable
5. **Otros módulos** - Features secundarias

---

**Nota**: Este prompt debe usarse para generar tests de forma sistemática, módulo por módulo, asegurando cobertura completa y calidad de código. Usar siempre `renderWithProviders` para componentes que necesiten React Query o Router, y `createAppWrapper` cuando se necesiten ambos.














