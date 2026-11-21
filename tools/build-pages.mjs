// After `vite build`: write a page file for each route that people share, each
// with its own link preview. WhatsApp, iMessage and Facebook read these
// <meta property="og:..."> tags from the HTML without running the app, so a
// route without its own file shows the homepage preview, and a route missing
// from this list answers 404 (it still opens through 404.html).
//
//   og:title        the bold line in the preview
//   og:description  the grey line under it
//   og:image        the picture (1200 x 630 PNG in public/)
//   og:url          the link the preview belongs to
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const PAGES = [
  {
    path: 'sign', // the signing page: a signing link reads "Your Solafi agreement", not the homepage pitch
    title: 'Your Solafi agreement',
    desc: 'Your solar agreement is ready to sign. Read it, add your details and sign on your phone.',
    image: 'og-sign.png',
    alt: 'Solafi. Your solar agreement is ready to sign.',
    noindex: true,
  },
  {
    path: 'build',
    title: 'Find my package · Solafi',
    desc: 'Add the lights, fans, TV and fridge you want to power. See the smallest Solafi package that runs them, and what it costs a month.',
    image: 'og-build.png',
    alt: 'Solafi. Which solar package fits your home? A house with its front wall off, showing what each room runs.',
  },
  { path: 'about' }, // the homepage preview, but its own file so it answers 200
]

const html = readFileSync('dist/index.html', 'utf8')
const attr = (s) => s.replace(/"/g, '&quot;')
const set = (src, re, value) => {
  if (!re.test(src)) throw new Error(`build-pages: no match for ${re}`)
  return src.replace(re, (_, a, b) => a + attr(value) + b)
}

for (const p of PAGES) {
  let out = set(html, /(<meta property="og:url" content="[^"]*?)(")/, `${p.path}/`)
  if (p.title) {
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${p.title}</title>`)
    out = set(out, /(<meta name="description" content=")[^"]*(")/, p.desc)
    out = set(out, /(<meta property="og:title" content=")[^"]*(")/, p.title)
    out = set(out, /(<meta property="og:description" content=")[^"]*(")/, p.desc)
    out = out.replace(/(<meta (?:property="og:image"|name="twitter:image") content="[^"]*?)og\.png(")/g, `$1${p.image}$2`)
    out = set(out, /(<meta property="og:image:alt" content=")[^"]*(")/, p.alt)
  }
  if (p.noindex) out = out.replace('<meta name="description"', '<meta name="robots" content="noindex" />\n    <meta name="description"')
  mkdirSync(`dist/${p.path}`, { recursive: true })
  writeFileSync(`dist/${p.path}/index.html`, out)
}
