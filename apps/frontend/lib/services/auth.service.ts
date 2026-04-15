"use client";

import { authClient } from "../config/auth-client";

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
  companyId?: string;
  role?: string;
  username: string;
  password: string;
  rememberMe?: boolean;
};

type ExtractData<T extends (...args: any) => Promise<any>> =
  Awaited<ReturnType<T>> extends { data: infer D } ? D : never;

type SignInResponse = ExtractData<typeof authClient.signIn.email>;
type SignUpResponse = ExtractData<typeof authClient.signUp.email>;

const getFullName = (
  firstName: string,
  middleName: string | undefined,
  lastName: string,
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
  const { data, error } = await (
    authClient.signUp.email as (
      args: Record<string, unknown>,
    ) => Promise<{ data: SignUpResponse; error: { message?: string } | null }>
  )({
    email: payload.email,
    password: payload.password,
    name: getFullName(payload.firstName, payload.middleName, payload.lastName),
    first_name: payload.firstName,
    middle_name: payload.middleName,
    last_name: payload.lastName,
    phone_number: payload.phoneNumber,
    username: payload.username,
  });

  if (error) {
    throw new Error(error.message ?? "Unable to sign up right now.");
  }

  return data;
}
