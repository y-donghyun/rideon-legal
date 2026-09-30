// 코스·기록 링크 미리보기 — https://rideon-app.com/c/{routeId}
// 공개 기록만(0197 route_public_card). 좌표·선은 받지 않는다(프라이버시 존) — 지역 이름만
import { rpcOne, renderCard, isUuid, km, clip, publicObject } from '../../lib/og.js'

const hm = (sec) => {
  const s = Number(sec)
  if (!Number.isFinite(s) || s <= 0) return null
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60)
  return h > 0 ? h + '시간 ' + m + '분' : m + '분'
}

export async function onRequest(ctx) {
  const id = String(ctx.params.id ?? '')
  const c = isUuid(id) ? await rpcOne(ctx.env, 'route_public_card', { _route_id: id }) : null
  if (!c) return renderCard(ctx, { title: 'Rideon 라이딩 코스', description: 'Rideon 앱에서 코스를 확인해 보세요' })
  const avg = Number(c.avg_speed_kmh) > 0 ? '평균 ' + Math.round(Number(c.avg_speed_kmh)) + 'km/h' : null
  const facts = [km(c.distance_km), hm(c.moving_duration_seconds), avg, c.region].filter(Boolean).join(' · ')
  return renderCard(ctx, {
    title: clip(c.title || '라이딩 코스', 40) + ' — ' + c.owner_nickname,
    description: facts || 'Rideon 라이딩 코스',
    image: publicObject(ctx.env, 'avatars', c.owner_avatar_path),
  })
}
