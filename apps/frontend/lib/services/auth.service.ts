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

  // Use fetch directly to send custom fields to Better Auth
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/sign-up/email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      credentials: "include",
    }
  );

  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error?.message ?? "Unable to sign up right now.");
  }

  return result.data;
}
