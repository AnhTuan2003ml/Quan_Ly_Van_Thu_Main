import express from 'express'

import {
    getUsers,
    getBasicUsers,
    updateUsers,
    addUsers,
    deleteUsers,
} from '../controllers/users.js'

import { ensureAuthenticated } from '../middleware/Middleware.js';

const user = express.Router()

user.get('/', ensureAuthenticated, getUsers)
user.get('/basic', ensureAuthenticated, getBasicUsers)
user.post('/', ensureAuthenticated, addUsers)
user.put('/:id', ensureAuthenticated, updateUsers)
user.delete('/:id', ensureAuthenticated, deleteUsers)


export default user