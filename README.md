# CryptoNewsLantern

Static crypto news site built from the original `snx.zip` export. The visual
identity (dark theme, `card` surfaces, gradient headings, Nunito typography and
the generated utility stylesheet) is preserved exactly; the site was rebranded,
made multi-page and given the JavaScript it previously lacked.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Home page: hero, Trending, Data Intelligence, Market Watch, testimonials carousel, FAQ, CTA |
| `market.html`, `security.html`, `insights.html` | Section hubs linked from the navbar |
| `about.html`, `contacts.html`, `subscribe.html` | Company and reader pages |
| `pepe-coin.html` | News report: Synthetix community votes to decommission the depegged sUSD stablecoin and compensate holders with SNX |
| `robinhood-chain.html`, `crypto-hacks-2026.html` | Article pages behind the *Trending* cards |
| `tokenization-surge.html`, `network-growth.html`, `security-brief.html`, `market-trends.html`, `protocol-status.html`, `asset-tracking.html`, `alert-system.html` | Article pages behind the *Market Watch* cards |
| `styles.css` | Generated utility/theme stylesheet extracted from the original inline `<style>` block |
| `site.css` | Small hand-written layer: mobile nav panel, FAQ accordion, carousel and article typography |
| `css2.css`, `css2-1.css` | Font declarations from the original export |
| `app.js` | All site behaviour (see below) |
| `assets/` | Local images and the background noise texture |

## `app.js`

* **Carousel** — pointer drag, prev/next buttons, progress bar, keyboard arrows
  and `carousel-padding-controls` synchronisation so the controls stay aligned
  with the content column on every viewport.
* **FAQ accordion** — accessible triggers (`role="button"`, `aria-expanded`),
  one open item at a time, animated answers and a rotating plus icon.
* **Mobile navigation** — burger toggle for the navbar panel below 768 px.
* **Fit-text** — recalculates the oversized display headings on load, on resize
  and after fonts finish loading.
* **Utilities** — smooth in-page anchors, active navigation link and the footer
  copyright year.

All assets are local: there are no external scripts, fonts or image hosts, and
no references to the original builder remain.

## Local preview

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.
