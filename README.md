# Teacher Douglas

Static site for teacher.douglasryanfavero.com, hosted on Cloudflare Pages (no build step). Push to main = deploy.

- `/` – Teacher Douglas home
- `/english/restaurant/` – Restaurant English class page (old `/ell/*` URLs 301 here, see `_redirects`)
- `/english/restaurant/readings/table-seven/` – Table Seven reading app
- `/english/e-max/` – pitch/demo page for e.Max Learning Institute (noindex, not linked)
- `/italian/` – Italian class page · `/italian/readings/la-chiave-di-roma/` – Rome noir, 8 episodes
- `/french/` – French class page · `/french/readings/mort-a-montparnasse/` – Max Lenoir, 8 episodes
- `/assets/site.css` – shared styles
- `/assets/reader.js` + `reader.css` – story reader engine. A new story is one HTML page that sets `window.STORY` (see the Italian and French pages) and loads these two files. Progress goes to the same Google Sheet as Table Seven, with the story name in the title column.
