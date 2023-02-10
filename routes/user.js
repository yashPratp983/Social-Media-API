const express = require('express');
const router = express.Router();

const { login, register, updatePassword, updateUserCrediantials, forgotPasswordToken, resetPassword, verifyEmail, logout, resendEmailVerification } = require('../controller/auth');
const { follow, unfollow, getProfile, uploadProfilePic, deleteProfilePic, addBio, getAUser, getAllUsers, getFollows, block, blockUser, unblockUser } = require('../controller/user');
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
router.route('/resendEmailVerification').put(resendEmailVerification);
router.route('/logout').get(protect, logout);
router.route('/uploadProfilePic').put(protect, uploadProfilePic);
router.route('/deleteProfilePic').delete(protect, deleteProfilePic);
router.route('/addBio').put(protect, addBio);
router.route('/getProfile/:id').get(protect, getAUser);
router.route('/getAllUsers').get(protect, getAllUsers);
router.route('/getFollows/:id').get(protect, getFollows);
router.route('/block/:id').put(protect, block);
router.route('/blockUser/:id').put(protect, blockUser);
router.route('/unblockUser/:id').put(protect, unblockUser);

module.exports = router;