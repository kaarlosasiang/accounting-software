import { AuthNavbar } from "@/components/common/auth-navbar";
import { Navbar } from "@/components/common/landing-navbar";
import {LoginForm} from "@/components/forms/login-form/form";


export default function LoginPage() {
    return (
        <div className="bg-background flex h-svh flex-col">
            <AuthNavbar/>
            <div className="w-full h-full px-6 md:px-10 flex items-center justify-center">
                <LoginForm/>
            </div>
        </div>
    )
}
