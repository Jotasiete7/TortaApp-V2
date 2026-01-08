# ðŸš€ Pre-Release Checklist

Use this checklist before creating any new release to ensure quality and consistency.

---

## ðŸ”´ Critical - Documentation Verification

**Version Synchronization:**
- [ ] `package.json` version updated to new version?
- [ ] `src-tauri/tauri.conf.json` version synchronized with package.json?
- [ ] `PROJECT_STATUS.md` updated with new version and date?
- [ ] `CHANGELOG.md` has detailed entry for this version?
- [ ] `README.md` version badge updated?
- [ ] Run `node scripts/verify-version-sync.js` - passes without errors?

---

## ðŸ§ª Testing

**Functionality:**
- [ ] All core features tested and working
- [ ] No console errors in browser
- [ ] No runtime errors in Tauri logs
- [ ] Database migrations applied successfully (if any)
- [ ] Authentication flow works correctly
- [ ] File upload/parsing works correctly

**Cross-Platform (if applicable):**
- [ ] Windows build tested
- [ ] Linux build tested (if supporting)
- [ ] macOS build tested (if supporting)

**Performance:**
- [ ] App loads in reasonable time
- [ ] No memory leaks detected
- [ ] Large datasets handled correctly

---

## ðŸ“ Code Quality

**Code Review:**
- [ ] No commented-out code blocks
- [ ] No debug console.logs left in production code
- [ ] TypeScript errors resolved
- [ ] ESLint warnings addressed

**Security:**
- [ ] No API keys or secrets in code
- [ ] Environment variables properly configured
- [ ] RLS policies reviewed (if database changes)

---

## ðŸ“š Documentation

**User-Facing:**
- [ ] README.md reflects current features
- [ ] CHANGELOG.md entry is clear and complete
- [ ] Breaking changes clearly documented (if any)

**Developer-Facing:**
- [ ] PROJECT_STATUS.md updated with implementation details
- [ ] TODO.md updated (completed tasks marked)
- [ ] New features documented in relevant docs/

---

## ðŸ—ï¸ Build Process

**Local Build:**
- [ ] `npm run build` completes without errors
- [ ] `npm run tauri:build` generates installers successfully
- [ ] Generated .exe/.msi tested on clean Windows install

**Auto-Update (if configured):**
- [ ] `latest.json` updated with new version
- [ ] Release signature generated and verified
- [ ] Update endpoint accessible

---

## ðŸŽ¯ Release Preparation

**Git:**
- [ ] All changes committed
- [ ] Commit messages follow convention
- [ ] Branch merged to main (if using feature branches)
- [ ] Git tag created with correct version (e.g., `v2.1.4`)

**GitHub:**
- [ ] Release notes prepared
- [ ] Release artifacts ready to upload
- [ ] Release marked as pre-release (if beta)

---

## âœ… Final Checks

- [ ] Version number follows SemVer (see VERSIONING.md)
- [ ] All checklist items above completed
- [ ] Team notified of upcoming release (if applicable)
- [ ] Backup of current production version available

---

## ðŸš¨ Post-Release

**Immediately After Release:**
- [ ] Verify release appears on GitHub
- [ ] Test download links work
- [ ] Auto-update triggers correctly (if configured)
- [ ] Monitor for critical bugs in first 24h

**Within 1 Week:**
- [ ] Gather user feedback
- [ ] Document any issues discovered
- [ ] Plan hotfix if critical bugs found

---

**Remember:** Quality over speed. It's better to delay a release than to ship broken software.