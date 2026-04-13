import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  login,
  getMe,
} from '../controllers/userController';
import { auth } from '../middlewares/Auth';

const router = Router();

router.post('/login', login);
router.get('/me', auth, getMe);

router.post('/', createUser);
router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;