const express = require('express');
const router = express.Router();
const { list, getOne, create, update, remove } = require('../controllers/users.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('staff:list'), list);
router.post('/', authorize('staff:create'), create);
router.get('/:id', authorize('staff:list'), getOne);
router.patch('/:id', authorize('staff:update'), update);
router.delete('/:id', authorize('staff:delete'), remove);

module.exports = router;
