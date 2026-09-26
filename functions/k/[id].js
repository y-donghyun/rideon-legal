// 크루 링크 미리보기 카드 — https://rideon-app.com/k/{crewId}(?i=코드)
//
// 카톡·커뮤니티에 링크를 붙이면 **크루 이름·엠블럼·숫자**가 카드로 떠야 한다 — 주소만
// 뜨면 아무도 안 누른다(크루 설계 §05). 정적 사이트라 크루마다 다른 HTML을 못 주므로,
// 이 함수가 /k/* 요청에만 404 페이지(앱·스토어로 보내는 스크립트가 들어 있다)를 받아
// 제목·설명·그림 세 줄을 크루 정보로 바꿔 끼운다.
//
// 크루 정보는 PROD의 crew_public_card() — anon에게 열린 유일한 크루 함수로, 공개 크루의
// 간판 숫자만 준다(비공개·해산은 null → 일반 카드). anon 키는 앱에도 박혀 있는 공개 키다.
const SUPABASE_URL = 'https://oefeqwkvbnhlkwjpvpwv.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZmVxd2t2Ym5obGt3anB2cHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NjQ5MDMsImV4cCI6MjEwMzE0MDkwM30.6FsToBVliUCz-bPfGdEpEKEk7MzoeM2nDbdHesd3KfQ'

async function card(crewId) {
  if (!/^[0-9a-f-]{36}$/i.test(crewId)) return null
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/crew_public_card', {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ _crew_id: crewId }),
      cf: { cacheTtl: 300, cacheEverything: true },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export async function onRequest({ request, params, env }) {
  const page = await env.ASSETS.fetch(new URL('/404.html', request.url))
  const html = await page.text()
  const id = String(params.id ?? '')
  const c = await card(id)
  const url = new URL(request.url)
  const invite = url.searchParams.has('i')
  const title = c ? (invite ? c.name + ' 크루에 초대해요' : c.name + ' · 라이딩 크루') : 'Rideon 라이딩 크루'
  const facts = c
    ? [
        '멤버 ' + c.member_count + '명',
        Number(c.month_km) > 0 ? '이번 달 ' + Math.round(Number(c.month_km)).toLocaleString('ko-KR') + 'km' : null,
        c.region ? c.region + (c.region_rank ? ' 지역 ' + c.region_rank + '위' : '') : null,
      ].filter(Boolean).join(' · ')
    : 'Rideon 앱에서 크루를 확인해 보세요'
  const desc = c && c.description ? facts + ' — ' + c.description : facts
  const image = c && c.emblem_path
    ? SUPABASE_URL + '/storage/v1/object/public/crew-emblems/' + c.emblem_path + '?v=' + (c.emblem_rev ?? 0)
    : 'https://rideon-app.com/icon.png'
  const meta =
    '<meta property="og:type" content="website">' +
    '<meta property="og:site_name" content="Rideon">' +
    '<meta property="og:title" content="' + esc(title) + '">' +
    '<meta property="og:description" content="' + esc(desc) + '">' +
    '<meta property="og:image" content="' + esc(image) + '">' +
    '<meta property="og:url" content="' + esc(url.href) + '">' +
    '<meta name="twitter:card" content="summary">'
  const out = html
    .replace(/<title>[^<]*<[/]title>/, '<title>' + esc(title) + '</title>' + meta)
  return new Response(out, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  })
}
