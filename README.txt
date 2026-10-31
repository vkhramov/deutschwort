DeutschWort — German vocabulary PWA
=====================================

What is included
----------------
- 2,500 vocabulary entries: 968 nouns, 813 unique verbs, 362 adjectives,
  plus adverbs and core function words.
- Russian and English translations.
- Nouns include their article and plural form.
- Verbs are stored as infinitives and show all six present-tense forms:
  ich, du, er/sie/es, wir, ihr, sie/Sie.
- Prepositions show their governing case (Akkusativ, Dativ, Genitiv or
  Wechselpräposition) with short explanations and examples.
- 128 individually cropped, AI-generated flat-vector illustrations, mapped
  to 565 noun and verb entries where a clear semantic match is available.
  Abstract or ambiguous words remain text-only rather than receiving a
  misleading picture. Adjectives, adverbs and function words are text-only.
- Four typed-answer practice modes.
- Frequency-ordered learning path, daily goal, streak, accuracy and local progress.
- Basic spaced repetition (review intervals increase after correct answers).
- Searchable word library with per-entry DWDS reference links.
- Offline-capable PWA; install from Chrome on Android.

Install on Android
------------------
1. Upload/deploy this folder to a static HTTPS host (for example GitHub Pages).
2. Open the deployed URL in Chrome on Android.
3. Open Chrome menu (⋮) and choose "Install app" or "Add to Home screen".
4. Launch DeutschWort from the home screen. Progress is stored locally in that browser.

Updating an existing GitHub Pages repository
--------------------------------------------
Replace the old app files with the contents of this package, including the
assets/ folder and .nojekyll. Keep index.html in the repository root. Commit
changes and wait for GitHub Pages to redeploy. The service worker cache version
has been increased to deutschwort-v3 so browsers fetch the updated app.

Important data-quality note
---------------------------
This is a carefully filtered learning list, not a fully human-proofread
commercial dictionary. Frequency ordering is derived from the multi-source
Grundwortschatz dataset. English translations come from that dataset and
Wiktionary enrichment; Russian translations are matched from the FreeDict
German-Russian dictionary. Noun articles/plurals are retained from
Grundwortschatz, and entries with detected conflicts against FreeDict's
explicit gender marker were excluded. Some entries have no explicit FreeDict
gender marker. Some source enrichment is automatically generated. Verb
present-tense forms are based on the source's inflection data where available,
with standard German conjugation rules used for missing plural forms and
fallback cases. Check a dictionary for uncommon or irregular exceptions.

Preposition grammar
-------------------
Case labels and examples are based on the following educational references:
- Goethe-Institut, Deutsche Grammatik:
  https://www.goethe.de/ins/de/de/m/prf/grm.html
- Deutsche Welle, grammar lesson on two-way prepositions:
  https://www.dw.com/downloads/57339615/grammarenglishepisode038.pdf
- Goethe-Institut, explanation of prepositions:
  https://www.goethe.de/ins/ca/en/kul/ges/ssk/22145858.html
The key rule for the nine Wechselpräpositionen is destination/direction
(Wohin?) = accusative; location (Wo?) = dative. Context and meaning matter;
movement by itself is not enough.

Sources and attribution
-----------------------
1. cstr/grundwortschatz-voc-de
   https://huggingface.co/datasets/cstr/grundwortschatz-voc-de
   Vocabulary, frequency data, noun article/plural metadata and English
   translations. Dataset card specifies GPL-3.0-or-later and source
   attribution requirements. See its dataset card for complete upstream
   attribution and source-specific notices.

2. FreeDict German-Russian, edition 2024.10.10 (package 2024.11.01-2)
   https://freedict.org/
   Russian translations. Dictionary content is CC BY-SA 3.0, based on
   Wiktionary via WikDict/DBnary. Maintainer: Karl Bartel; FreeDict contributors.
   Attribution and package copyright information are in
   FREEDICT-COPYRIGHT.txt. The Russian translation data must retain its
   CC BY-SA 3.0 attribution and share-alike terms; do not treat it as GPL-only.

3. Individual German lexical reference links
   DWDS: https://www.dwds.de/
   A word's DWDS link is available from the library row.

4. Grammar references
   Goethe-Institut: https://www.goethe.de/ins/de/de/m/prf/grm.html
   Deutsche Welle: https://www.dw.com/downloads/57339615/grammarenglishepisode038.pdf

5. Illustrations
   Original AI-generated vector-style illustrations created for DeutschWort.
   The image sheet was split into individual square assets and mapped to
   semantically related nouns and verbs. Artwork is included in this package.

Licensing
---------
The app's original source code is GPL-3.0-or-later (see LICENSE-GPL-3.0.txt).
The included source datasets retain their respective upstream licenses:
Grundwortschatz GPL-3.0-or-later; FreeDict German-Russian CC BY-SA 3.0.
Do not remove the FreeDict attribution/copyright notice.
