// 게시물 링크 미리보기 — https://rideon-app.com/p/{postId}
// 공개 글만 카드로(0197 post_public_card — 비공개·삭제·비공개 프로필이면 null). 아니면 일반 카드.
// 글 사진은 비공개 버킷이라 못 싣는다 — 작성자 얼굴(공개 버킷)을 쓴다
import { rpcOne, renderCard, isUuid, km, clip, publicObject } from '../../lib/og.js'

export async function onRequest(ctx) {
  const id = String(ctx.params.id ?? '')
  const c = isUuid(id) ? await rpcOne(ctx.env, 'post_public_card', { _post_id: id }) : null
  if (!c) return renderCard(ctx, { title: 'Rideon 라이딩 글', description: 'Rideon 앱에서 글을 확인해 보세요' })
  const facts = [km(c.distance_km), c.like_count > 0 ? '♥ ' + c.like_count : null].filter(Boolean).join(' · ')
  return renderCard(ctx, {
    title: c.title ? clip(c.title, 40) + ' — ' + c.author_nickname : c.author_nickname + '님의 라이딩',
    description: [clip(c.excerpt, 80), facts].filter(Boolean).join(' — ') || 'Rideon 라이딩 글',
    image: publicObject(ctx.env, 'avatars', c.author_avatar_path),
  })
}
