# Missing Tests Analysis

## Summary

- **Total Source Files** (excluding index.ts, routes.tsx, interfaces, types, enums): ~79
- **Total Test Files**: 40
- **Missing Tests**: ~39 files

## Files With Tests (40)

### UI-Kit Components
- ✅ Button.test.tsx
- ✅ IconButton.test.tsx
- ✅ Alert.test.tsx
- ✅ SpinnerOverlay.test.tsx
- ✅ Toast.test.tsx
- ✅ Modal.test.tsx
- ✅ ConfirmModal.test.tsx
- ✅ TextField.test.tsx
- ✅ Select.test.tsx
- ✅ Dropdown.test.tsx
- ✅ DataTable.test.tsx
- ✅ Tabs.test.tsx
- ✅ Breadcrumbs.test.tsx
- ✅ IconWrapper.test.tsx
- ✅ EmailIcon.test.tsx
- ✅ PhoneIcon.test.tsx
- ✅ LocationIcon.test.tsx
- ✅ Carousel.test.tsx
- ✅ CarouselSlide.test.tsx
- ✅ CarouselIndicators.test.tsx
- ✅ Section.test.tsx
- ✅ PageLayout.test.tsx
- ✅ Logo.test.tsx
- ✅ ImageTextSection.test.tsx
- ✅ DecorativeSVG.test.tsx
- ✅ GrayColumn.test.tsx
- ✅ GraySeparator.test.tsx
- ✅ ContactTitle.test.tsx
- ✅ FooterLogo.test.tsx

### Layout Hooks & Config
- ✅ useMenuConfig.test.ts
- ✅ menuConfig.test.ts

### App Level
- ✅ AppLayout.test.tsx
- ✅ AppProviders.test.tsx
- ✅ LocalStorageAdapter.test.ts
- ✅ useAppStore.test.ts
- ✅ useAuthStore.test.ts
- ✅ env.test.ts

### Modules
- ✅ StepCard.test.tsx
- ✅ HeroSection.test.tsx
- ✅ downloadPdfFile.test.ts

## Missing Tests (~39 files)

### UI-Kit Layout Components (11)
- ❌ Header.tsx
- ❌ Footer.tsx
- ❌ FooterSection.tsx
- ❌ FooterBottom.tsx
- ❌ NavigationMenu.tsx
- ❌ LanguageSelector.tsx
- ❌ SearchBar.tsx
- ❌ ContactInfo.tsx
- ❌ ContactSection.tsx
- ❌ OfficeInfo.tsx
- ❌ WorkingHours.tsx
- ❌ Sign365PromoSection.tsx

### Modules - Home (2)
- ❌ HomePage.tsx
- ❌ OurServicesPage.tsx
- ❌ Sign365Page.tsx
- ❌ getCarouselSlides.ts

### Modules - Documents Components (7)
- ❌ PDFViewer.tsx
- ❌ PdfPageCanvas.tsx
- ❌ PdfPaginationControls.tsx
- ❌ SignatureCanvas.tsx
- ❌ DateInputModal.tsx
- ❌ TextInputModal.tsx
- ❌ ElementTypePopover.tsx

### Modules - Documents Pages (1)
- ❌ SignDocumentPage.tsx

### Modules - Documents Hooks (6)
- ❌ usePdfFileUpload.ts
- ❌ usePdfGeneration.ts
- ❌ usePdfPageRenderer.ts
- ❌ usePdfElementInteraction.ts
- ❌ usePdfElementOverlay.ts
- ❌ usePendingElementState.ts
- ❌ useModalState.ts

### Modules - Documents Handlers (1)
- ❌ WebElementInteractionHandler.ts

### Modules - Documents Utils (1)
- ✅ downloadPdfFile.ts (already has test)

### App - Routing (2)
- ❌ router.tsx
- ❌ guards.tsx

### UI-Kit - Buttons Constants (1)
- ❌ ButtonConstants.ts

### Documents - Constants & Helpers (2)
- ❌ HandlerConstants.ts
- ❌ OverlayConstants.ts
- ❌ canvasHelpers.ts

## Priority for Testing

### High Priority (Critical Components)
1. Header.tsx - Main navigation component
2. Footer.tsx - Footer component
3. NavigationMenu.tsx - Navigation menu
4. LanguageSelector.tsx - Language switcher
5. router.tsx - App routing
6. guards.tsx - Route guards
7. HomePage.tsx - Main page
8. PDFViewer.tsx - Document viewer
9. SignDocumentPage.tsx - Main signing page

### Medium Priority
1. FooterSection.tsx, FooterBottom.tsx
2. SearchBar.tsx
3. ContactInfo.tsx, ContactSection.tsx, OfficeInfo.tsx
4. SignatureCanvas.tsx
5. PdfPageCanvas.tsx
6. Document hooks (usePdfFileUpload, usePdfGeneration, etc.)

### Lower Priority
1. ButtonConstants.ts
2. HandlerConstants.ts
3. OverlayConstants.ts
4. canvasHelpers.ts
5. getCarouselSlides.ts

## Estimated Test Files Needed

Approximately **39-40 additional test files** to reach 95% coverage.

