import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middlewares/Auth';

export const createUser = async (req: Request, res: Response) => {
  try {
    console.log('BODY CREATE USER:', req.body);

    const { name, email, password, interests } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      interests,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      interests: user.interests,
    });
  } catch (error: any) {
    console.error('ERRO AO CRIAR USUÁRIO:', error);
    return res.status(500).json({
      message: 'Erro ao criar usuário',
      error: error.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log('BODY LOGIN:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ email });
    console.log('USER ENCONTRADO:', user);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (!user.password) {
      return res.status(500).json({ message: 'Usuário sem senha cadastrada' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('SENHA BATEU?', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Senha inválida' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'segredo',
      { expiresIn: '1d' }
    );

    return res.json({ token });
  } catch (error: any) {
    console.error('ERRO NO LOGIN:', error);
    return res.status(500).json({
      message: 'Erro ao fazer login',
      error: error.message,
    });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    return res.json(user);
  } catch (error: any) {
    console.error('ERRO NO /users/me:', error);
    return res.status(500).json({
      message: 'Erro ao buscar usuário',
      error: error.message,
    });
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    return res.json(users);
  } catch (error: any) {
    console.error('ERRO AO LISTAR USUÁRIOS:', error);
    return res.status(500).json({
      message: 'Erro ao listar usuários',
      error: error.message,
    });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    return res.json(user);
  } catch (error: any) {
    console.error('ERRO AO BUSCAR USUÁRIO:', error);
    return res.status(500).json({
      message: 'Erro ao buscar usuário',
      error: error.message,
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, data, {
      new: true,
    }).select('-password');

    return res.json(user);
  } catch (error: any) {
    console.error('ERRO AO ATUALIZAR USUÁRIO:', error);
    return res.status(500).json({
      message: 'Erro ao atualizar usuário',
      error: error.message,
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Usuário deletado' });
  } catch (error: any) {
    console.error('ERRO AO DELETAR USUÁRIO:', error);
    return res.status(500).json({
      message: 'Erro ao deletar usuário',
      error: error.message,
    });
  }
};