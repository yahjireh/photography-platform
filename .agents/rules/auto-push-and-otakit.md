# Automatic Updates to GitHub and OtaKit

Whenever updates, bug fixes, or features are implemented in this repository:
1. **GitHub Sync**:
   - Stage all relevant changes (`git add .`)
   - Commit with a clear, concise conventional commit message (`git commit -m "..."`)
   - Push immediately to origin (`git push origin main`)

2. **OtaKit Mobile Live Updates**:
   - Whenever changes touch mobile packages (`apps/clickflicks-photographer` or `apps/clickflicks-client`), bump the version or update the bundle:
   - For Photographer App: `node scripts/sync-mobile-release.js --app photographer --version <VERSION> --notes "<RELEASE_NOTES>"` (or `npm run deploy:live` from the app directory)
   - For Client App: `node scripts/sync-mobile-release.js --app client --version <VERSION> --notes "<RELEASE_NOTES>"` (or `npm run deploy:live` from the app directory)
   - Verify that bundles are uploaded to OtaKit production channel so live devices receive over-the-air updates immediately.

