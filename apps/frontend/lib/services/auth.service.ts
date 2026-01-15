"use client";

import { authClient } from "../config/auth-client";
import { apiFetch } from "../config/api-client";

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type SignupPayload = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  companyId: string;
  role: string;
  username: string;
  password: string;
  rememberMe?: boolean;
};

type ExtractData<T extends (...args: any) => Promise<any>> = Awaited<
  ReturnType<T>
> extends { data: infer D }
  ? D
  : never;

type SignInResponse = ExtractData<typeof authClient.signIn.email>;
type SignUpResponse = ExtractData<typeof authClient.signUp.email>;

const getFullName = (
  firstName: string,
  middleName: string | undefined,
  lastName: string
) => [firstName, middleName, lastName].filter(Boolean).join(" ");

export async function signIn(payload: LoginPayload): Promise<SignInResponse> {
  const { data, error } = await authClient.signIn.email({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw new Error(error.message ?? "Unable to sign in right now.");
  }

  return data;
}

export async function signUp(payload: SignupPayload): Promise<SignUpResponse> {
  const {
    firstName,
    middleName,
    lastName,
    phoneNumber,
    password,
    email,
    companyId,
    role,
    username,
  } = payload;

  const result = await apiFetch<SignUpResponse>("/auth/sign-up/email", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      name: getFullName(firstName, middleName, lastName),
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      phone_number: phoneNumber,
      companyId,
      role,
      username,
    }),
  });

  if (result.error) {
    throw new Error(result.error?.message ?? "Unable to sign up right now.");
  }

  return result.data;
}
