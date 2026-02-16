---
description: Quality checklist for UI changes to prevent regressions.
---

# UI Quality Checklist

To prevent layout regressions (like the navigation pill misalignment), follow this checklist before merging UI changes:

## 📐 Layout & Alignment
- [ ] **Vertical Alignment**: Verify that horizontally adjacent elements (logo, nav, actions) are vertically centered.
  - *Tip*: Check for `items-center` on flex containers or `-translate-y-1/2` on absolute elements.
- [ ] **Floating Elements**: Ensure that elements with absolute positioning don't use magic numbers (like `top-11`) if they need to stay aligned with other core header elements. Use `top-1/2 -translate-y-1/2` instead.
- [ ] **Spacing**: Verify that `h-16` (or equivalent) headers have enough internal padding and don't feel cramped.

## 📱 Responsiveness
- [ ] **Breakpoint Check**: Verify the UI at `sm`, `md`, and `lg` breakpoints.
- [ ] **Overlap Prevention**: Ensure navigation items don't overlap with the logo or action buttons on smaller screens before they switch to a mobile menu.

## 🎨 Professional Polish
- [ ] **Interactive States**: Verify hover, focus, and active states for all interactive elements.
- [ ] **Motion**: Ensure Framer Motion animations feel snappy (0.3s-0.6s) and don't cause layout shifts after completion.
