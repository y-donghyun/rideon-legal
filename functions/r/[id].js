// 그룹 라이딩 방 링크 미리보기 — https://rideon-app.com/r/{sessionId}(?i=코드)
// 공개 방이거나 링크의 코드가 맞으면 카드(0197 group_ride_public_card). 집결지는 이름만
import { rpcOne, renderCard, isUuid, publicObject } from '../../lib/og.js'

const when = (iso) => {
  if (!iso) return '지금 모이는 중'
  // 한국 시각으로 — M/D(요) HH:MM
  const k = new Date(new Date(iso).getTime() + 9 * 3600e3)
  const wd = '일월화수목금토'[k.getUTCDay()]
  const pad = (n) => String(n).padStart(2, '0')
  return (k.getUTCMonth() + 1) + '/' + k.getUTCDate() + '(' + wd + ') ' + pad(k.getUTCHours()) + ':' + pad(k.getUTCMinutes())
}

export async function onRequest(ctx) {
  const id = String(ctx.params.id ?? '')
  const code = new URL(ctx.request.url).searchParams.get('i')
  const c = isUuid(id)
    ? await rpcOne(ctx.env, 'group_ride_public_card', { _session_id: id, _code: code })
    : null
  if (!c) return renderCard(ctx, { title: 'Rideon 그룹 라이딩', description: 'Rideon 앱에서 방을 확인해 보세요' })
  const people = c.participant_count + '/' + c.max_participants + '명'
  const facts = [when(c.scheduled_at), c.rally_name ? c.rally_name + ' 집결' : null, people, c.crew_name ? c.crew_name + ' 크루' : null]
    .filter(Boolean).join(' · ')
  const emblem = c.crew_emblem_path
    ? publicObject(ctx.env, 'crew-emblems', c.crew_emblem_path) + '?v=' + (c.crew_emblem_rev ?? 0)
    : null
  return renderCard(ctx, {
    title: (code ? '초대 — ' : '') + c.title + ' · ' + c.host_nickname + '님의 방',
    description: facts,
    image: emblem || 'https://rideon-app.com/og/group-ride.png',
  })
}
