# Teacher Douglas

Static site for teacher.douglasryanfavero.com, hosted on Cloudflare Pages (no build step). Push to main = deploy.

- `/` – Teacher Douglas home
- `/english/restaurant/` – Restaurant English class page: every student activity, by section and level (old `/ell/*` URLs 301 here, see `_redirects`)
- `/english/restaurant/readings/table-seven/` – Table Seven (A1, its own page) · `the-red-bag/` (easier A1, Spanish help) · `the-secret-ingredient/` (A2) on the reader engine
- `/english/restaurant/dialogues/a1/` and `a2/` – put-the-lines-in-order dialogues (`assets/dialogues.js` + `dialogues.css`, Sortable from cdnjs; drag or tap two lines to swap)
- `/english/restaurant/mezcal/` – Mezcal lessons (A2): `taste/`, `magueys/`, `joven-anejo/`, `cocktails/` run on `dialogues.js` (a page can add `vocab:[…]` tap-to-hear word lists and a `{t, quiz:[…]}` check item); `choose/` is the branching conversation on `assets/branch.js` + `branch.css` (play as guest or waiter, 13 endings; waiter-mode wrong answers are what the waiter would say to a different guest answer)
- `/english/e-max/` – pitch/demo page for e.Max Learning Institute (noindex, not linked)
- `/italian/` – Italian class page · `/italian/readings/la-chiave-di-roma/` (Case 1) and `il-gatto-del-vaticano/` (Case 2) – Nico Ombra noirs, 8 episodes each
- `/french/` – French class page · `/french/readings/mort-a-montparnasse/` – Max Lenoir, 8 episodes
- `/assets/site.css` – shared styles
- `/assets/reader.js` + `reader.css` – story reader engine. A new story is one HTML page that sets `window.STORY` (see the Italian and French pages) and loads these two files. Progress goes to the same Google Sheet as Table Seven, with the story name in the title column.
- `/assets/player.js` – story audio (pause/continue, 1× / .75× / .5×) · `/assets/hub.js` – progress on the class-page cards
- An episode can have `help:[…]` (one translation per paragraph) for a "Ver en español" button.
