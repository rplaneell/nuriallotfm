# Sharing the TFM Explorer, and using it once shared

The shared version is **one file**, `share/TFM-Explorer.html` (about 2.7 MB; `TFM-Explorer.zip` is the same file zipped, about 1.2 MB). It has no server, no install and no account. It was tested opened straight from disk in Chrome.

---

## Part 1. How to share it

### Option A: send the file (simplest)
1. Attach `share/TFM-Explorer.zip` to an email or message, or put it on a USB stick.
   - Send the **zip**: many email systems block or strip `.html` attachments.
2. Tell the recipient to **download, unzip, then double-click** `TFM-Explorer.html`. It opens in their browser.

**Do not share only a link to a Google Drive, OneDrive or Dropbox preview.** Those previews show the file as text and do not run it. The recipient must download the file first.

### Option B: put it online with a link (nicer for many people)
Any host that serves static files works. Rename a copy of the file to `index.html` first. These steps come from the services' standard workflows and were **not tested** here:

| Host | Steps |
|---|---|
| **Netlify Drop** (no account needed for a trial site) | Open `app.netlify.com/drop`, drag a folder containing `index.html` onto the page. You get a link. |
| **GitHub Pages** | Create a repository, upload `index.html`, then Settings → Pages → deploy from the main branch. The link is `https://<user>.github.io/<repo>/`. |
| **Cloudflare Pages** | Create a project with "Direct Upload", upload the folder with `index.html`. |
| **University web space** | Upload `index.html` to any folder the web server serves. |

Everything is in that one file, so no other settings are needed.

### Before you share
- **Your name is in it.** The Home page says "A research notebook for Núria", and exports say "Prepared for Núria Llorens de la Cruz". Decide whether that is fine for your audience.
- **Your answers are not in it.** Answers, notes and shortlist live in each person's own browser, never in the file. Sharing the file does not share your results.
- **To share your own results** (profile, shortlist), use *Shortlist → Download backup* and send the `.json` as well. The recipient can load it with *Restore from backup*, which replaces their data, so tell them to back up their own first.
- **Check what you are sending** by opening the zip once yourself.

### Updating it
If you change the app, rebuild with `npm run build:share` and share the new `share/TFM-Explorer.html`. Recipients' saved data survives only if they open it from the **same address** (same link, or same file in the same place); see the next section.

---

## Part 2. How to use it once shared (for recipients)

### Opening it
- Use a current **Chrome, Edge, Firefox or Safari**.
- Double-click `TFM-Explorer.html` (after unzipping). If your computer asks which program to use, choose your browser.
- **Internet:** needed only for the map background tiles and for the DOI check on the Sources page. Everything else works offline.
- Your **data stays on your computer**, in the browser. Nothing is uploaded and there is no account.

### A 10-minute first session
1. **Home** → *Start the test*. Answer what you can. You can **skip**, mark **not sure**, go **back**, and change any answer.
2. After about six answers open **See my profile**. Each score shows which answers produced it. Use **Edit my profile** if you disagree with a score.
3. Open **Settings → "How do you want to explore?"** (or `Home`) and choose the way you like to work. This only changes the layout, not your interests.
4. Go to **Topics**. For each topic you can say *Very interesting*, *Too broad*, *Not for me*, and so on. The ranking changes, and **Undo last reaction** reverses it. "Not for me" topics move to *Set aside* and can be restored.
5. **Open a topic.** The tabs are:
   - **Overview**: the policy problem, research question, subquestions and provisional hypotheses.
   - **Evidence**: literature candidates and official data sources, each with its verification status.
   - **Past theses**: real master's theses on similar questions from other programmes, with a note on how much their wording overlaps your question.
   - **Method**, **Feasibility** (scores with reasons and adjustable importance), **Careers**.
   - **Refine (lab)**: change scope, cases, method, focus and more. The question, method, evidence needed, workload and scores update, and you get ambitious, balanced and lower-risk versions.
   - **Notes**: your notes and open questions.
6. **Save** at least three topics, then open **Shortlist**: compare them side by side, change what matters to you, and read the robustness check. Enter your **confirmed** dates in the work plan.
7. **Export** from the Shortlist page: Markdown, CSV, an HTML report (use *Print or save as PDF*), or a full backup.

### Other pages
- **Map**: every country is clickable. The 28 places with curated notes show issues, institutions, datasets and linked topics; any other country shows only search links and says it has no curated notes. You can compare two curated places (descriptively only).
- **Careers**: start from a role or from a topic. No job vacancies are listed. Use the employers' own pages.
- **Sources**: every source and its status.

### Reading the labels
| Label | Meaning |
|---|---|
| Verified metadata | A record returned by an open index on the date shown. Relevance and content were not checked by a person. |
| Link checked | The link answered when last tested. |
| Generated hypothesis | A suggested research direction, **not** a confirmed gap in the literature. |
| Unverified | From background knowledge. Check the primary source before relying on it. |

Scores are judgments with reasons shown, not measurements. The tool does not choose a topic for you.

### Keeping and moving your data
- It is saved automatically **in that browser, at that address**. A different browser, a different computer, a private window, or a **moved file** (a different folder, for some browsers) starts empty.
- Clearing the browser's site data deletes it.
- **Protect yourself:** now and then use *Shortlist → Download backup*. To move to another browser or computer, open the app there and use *Restore from backup*.
- **Settings → Delete all my data** erases everything on this browser.

### What is not in the shared version
The shared copy has **no live repository search, no link rechecker and no AI helper**. Those need a local server and are hidden. The bundled data (literature, past theses, link status) is a **snapshot from 2026-10-19**. For newer items use the search links on each topic's *Past theses* and *Evidence* tabs.

### If something does not work
| Problem | Try |
|---|---|
| Page shows code or asks to download | Open it from your downloads folder with your browser, not from an email or cloud preview. |
| Blank page, or a message "The app could not start" | You opened the wrong file. Only **`TFM-Explorer.html`** (the single file in `share/` or the zip) runs by double-click. The `dist` build folder does not: browsers block it. |
| Blank page | Use a current browser; turn off extensions that block scripts. |
| Map is grey | You are offline, or the tile service is blocked. The place list below the map still works. |
| Data disappeared | The file was opened from a different place or browser. Restore your backup. |
| Dates look wrong | The app never assumes deadlines. Enter the confirmed dates yourself. |

### Privacy
No analytics, cookies, accounts or tracking. The only network requests are map tiles (OpenStreetMap) and, if you press the button, Crossref for the DOI check.
