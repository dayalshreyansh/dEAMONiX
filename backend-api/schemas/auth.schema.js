const { z } = require('zod');

const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email format." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long for financial security." }),
  deviceFingerprint: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email format." }),
  password: z.string().min(1, { message: "Password is required." }),
  deviceFingerprint: z.string().optional(),
});

module.exports = { RegisterSchema, LoginSchema };