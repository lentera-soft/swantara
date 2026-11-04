import { z } from "zod";

export type RegisterFormMessages = {
  firstNameRequired: string;
  lastNameRequired: string;
  invalidEmail: string;
  emailRequired: string;
  invalidPhone: string;
  passwordMinLength: string;
  confirmPasswordMinLength: string;
  passwordMismatch: string;
};

const registerFormDefaultMessages: RegisterFormMessages = {
  firstNameRequired: "Nama depan wajib diisi",
  lastNameRequired: "Nama belakang wajib diisi",
  invalidEmail: "Masukkan alamat email yang valid.",
  emailRequired: "Email wajib diisi.",
  invalidPhone: "Masukkan nomor telepon yang valid.",
  passwordMinLength: "Kata sandi minimal 8 karakter",
  confirmPasswordMinLength: "Konfirmasi kata sandi minimal 8 karakter",
  passwordMismatch: "Konfirmasi kata sandi tidak cocok",
};

export function useRegisterFormSchema(
  messages: RegisterFormMessages = registerFormDefaultMessages,
) {
  return z
    .object({
      firstName: z.string().trim().min(1, { message: messages.firstNameRequired }),
      lastName: z.string().trim().min(1, { message: messages.lastNameRequired }),
      email: z
        .email({
          message: messages.invalidEmail,
        })
        .min(1, {
          message: messages.emailRequired,
        }),
      phone: z
        .string()
        .optional()
        .refine((value) => !value || /^\+[1-9]\d{1,14}$/.test(value), messages.invalidPhone),
      password: z.string().min(8, {
        message: messages.passwordMinLength,
      }),
      confirmPassword: z.string().min(8, {
        message: messages.confirmPasswordMinLength,
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordMismatch,
      path: ["confirmPassword"],
    });
}

export type RegisterFormSchema = z.infer<ReturnType<typeof useRegisterFormSchema>>;

export const registerFormDefaultValues: RegisterFormSchema = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};
