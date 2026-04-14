import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { create, getPost, listPosts, remove, update } from '../controllers/postsController.js'

const router = Router()

router.get('/', listPosts)
router.get('/:id', getPost)
router.post('/', requireAuth, create)
router.put('/:id', requireAuth, update)
router.delete('/:id', requireAuth, remove)

export default router

