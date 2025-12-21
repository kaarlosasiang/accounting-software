"use client";

import { AuthNavbar } from "@/components/common/auth-navbar";
import {LoginForm} from "@/components/forms/login-form/form";
import { useGuestRoute } from "@/lib/auth/protected-route";

export default function LoginPage() {
    useGuestRoute();
    
    return (
        <div className="bg-background flex h-svh flex-col">
            <AuthNavbar/>
            <div className="w-full h-full px-6 md:px-10 flex items-center justify-center">
                <LoginForm className="max-w-sm"/>
            </div>
        </div>
    )
}
