const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUser,
  createUser,
  deleteUser,
} = require('../controllers/userController');
const { validateUser } = require('../middleware/validators/userValidator');

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', validateUser, createUser);
router.delete('/:id', deleteUser);

module.exports = router;
