import { createPost, deletePost, getPostById, getPosts, updatePost } from '../../db/provider.js'

export async function listPosts(_req, res) {
  res.json({ ok: true, posts: await getPosts() })
}

export async function getPost(req, res) {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false, message: 'Invalid id' })
  const post = await getPostById(id)
  if (!post) return res.status(404).json({ ok: false, message: 'Not found' })
  res.json({ ok: true, post })
}

export async function create(req, res) {
  const { title, body } = req.body || {}
  if (!title?.trim()) return res.status(400).json({ ok: false, message: 'Title is required' })
  const userId = Number(req.user?.sub)
  const post = await createPost({ user_id: userId, title: title.trim(), body: (body || '').trim() })
  res.status(201).json({ ok: true, post })
}

export async function update(req, res) {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false, message: 'Invalid id' })
  const existing = await getPostById(id)
  if (!existing) return res.status(404).json({ ok: false, message: 'Not found' })

  const { title, body } = req.body || {}
  const nextTitle = (title ?? existing.title).trim()
  if (!nextTitle) return res.status(400).json({ ok: false, message: 'Title is required' })
  const nextBody = (body ?? existing.body ?? '').trim()

  const post = await updatePost(id, { title: nextTitle, body: nextBody })
  res.json({ ok: true, post })
}

export async function remove(req, res) {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false, message: 'Invalid id' })
  const existing = await getPostById(id)
  if (!existing) return res.status(404).json({ ok: false, message: 'Not found' })
  await deletePost(id)
  res.json({ ok: true })
}

