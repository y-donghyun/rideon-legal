// 공유 링크 미리보기 공통 — 404 페이지(앱·스토어로 보내는 스크립트가 들어 있다)를 받아
// <title> 자리에 제목과 OG 태그를 끼운다. 크루(functions/k/[id].js)와 같은 방식이다.
//
// 카드 정보는 PROD의 익명 공개 함수(0197 *_public_card)에서 받는다 — 공개로 둔 것만,
// 최소 정보만 준다. 못 받으면(비공개·없음·오류) 일반 카드로 간다.
// anon 키는 앱에도 박혀 있는 공개 키다.
export const SUPABASE_URL = 'https://oefeqwkvbnhlkwjpvpwv.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZmVxd2t2Ym5obGt3anB2cHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjQ5MDMsImV4cCI6MjEwMzE0MDkwM30.6FsToBVliUCz-bPfGdEpEKEk7MzoeM2nDbdHesd3KfQ'

/** RPC 한 번 — 행 하나(또는 null). env.SUPABASE_URL/ANON_KEY가 있으면 그쪽(미리보기 환경) */
export async function rpcOne(env, fn, body) {
  const base = (env && env.SUPABASE_URL) || SUPABASE_URL
  const key = (env && env.SUPABASE_ANON_KEY) || ANON_KEY
  try {
    const res = await fetch(base + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cf: { cacheTtl: 300, cacheEverything: true },
    })
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? (data[0] ?? null) : data
  } catch {
    return null
  }
}

/** 공개 버킷 파일의 주소 */
export function publicObject(env, bucket, path) {
  if (!path) return null
  const base = (env && env.SUPABASE_URL) || SUPABASE_URL
  return base + '/storage/v1/object/public/' + bucket + '/' + String(path).replace(/^\/+/, '')
}

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export const km = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n <= 0) return null
  return (n >= 100 ? Math.round(n).toLocaleString('ko-KR') : n.toFixed(1)) + 'km'
}

export const clip = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n) + '…' : t
}

/** 404 페이지에 카드를 끼워 돌려준다 */
export async function renderCard({ request, env }, { title, description, image }) {
  const page = await env.ASSETS.fetch(new URL('/404.html', request.url))
  const html = await page.text()
  const url = new URL(request.url)
  const img = image || 'https://rideon-app.com/icon.png'
  const meta =
    '<meta property="og:type" content="website">' +
    '<meta property="og:site_name" content="Rideon">' +
    '<meta property="og:title" content="' + esc(title) + '">' +
    '<meta property="og:description" content="' + esc(description) + '">' +
    '<meta property="og:image" content="' + esc(img) + '">' +
    '<meta property="og:url" content="' + esc(url.href) + '">' +
    '<meta name="twitter:card" content="' + (image ? 'summary_large_image' : 'summary') + '">'
  const out = html.replace(/<title>[^<]*<[/]title>/, '<title>' + esc(title) + '</title>' + meta)
  return new Response(out, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  })
}

export const isUuid = (s) => /^[0-9a-f-]{36}$/i.test(String(s ?? ''))
