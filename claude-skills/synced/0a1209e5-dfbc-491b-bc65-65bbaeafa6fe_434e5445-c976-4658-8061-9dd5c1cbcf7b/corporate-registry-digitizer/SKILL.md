---
name: corporate-registry-digitizer
description: Reads photos of physical molecular biology lab notebook pages and turns them into a structured, formatted Excel (xlsx) strain registry. Use this skill whenever the user uploads photos of a lab notebook, mentions a "strain registry," "plasmid log," "clone registry," or wants black ink gene and protein names, plasmid names, resistance markers, or clone numbers pulled out of handwritten pages into a spreadsheet. Also use it whenever the user provides a previous registry file (an existing xlsx or a PDF) alongside new notebook photos and wants the two merged into one updated file without touching the original.
---

# Corporate Registry Digitizer

This skill turns photos of a physical lab notebook into a real, formatted xlsx file, and merges that data with any previous registry the user already has, without ever changing the original file.

## Why this skill exists

Handwritten lab notebooks are hard to search, easy to lose, and painful to hand off between people on a team. The goal here is precision: every gene or protein written in black ink matters, every row needs to be traceable back to the page it came from, and nothing should be silently guessed or dropped. A missed protein name or a merged duplicate row is not a small mistake in this context, it can mean a strain gets lost from the record.

## Step 1: Read every image carefully

Go through each uploaded notebook photo in order. For each one:

* Read every gene or protein name written in black ink, anywhere on the page. This is the single most important rule in this skill. If it looks repeated, minor, or uncertain, still capture it as its own row. Do not skip anything because it seems redundant.
* If a sample appears more than once on the page, log it as a separate row rather than combining entries.
* If an entry clearly has a line through it, leave it out of the extraction.
* If you are not fully certain whether a line through an entry counts as a strikethrough, keep the row but flag it in the Notes column as "POSSIBLE STRIKETHROUGH, PLEASE VERIFY" rather than dropping it.
* If text is genuinely illegible, put the exact tag [UNREADABLE] in that cell. Never invent or guess a value.
* If an entry looks like it continues on the next photo, note it in the Notes column as "CONTINUES ON NEXT PAGE."
* Ignore anything that is not a strain entry, such as personal notes, sketches, or unrelated calculations.
* You may correct obvious spelling errors in standard biological terms, organism names, and antibiotic names, but never touch the Code column itself. When you correct something, say so in the Notes column, for example "Ampicillin (auto corrected)."
* Keep the Code exactly as written, including any gaps in the sequence caused by excluded entries. Do not renumber anything.
* If an image is too blurry, glared, or cropped to read reliably, say so plainly in your summary instead of guessing at the content.

## Step 2: Handle any previous registry file

If the user uploads a previous registry file (an xlsx or a PDF), treat it as read only:

* Read every existing row exactly as it appears. Do not change any values in it.
* Never overwrite, edit, or delete that original file. It stays exactly where and as it is.
* If a new row you extracted from the photos shares the same Code as a row already in the previous file, keep both rows rather than merging them, and flag the new row in the Notes column with something like "POSSIBLE DUPLICATE OF ROW X" so a person can review it.

## Step 3: Assemble the rows and build the file

Collect every row (both carried over and newly extracted) into a single JSON list, where each object uses these keys:

`code, parental_strain, plasmid, protein, resistance, clon, lnb, project, snapgene_file, date, notes`

`snapgene_file` should be "Yes," "No," or "Unknown." `date` should be formatted as YYYY/MM/DD. Leave any key blank rather than guessing if the notebook does not have that information.

Then build the actual spreadsheet using the bundled script rather than writing your own formatting logic from scratch:

```bash
python scripts/build_registry_xlsx.py --input rows.json --output Strains_updated_<date>.xlsx --title "Strain Registry"
```

This script applies the corporate colors as real spreadsheet formatting inside the file itself (Vibrant Orange, FF6600, for the title row, Electric Blue, 005CE6, for the column headers), sets sensible column widths, and freezes the header row. It needs the `openpyxl` Python package, which can be installed with `pip install openpyxl --break-system-packages` if it is not already available.

Name the output file something like `Strains_updated_2026_07_01.xlsx` so it is clearly distinct from any original file the user uploaded.

## Step 4: Present the file and summarize

Share the resulting xlsx file so the user can download it, then give a short plain text summary in the chat that includes:

* Total rows extracted from the new photos
* Total rows carried over from the previous file, if one was provided
* Number of rows excluded for being crossed out
* Number of rows containing [UNREADABLE]
* Number of rows flagged as possible duplicates
* Confirmation that the original file, if one was provided, was not modified in any way
* The exact name of the new file created

Keep this summary in plain formatted text. There is no need for HTML (HyperText Markup Language) styling here, since chat responses already render as normal formatted text.
