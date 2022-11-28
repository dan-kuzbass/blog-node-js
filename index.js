import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import {validationResult} from "express-validator";

import {registerValidation} from "./validations/auth.js";
import UserModel from './models/User.js'

mongoose.connect('mongodb+srv://admin:237Hzf8gDDCkjW85@cluster0.iojqfjk.mongodb.net/blog?retryWrites=true&w=majority')
  .then(() => console.log('DB OK')).catch((e) => console.log('DB ERR', e))

const app = express()

app.use(express.json())

app.post('/auth/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json(errors.array())
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(req.body.password, salt)

    const doc = new UserModel({
      email: req.body.email,
      fullName: req.body.fullName,
      avatarUrl: req.body.avatarUrl,
      passwordHash: hash,
    })

    const user = await doc.save()

    const token = jwt.sign({
      _id: user._id
    }, 'secret123', {expiresIn: '30d'})

    const {passwordHash, ...userData} = user._doc
    res.json({...userData, token})
  } catch (err) {
    res.status(500).json({
      message: 'Не удалось зарегистрироваться'
    })
    console.log(err)
  }
})

app.post('/auth/login', async (req, res) => {
  try {
    const user = await UserModel.findOne({email: req.body.email})
    if (!user) {
      return res.status(400).json({message: 'Пользователь не зарегистрирован'})
    }
    const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash)

    if (!isValidPass) {
      return res.status(400).json({message: 'Неверный логин или пароль'})
    }
    const token = jwt.sign({
      _id: user._id
    }, 'secret123', {expiresIn: '30d'})

    const {passwordHash, ...userData} = user._doc
    res.json({...userData, token})
  } catch (err) {
    res.status(500).json({
      message: 'Не удалось авторизоваться'
    })
    console.log(err)
  }
})

app.get('/auth/me', async (req, res) => {
  try {
    const user = await UserModel.findOne({email: req.body.email})
    if (!user) {
      return res.status(400).json({message: 'Пользователь не найден'})
    }

  } catch (err) {

  }
})

app.listen(4444, (err) => {
  if (err) {
    console.log('Server ERROR', err)
  } else {
    console.log('Server OK')
  }
})
