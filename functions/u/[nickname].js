// 프로필 링크 미리보기 — https://rideon-app.com/u/{닉네임}
// 전체 공개 프로필만(0197 user_public_card — 닉네임 정확히 일치)
import { rpcOne, renderCard, km, publicObject } from '../../lib/og.js'

// 레벨 원값(1~2500) → 「동 77」 — 앱 core/utils/medal_level.dart와 같은 규칙(메달마다 500)
const MEDALS = ['동', '은', '금', '백금', '다이아']
const medal = (level) => {
  const n = Math.max(1, Math.min(2500, Math.floor(Number(level) || 1)))
  const i = Math.floor((n - 1) / 500)
  return MEDALS[i] + ' ' + (n - i * 500)
}

export async function onRequest(ctx) {
  let nick = String(ctx.params.nickname ?? '')
  try { nick = decodeURIComponent(nick) } catch { /* 그대로 */ }
  nick = nick.slice(0, 40)
  const c = nick ? await rpcOne(ctx.env, 'user_public_card', { _nickname: nick }) : null
  if (!c) return renderCard(ctx, { title: 'Rideon 라이더', description: 'Rideon 앱에서 라이더를 확인해 보세요' })
  const facts = [medal(c.level), km(c.total_distance_km) ? '누적 ' + km(c.total_distance_km) : null, c.follower_count > 0 ? '팔로워 ' + c.follower_count : null]
    .filter(Boolean).join(' · ')
  return renderCard(ctx, {
    title: c.nickname + ' · Rideon 라이더',
    description: facts,
    image: publicObject(ctx.env, 'avatars', c.avatar_path),
  })
}
