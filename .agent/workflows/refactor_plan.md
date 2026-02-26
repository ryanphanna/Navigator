# Implementation Plan - Navigator Refactoring

This plan outlines a phased approach to refactoring the Navigator codebase to improve maintainability, performance, and scalability.

## Phase 1: Routing & State Foundation (High Impact)
*Goal: Remove redundant state and make the URL the single source of truth.*

- [ ] **Custom Routing Hook**: Create `useViewSync` or refactor `useGlobalUI` to derive current view directly from `useLocation()`.
- [ ] **Refactor `AppRoutes.tsx`**: 
    - Remove the manual `useEffect` syncing of `currentView`.
    - Flatten the `Suspense` hierarchy for smoother transitions.
- [ ] **Context Selection**: Optimize context consumption in `AppRoutes` to prevent total app re-renders on minor data changes.

## Phase 2: Component Decomposition (Maintainability)
*Goal: Break down "Mega-Components" into manageable pieces.*

- [ ] **Refactor `ResumeEditor.tsx`**:
    - Extract `ResumeSectionEditor` component.
    - Extract `ResumeBulletPoint` component.
    - Extract `ResumeDiscoverySidebar` component.
- [ ] **Extract Logic Hook**: Create `useSkillDiscovery` to handle the complex extraction logic currently in the `ResumeEditor` render cycle.

## Phase 3: Data & Performance (Efficiency)
*Goal: Optimize storage and AI service interactions.*

- [ ] **Batch Storage Sync**: Refactor `storageService.ts` to use Supabase batch inserts (`.insert([...])`).
- [ ] **AI Config Centralization**: Move model names and generation configs from `aiCore.ts` and individual services into a central `src/config/ai.config.ts`.
- [ ] **Robust Sync**: Add improved error handling and retry logic to the storage sync process.

## Phase 4: Polish & Standards (Developer Experience)
*Goal: Clean up technical debt and improve standards.*

- [ ] **Print Styles**: Move embedded `<style>` tags in `ResumeEditor` to Tailwind `print:` utilities or a dedicated CSS module.
- [ ] **E2E Testing Hygiene**: Refactor the "Mock User" logic in `UserContext` to use a cleaner injection pattern.
- [ ] **Performance Audit**: Ensure lazy loading is optimally placed to avoid "layout shift" during navigation.
