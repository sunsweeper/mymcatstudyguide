# Package 2 · Phase 2 release — strengthen active recall

## 2.1 Persistent Mandatory Recall: shipped with the interface update (Oct 25, 2026)

- **Starts:** a Didn't know turns written recall on for that card direction.
- **Holds:** it carries across sessions and after later correct answers. It's computed from the review history (`memoryFrom().needs`), so it can't be lost by syncing or by clearing a setting.
- **Ends and restarts:** it turns off when the direction reaches **Mastered** and turns back on if a mastered card is missed again.
- **Both directions:** normal and reverse directions each follow their own history.
- **The override is explicit:** it's the **Mandatory Response** switch. When it's off, leaving a card without the response asks "Continue anyway?" on every such card. A Yes is recorded on the rating (`k`) and never counts as a successful retrieval; the requirement stays.
- **Details and tests:** INTERFACE-UPDATE.md and `tests/interface-update.test.js`.

## 2.2 Prevent browser-assisted answering: this release

**Current Answer**, the only recall field, now has:

| Request | How |
|---|---|
| Autocomplete off | `autocomplete="off"`; no `name`, and not inside a form, so browsers have nothing to autofill from or save |
| Autocorrect off (Safari / iOS) | `autocorrect="off"` |
| Auto-capitalization off | `autocapitalize="off"` |
| Spellcheck off | `spellcheck="false"` |
| Extensions asked to stay out | Grammarly (`data-gramm`, `data-gramm_editor`, `data-enable-grammarly`), LanguageTool (`data-lt-active`), Microsoft Editor (`data-ms-editor`), password managers (`data-lpignore`, `data-1p-ignore`, `data-form-type`) |
| No suggestions of earlier answers | no `list` or datalist; autocomplete off |
| Accessibility kept | screen readers hear "Spelling and word suggestions are turned off here so your answer comes from memory." Nothing else about the field changes. |

**Notes** isn't a recall field and keeps spellcheck.

**Limitations:**
- These are requests. Browsers, phone keyboards (for example iOS QuickType or Gboard predictions) and extensions may ignore some of them. Nothing a web page can do turns off a phone keyboard's own word predictions everywhere.
- **Tested here:** Chromium, desktop and phone emulation (`tests/phase2-browser.test.js`, 17 checks). Firefox and Safari engines aren't available in this build environment, so iPhone Safari and Firefox should be checked by hand: type a misspelled word in Current Answer and confirm nothing is underlined or corrected.

## 2.3 / 2.4 Self-assessment and rating controls: unchanged

- There is no grading, matching or automatic evaluation. She writes, reveals, compares, and rates herself with Got it / Struggled / Didn't know.
- There is no multiple choice, and no card text was changed.

## Data changes and rollback

- **Data:** none.
- **Rollback:** revert this commit or promote the previous Vercel deployment.

## Protection

`check-cards` reports all 1,000 protected cards unchanged; `visual-check` passes. The change is outside the card, so the baseline wasn't updated.
