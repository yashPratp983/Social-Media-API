<<<<<<< HEAD

const express = require('express');
const router = express.Router();

=======
const express = require('express');
const router = express.Router();

>>>>>>> 319f79ea10e70072f8a674c4c9cca73f1b8c2371
const { login, register, updatePassword, updateUserCrediantials, forgotPasswordToken, resetPassword, verifyEmail, logout } = require('../controller/auth');
const { follow, unfollow, getProfile, uploadProfilePic, deleteProfilePic, addBio } = require('../controller/user');
const { protect, authorisation } = require('../middleware/auth');


router.get('/', protect, getProfile);
router.put('/generateResetToken', forgotPasswordToken);
router.post('/resetPassword/:resetToken', resetPassword);
router.post('/login', login);
router.post('/register', register);
router.route('/follow/:id').put(protect, follow)
router.route('/unfollow/:id').put(protect, unfollow)
router.route('/update').put(protect, updateUserCrediantials)
router.route('/updatePassword').put(protect, updatePassword)
router.route('/verify/:token').get(verifyEmail);
router.route('/logout').get(protect, logout);
router.route('/uploadProfilePic').put(protect, uploadProfilePic);
router.route('/deleteProfilePic').delete(protect, deleteProfilePic);
router.route('/addBio').put(protect, addBio);


module.exports = router;