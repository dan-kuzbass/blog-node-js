import jwt from "jsonwebtoken";
import {validationResult} from "express-validator";
import bcrypt from "bcrypt";
import UserModel from "../models/User.js";

export const register = async (req, res) => {
  try {
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
}

export const login = async (req, res) => {
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
}

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId)
    if (!user) {
      return res.status(400).json({message: 'Пользователь не найден'})
    }
    const {passwordHash, ...userData} = user._doc
    res.json(userData)
  } catch (err) {
    res.status(500).json({message: 'Что-то пошло не так'})
    console.log(err)
  }
}
