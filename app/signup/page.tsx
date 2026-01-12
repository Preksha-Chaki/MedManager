"use client";

import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import TitleBar from "@/components/TitleBar";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setformData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, Seterror] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!name || !email || !trimmedPassword || !trimmedConfirmPassword) {
      Seterror("All fields are required");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Seterror("Passwords do not match");
      return;
    }

    Seterror("");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          password: trimmedPassword,
          confirmPassword: trimmedConfirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Seterror(data.error || "An error occured");
      } else {
        console.log(data.message);
        router.push("/login");
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
        <h1 className="mt-10 mb-2 text-center text-4xl font-semibold tracking-tight text-dark_amethyst-500">
          Create account
        </h1>
        <p className="mb-6 text-center text-base text-platinum-300">
          Sign up to save your medicine calculations and access them anywhere.
        </p>

        <section className="flex w-full justify-center">
          <div className="w-full max-w-md">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-platinum-400 sm:p-7"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-base font-medium text-dark_amethyst-500"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-platinum-400 bg-platinum-500 px-3 py-2.5 text-sm text-ink_black-400 placeholder:text-platinum-300 focus:border-deep_lilac-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-deep_lilac-200"
                  value={formData.name}
                  onChange={(e) =>
                    setformData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-base font-medium text-dark_amethyst-500"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-platinum-400 bg-platinum-500 px-3 py-2.5 text-sm text-ink_black-400 placeholder:text-platinum-300 focus:border-deep_lilac-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-deep_lilac-200"
                  value={formData.email}
                  onChange={(e) =>
                    setformData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-base font-medium text-dark_amethyst-500"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="w-full rounded-xl border border-platinum-400 bg-platinum-500 px-3 py-2.5 pr-10 text-sm text-ink_black-400 placeholder:text-platinum-300 focus:border-deep_lilac-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-deep_lilac-200"
                    value={formData.password}
                    onChange={(e) =>
                      setformData({ ...formData, password: e.target.value })
                    }
                    required
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

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1 block text-base font-medium text-dark_amethyst-500"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    className="w-full rounded-xl border border-platinum-400 bg-platinum-500 px-3 py-2.5 pr-10 text-sm text-ink_black-400 placeholder:text-platinum-300 focus:border-deep_lilac-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-deep_lilac-200"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setformData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-platinum-300 hover:text-dark_amethyst-500"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <FaRegEye />
                    ) : (
                      <FaRegEyeSlash />
                    )}
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
                Create account
              </button>

              <p className="text-center text-sm text-platinum-300">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-medium text-deep_lilac-400 hover:text-deep_lilac-300 hover:underline"
                >
                  Sign in
                </a>
              </p>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
