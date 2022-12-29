const express = require('express');

const { getUsers, createUser, updateUser, deleteUser } = require('../controller/users');
const { protect, authorisation } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorisation('admin'));

router.route('/').get(getUsers).post(createUser);
router.route('/:id').put(updateUser).delete(deleteUser).get(getUsers);

module.exports = router;