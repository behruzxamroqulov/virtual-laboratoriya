import { z } from 'zod';

export const loginSchema = z.object({
  login: z.string().min(1, 'Login kiritilishi shart').max(100),
  password: z.string().min(1, 'Parol kiritilishi shart').max(200)
});

export const createStudentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  login: z.string().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/, "Login faqat lotin harflari, raqam va ._- belgilaridan iborat bo'lsin"),
  password: z.string().min(6, "Parol kamida 6 belgidan iborat bo'lsin").max(200),
  group: z.string().min(1).max(100),
  studentId: z.string().min(1).max(50)
});

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  group: z.string().min(1).max(100).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6).max(200).optional()
});

export const createLaboratorySchema = z.object({
  number: z.coerce.number().int().min(1).max(999),
  title: z.string().min(1).max(200),
  topic: z.string().min(1).max(300),
  description: z.string().min(1).max(5000),
  task: z.string().min(1).max(5000),
  instructions: z.string().max(5000).optional().default(''),
  deadline: z.coerce.date(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  starterHtml: z.string().max(200000).optional().default(''),
  studentIds: z.array(z.string()).default([])
});

export const reviewSchema = z.object({
  grade: z.coerce.number().int().min(0).max(100).optional(),
  feedback: z.string().max(5000).optional()
});
