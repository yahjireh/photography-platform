# Modal Persistence and Dismissal Guidelines

Whenever a modal, alert prompt, announcement, update notice, or popup banner is implemented or displayed in the ClickFlicks applications (Client app, Photographer app, or Admin Dashboard):

1. **Persistent Viewed & Dismissed Tracking**:
   - Always persist its viewed and dismissed states in `localStorage` using unique keys (e.g. keyed by entity ID, version number, or notice category).
   - Once a modal has been viewed OR dismissed, it must **never** repeatedly pop up every time the user opens the application.

2. **Immediate State Registration**:
   - When a modal is displayed to the user, immediately record its viewed state in storage (`..._viewed_<id>` = `'true'`) so that closing or restarting the app does not cause the modal to reappear.
   - When the user taps "Dismiss", "Close", "Got It", or takes the call-to-action, record both the dismissed and viewed state (`..._dismissed_<id>` = `'true'`).

3. **Pre-Render Check**:
   - Before presenting any modal or dispatching custom modal events on startup (such as `updateNotice`, `AppUpdateModal`, or `inAppMessages`), verify that neither the viewed flag nor the dismissed flag is present.

4. **Version Check Alignment**:
   - Always compare the client's current version against the target version (e.g. using semantic versioning). Never prompt the user with an update modal if their installed version is already equal to or higher than the target release.

5. **Verification & Status Notices Dismissal**:
   - Any verification notice, KYC reminder, banner alert, or in-menu status row (such as the Studio Verification Notice on the Photographer Dashboard or in the Studio menu under Business Core) that is dismissed by the user must **never** be shown again across app restarts or screen transitions.
   - Persist dismissal in `localStorage` keyed both by user ID (e.g. `clickflicks_pro_studio_verification_dismissed_${user.id}`) and fallback (`clickflicks_pro_studio_verification_dismissed`).
   - Every verification alert or status prompt must provide a dismiss button `(X)` and once dismissed, suppress all related notices across all menus and dashboards.
