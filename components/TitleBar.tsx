"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  name?: string;
  username?: string;
  email?: string;
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  // Read user from localStorage (or your auth store)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user"); // change key if different
      if (raw) {
        const parsed: User = JSON.parse(raw);
        setUser(parsed);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const isLoggedIn = !!user;

  const displayName =
    user?.name || user?.username || user?.email || "User";

  const handleTitleClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    if (pathname === "/") {
      e.preventDefault();
      window.location.reload();
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-deep_lilac-400/90 backdrop-blur border-b border-periwinkle-700/40">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link href="/" onClick={handleTitleClick} className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-periwinkle-900 sm:text-3xl">
            MedManager
          </h1>
        </Link>

        {/* Desktop side */}
        <div className="hidden items-center gap-4 md:flex">
          {!isLoggedIn && (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-periwinkle-900/90 transition hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-periwinkle-900 px-4 py-1.5 text-sm font-semibold text-deep_lilac-400 shadow-sm transition hover:bg-periwinkle-800"
              >
                Sign Up
              </Link>
            </>
          )}

          <Link href="/UserDash" className="ml-1 inline-flex items-center gap-2">
            <img
              src="https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"
              alt="User dashboard"
              className="h-9 w-9 rounded-full border border-periwinkle-800/60 object-cover"
            />
            {isLoggedIn && (
              <span className="text-sm font-medium text-periwinkle-900/90">
                {displayName}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full p-2 text-periwinkle-900 hover:bg-ink_black-100/20 md:hidden"
          onClick={() => setOpen((p) => !p)}
          aria-label="Toggle navigation"
        >
          {/* icon here */}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-periwinkle-700/40 bg-deep_lilac-400/95 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
            {!isLoggedIn && (
              <>
                <Link
                  href="/login"
                  className="rounded-md px-2 py-2 text-sm font-medium text-periwinkle-900/90 hover:bg-ink_black-100/20"
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-periwinkle-900 px-2 py-2 text-sm font-semibold text-deep_lilac-400 hover:bg-periwinkle-800"
                  onClick={() => setOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}

            <Link
              href="/UserDash"
              className="mt-1 inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-periwinkle-900/90 hover:bg-ink_black-100/20"
              onClick={() => setOpen(false)}
            >
              <img
                src="https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"
                alt="User dashboard"
                className="h-8 w-8 rounded-full border border-periwinkle-800/60 object-cover"
              />
              <span>{isLoggedIn ? displayName : "Dashboard"}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
