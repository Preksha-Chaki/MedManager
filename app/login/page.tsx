"use client";

import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TitleBar from "@/components/TitleBar";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setformData] = useState({
    email: "",
    password: "",
  });
  const [error, Seterror] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      Seterror("All fields are required");
      return;
    }

    Seterror("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        Seterror(data.error);
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      }
    } catch (error) {
      console.log(error);
      Seterror("An error occured");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TitleBar />

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-stretch px-4 pb-12 pt-6 sm:pt-8">
        <h1 className="mt-10 mb-4 text-center text-4xl font-semibold tracking-tight text-dark_amethyst-500">
          Sign in
        </h1>
        <p className="mb-6 text-center text-base text-platinum-300">
          Access your saved medicine calculations.
        </p>

        <section className="flex w-full justify-center">
          <div className="w-full max-w-md">
            <form
              className="space-y-6 rounded-2xl bg-white p-6 text-sm shadow-sm ring-1 ring-platinum-400 sm:p-7"
              onSubmit={handleSubmit}
            >
              <div>
                <label
                  className="mb-1 block text-base font-medium text-dark_amethyst-500"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-platinum-400 bg-platinum-500 px-3 py-2.5 text-sm text-ink_black-400 placeholder:text-platinum-300 focus:border-deep_lilac-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-deep_lilac-200"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setformData({ ...formData, email: e.target.value });
                  }}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-base font-medium text-dark_amethyst-500"
                  htmlFor="pass"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="pass"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-platinum-400 bg-platinum-500 px-3 py-2.5 pr-10 text-sm text-ink_black-400 placeholder:text-platinum-300 focus:border-deep_lilac-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-deep_lilac-200"
                    required
                    value={formData.password}
                    onChange={(e) => {
                      setformData({ ...formData, password: e.target.value });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-platinum-300 hover:text-dark_amethyst-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-xl bg-deep_lilac-400 px-4 py-2.5 text-base font-semibold text-periwinkle-900 shadow-sm transition hover:bg-deep_lilac-300 disabled:cursor-not-allowed disabled:bg-platinum-400 disabled:text-platinum-700"
              >
                Login
              </button>

              <p className="text-center text-sm text-platinum-300">
                Do not have an account?{" "}
                <a
                  href="/signup"
                  className="font-medium text-deep_lilac-400 hover:text-deep_lilac-300 hover:underline"
                >
                  Create account
                </a>
              </p>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
