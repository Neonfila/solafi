// After `vite build`: write dist/sign/index.html, the signing page, with its
// own link preview (WhatsApp, iMessage) and a noindex tag, so a signing link
// reads "Your Solafi agreement" instead of the homepage pitch.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const TITLE = 'Your Solafi agreement'
const DESC = 'Your solar agreement is ready to sign. Read it, add your details and sign on your phone.'
const ALT = 'Solafi. Your solar agreement is ready to sign.'

const html = readFileSync('dist/index.html', 'utf8')
const attr = (s) => s.replace(/"/g, '&quot;')
const set = (src, re, value) => {
  if (!re.test(src)) throw new Error(`build-sign-page: no match for ${re}`)
  return src.replace(re, (_, a, b) => a + attr(value) + b)
}

let out = html
out = out.replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`)
out = set(out, /(<meta name="description" content=")[^"]*(")/, DESC)
out = set(out, /(<meta property="og:title" content=")[^"]*(")/, TITLE)
out = set(out, /(<meta property="og:description" content=")[^"]*(")/, DESC)
out = set(out, /(<meta property="og:url" content="[^"]*?)(")/, 'sign/')
out = out.replace(/(<meta (?:property="og:image"|name="twitter:image") content="[^"]*?)og\.png(")/g, '$1og-sign.png$2')
out = set(out, /(<meta property="og:image:alt" content=")[^"]*(")/, ALT)
out = out.replace('<meta name="description"', '<meta name="robots" content="noindex" />\n    <meta name="description"')

mkdirSync('dist/sign', { recursive: true })
writeFileSync('dist/sign/index.html', out)
