"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLogin } from "@/hooks/use-auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { login, isLoading, error, clearError } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const returnUrl = searchParams.get("returnUrl");
  const source = searchParams.get("source");
  const isFromExtension = source === "extension";

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(returnUrl || "/dashboard");
    }
  }, [isAuthenticated, authLoading, router, returnUrl]);

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timeout);
    }
  }, [error, clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="space-y-4">
            {isFromExtension && (
              <Link
                href="/"
                className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to website
              </Link>
            )}

            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-xl knugget-gradient flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-white">
                Welcome back to Knugget
              </CardTitle>
              <CardDescription className="text-gray-400">
                {isFromExtension
                  ? "Sign in to sync your account with the Chrome extension"
                  : "Enter your credentials to access your AI-powered summaries"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert
                variant="destructive"
                className="mb-6 bg-red-900/20 border-red-800"
              >
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormItem>
                  <FormLabel htmlFor="email" className="text-white">
                    Email address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
                        {...form.register("email")}
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400">
                    {form.formState.errors.email?.message}
                  </FormMessage>
                </FormItem>

                <FormItem>
                  <FormLabel htmlFor="password" className="text-white">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500"
                        autoComplete="current-password"
                        {...form.register("password")}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400">
                    {form.formState.errors.password?.message}
                  </FormMessage>
                </FormItem>

                <div className="flex justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </FormProvider>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gray-800 px-2 text-gray-400">
                  Don&apos;t have an account?
                </span>
              </div>
            </div>

            <div className="text-center">
              <Link
                href={`/signup${isFromExtension ? "?source=extension" : ""}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
                className="text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                Create a new account
              </Link>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-white">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-white">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
