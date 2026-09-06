# Product Design audit — Metrika Solo

Date: 2026-09-06  
Surface: mobile web app at `https://metrika-private-tracker.gnorth-13.chatgpt.site/`  
Mode: combined UX and accessibility audit

## User goal and accessibility target

The primary user should be able to privately record a session, optionally time it, review history and patterns, set a personal goal, and manage all device-local data without guessing what a screen expects. The mobile experience should remain readable and operable with touch, keyboard enlargement, and assistive technology.

## Flow health

1. **Today — needs attention.** The two primary actions are clear and the weekly pulse gives immediate context. The fixed bottom navigation covers the advice card, and the first screen tries to introduce too many destinations at once.
2. **History and search — healthy.** Search, category filters, record count, and the no-results state are clear. The empty state gives a useful recovery instruction.
3. **Session details — mostly healthy.** The record summary and edit/duplicate actions are understandable. Delete is visually too close in prominence to safe actions, mood appears redundantly in the page structure, and the fixed navigation obscures lower content.
4. **New session — mostly healthy.** This is a real full-screen flow with a clear sequence and appropriately optional context. The expanded context becomes long, the save action is only at the bottom, and keyboard/textarea visibility still needs native Android verification.
5. **Live timer — healthy.** The screen is focused, the timer is dominant, and active/paused actions are understandable. The active state communicates privacy well.
6. **Calendar — needs attention.** Month navigation and selected-day context are clear. The legend is small and color-dependent, while the fixed navigation covers the selected-day card and add-session action.
7. **Goals — needs attention.** Presets and plain-language goal summaries are strong. The list headline contains a visible spacing defect, the summary blocks delay the actual goals, and the first goal is obscured by navigation.
8. **Create goal — needs attention.** Presets, intent, amount, period, and the generated sentence make the model understandable. The form is long, the required title is not marked, and the disabled create button does not explain what is missing.
9. **Statistics — major attention.** The range selector and top KPIs are scannable, but the page is much too long for mobile and repeats time/category/quality information. One session produces overly precise percentages and rankings. Inner and outer period selectors can conflict. Dense chart labels and the fixed navigation reduce readability.
10. **Session parameters — major attention.** Central customization is the right model and archiving is explained responsibly. The hero is oversized, the horizontal tab row is clipped, add controls are covered by navigation, and several icon-only controls have no accessible name.
11. **Data protection — mostly healthy.** The local-first promise, encrypted backup, and reversible import framing build trust. “Password from the field on the left” is incorrect on mobile, where that field is above. Import controls and password errors need clearer recovery feedback.

## Strengths

- The visual language is recognizable and consistent: warm cream surfaces, dark green focus areas, lime highlights, and coral actions.
- Sensitive language is generally calm, private, and non-judgmental.
- New session and timer are separate full-screen tasks rather than constrained popups.
- Empty search, optional session context, encrypted backup, and archive explanations reduce anxiety.
- Interactive elements usually have large touch surfaces and the accessibility tree exposes useful labels for primary actions.

## Highest-impact UX risks

### P0 — fix before further feature expansion

1. Add one shared mobile content inset equal to the bottom navigation height plus the device safe area. No card, CTA, field, or chart may scroll underneath it.
2. Give every icon-only action in Session Parameters a visible tooltip/label and an accessible name. Keep touch targets at least 44×44 px.
3. Verify Android keyboard behavior for every low textarea/input: focused fields must scroll above the keyboard and remain visible while typing.

### P1 — simplify the product

4. Rebuild Statistics into three layers: overview, key patterns, and an explicit “More details” section. Hide or soften conclusions until there are enough records.
5. Use one period selector as the source of truth. If a module uses a different period, label that exception directly inside the module.
6. Keep one authoritative “When” module instead of repeating time-of-day analysis in Balance, Daily rhythm, and Golden hours.
7. Make goal creation progressive: preset or custom intent first, then only the fields relevant to that choice. Mark “Goal name” as required and explain disabled submission.
8. Reduce the Parameters hero and make the category tabs visibly horizontally scrollable, with edge fade or a compact selector on narrow phones.

### P2 — polish and consistency

9. Raise helper-text contrast and avoid text below 14 px except for genuinely secondary metadata.
10. Fix Ukrainian copy and grammar: headline spacing, plural forms such as “1 запис”, and layout-relative text such as “поле ліворуч”.
11. De-emphasize destructive actions, especially Delete, and separate them spatially from Edit/Duplicate.
12. Add non-color indicators to charts, calendar categories, and selected states.

## Accessibility risks

- The fixed navigation visually hides content and controls on multiple screens.
- Several gray labels and chart captions appear low contrast against cream or white surfaces.
- Parameters exposes unlabeled buttons in the accessibility tree.
- Calendar categories and chart series rely heavily on color.
- Long forms need reliable focus movement, visible focus styling, and keyboard-aware scrolling.
- Disabled submit buttons do not expose an adjacent explanation of how to enable them.

## Evidence limits

Screenshots and accessibility-tree inspection confirm visual hierarchy, visible overlap, labels, and reading order risks. This audit does not claim WCAG compliance. Native Android status-bar insets, predictive-back gestures, soft-keyboard resizing, screen-reader gestures, zoom reflow, saved-data success/error states, and destructive confirmations require a separate APK/device QA pass. No record, goal, or user data was created or deleted during this audit.

## Recommended implementation order

1. Shared mobile safe-area and bottom-navigation fix.
2. Parameters accessibility and mobile tab layout.
3. Goal headline/validation and form shortening.
4. Statistics hierarchy, confidence gating, and period consolidation.
5. Copy, contrast, destructive-action hierarchy, and native Android QA.
