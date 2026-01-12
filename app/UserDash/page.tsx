"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TitleBar from "@/components/TitleBar";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Pencil, X } from "lucide-react";

type UserType = {
  id: string;
  name?: string;
  email?: string;
  Phoneno?: number;
};

type Medicine = {
  _id: string;
  medicineId: string;
  name: string;
  manufacturer_name?: string;
  pack_size_label?: string;
  price: number | null;
  quantity: number;
  cost: number;
  Is_discontinued?: string;
  short_composition1?: string;
};

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [error, setError] = useState("");
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [allergyError, setAllergyError] = useState("");
  const [addingAllergy, setAddingAllergy] = useState(false);
  const [removingAllergy, setRemovingAllergy] = useState<string | null>(null);

  const [savingMedId, setSavingMedId] = useState<string | null>(null);

  // Load user from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        router.push("/login");
        return;
      }
      const parsed = JSON.parse(raw) as UserType;
      setUser(parsed);
      if (parsed?.Phoneno) {
        setPhoneInput(parsed.Phoneno.toString());
      }
    } catch {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  // Fetch fresh user from backend (phone, name, email)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchFreshUser = async () => {
      try {
        const res = await fetch("/api/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        console.log("ME status:", res.status, "raw:", text);

        let data: any = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error("Failed to parse /api/me JSON:", e);
        }

        if (res.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (!res.ok || !data.user) {
          console.error("Failed to fetch user profile:", data);
          return;
        }

        const freshUser: UserType = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          Phoneno: data.user.Phoneno,
        };

        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));

        if (freshUser.Phoneno) {
          setPhoneInput(freshUser.Phoneno.toString());
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchFreshUser();
  }, [router]);

  // Fetch allergies from /api/allergies once user & token are ready
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user?.id) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchAllergies = async () => {
      try {
        const res = await fetch("/api/allergies", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        console.log("ALLERGIES GET status:", res.status, "raw:", text);

        let data: any = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error("Failed to parse GET /api/allergies JSON:", e);
        }

        if (res.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (!res.ok) {
          console.error("Failed to fetch allergies:", data);
          return;
        }

        setAllergies(Array.isArray(data.allergies) ? data.allergies : []);
      } catch (err) {
        console.error("Error fetching allergies:", err);
      }
    };

    fetchAllergies();
  }, [user, router]);

  // Fetch saved medicines for this user
  useEffect(() => {
    if (!user?.id) return;

    const fetchMedicines = async () => {
      try {
        setLoadingMeds(true);
        setError("");
        const res = await fetch(`/api/fetch_med_calc?userId=${user.id}`);
        const data = await res.json();

        if (data.success) {
          setMedicines(data.data as Medicine[]);
        } else {
          setError(
            "Failed to fetch medicines: " + (data.error || "Unknown error"),
          );
        }
      } catch (err) {
        console.error("Error fetching medicines", err);
        setError("Error fetching medicines");
      } finally {
        setLoadingMeds(false);
      }
    };

    fetchMedicines();
  }, [user]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    setUser(null);
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (typeof window === "undefined") return;
    if (!user?.id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`/api/delete_user?UserId=${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Delete account failed:", data);
        return;
      }

      localStorage.removeItem("user");
      localStorage.removeItem("token");
      router.push("/login");
    } catch (err) {
      console.error("Error deleting account:", err);
    }
  };

  const handleSavePhone = async () => {
    if (typeof window === "undefined") return;
    if (!user?.id) return;

    const digitsOnly = phoneInput.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      setPhoneError("Phone number must be at least 7 digits long.");
      return;
    }

    setPhoneError("");

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("/api/phone", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: phoneInput }),
      });

      if (res.status === 401) {
        setPhoneError("Session expired. Please log in again.");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to update phone:", data);
        setPhoneError(
          data.error || "Failed to update phone number. Please try again.",
        );
        return;
      }

      const updatedPhoneno =
        data.user?.Phoneno !== undefined
          ? data.user.Phoneno
          : Number(phoneInput);

      const updatedUser: UserType = {
        ...user,
        Phoneno: updatedPhoneno,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setEditingPhone(false);
    } catch (err) {
      console.error("Error updating phone:", err);
      setPhoneError("Something went wrong. Please try again.");
    }
  };

  // Add allergy using POST method
  const handleAddAllergy = async () => {
    if (typeof window === "undefined") return;
    if (!user?.id) return;

    const trimmed = newAllergy.trim();
    if (!trimmed) {
      setAllergyError("Allergy cannot be empty.");
      return;
    }

    setAllergyError("");

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setAddingAllergy(true);
      const res = await fetch("/api/allergies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ allergy: trimmed }),
      });

      const text = await res.text();
      console.log("ALLERGIES POST status:", res.status, "raw:", text);

      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse POST /api/allergies JSON:", e);
      }

      if (res.status === 401) {
        setAllergyError("Session expired. Please log in again.");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        console.error("Failed to add allergy:", data);
        setAllergyError(
          data.error || "Failed to add allergy. Please try again.",
        );
        return;
      }

      const updatedAllergies: string[] = Array.isArray(data.allergies)
        ? data.allergies
        : [...allergies, trimmed];

      setAllergies(updatedAllergies);
      setNewAllergy("");
    } catch (err) {
      console.error("Error adding allergy:", err);
      setAllergyError("Something went wrong. Please try again.");
    } finally {
      setAddingAllergy(false);
    }
  };

  // Remove allergy using DELETE method
  const handleRemoveAllergy = async (allergy: string) => {
    if (typeof window === "undefined") return;
    if (!user?.id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setRemovingAllergy(allergy);
      const res = await fetch("/api/allergies", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ allergy }),
      });

      const text = await res.text();
      console.log("ALLERGIES DELETE status:", res.status, "raw:", text);

      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Failed to parse DELETE /api/allergies JSON:", e);
      }

      if (res.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        console.error("Failed to remove allergy:", data);
        return;
      }

      const updatedAllergies: string[] = Array.isArray(data.allergies)
        ? data.allergies
        : allergies.filter((a) => a !== allergy);

      setAllergies(updatedAllergies);
    } catch (err) {
      console.error("Error removing allergy:", err);
    } finally {
      setRemovingAllergy(null);
    }
  };

  // Remove saved medicine using same logic as home page toggle (quantity 0)
  const handleRemoveSavedMedicine = async (m: Medicine) => {
    if (typeof window === "undefined") return;
    if (!user?.id) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSavingMedId(m.medicineId);

      const res = await fetch("/api/add_med_calc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          med: {
            medicineId: m.medicineId,
            quantity: 0,
            cost: 0,
          },
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        console.error("Failed to remove saved medicine:", data || text);
        return;
      }

      setMedicines((prev) =>
        prev.filter((x) => x.medicineId !== m.medicineId),
      );
    } catch (err) {
      console.error("Error removing saved medicine:", err);
    } finally {
      setSavingMedId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TitleBar />

      <main className="mx-auto flex max-w-6xl flex-col items-stretch px-4 pb-12 pt-6 sm:pt-8">
        <header className="mb-6 flex flex-col items-center gap-4 sm:items-center sm:justify-center">
          <div>
            <h1 className="mt-20 text-center text-4xl font-semibold tracking-tight text-dark_amethyst-500">
              User dashboard
            </h1>
          </div>
        </header>

        {/* Top profile card */}
        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-platinum-400 sm:p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="flex-shrink-0">
              <img
                src="https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_640.png"
                alt="User avatar"
                className="h-20 w-20 rounded-full border-4 border-deep_lilac-400 bg-platinum-500 object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-semibold text-dark_amethyst-500">
                {user?.name || "Guest user"}
              </h2>
              <p className="text-base text-platinum-300">
                {user?.email || "No email available"}
              </p>
              <p className="mt-1 text-sm text-platinum-300">
                Manage your health profile and medicine preferences.
              </p>
            </div>
          </div>
        </section>

        {/* Profile details + Saved medicines */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Profile details */}
          <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-platinum-400 sm:p-6">
            <h3 className="mb-3 text-base font-semibold uppercase tracking-wide text-platinum-300">
              Profile details
            </h3>
            <dl className="space-y-2 text-base text-ink_black-400">
              <div className="flex justify-between">
                <dt className="text-sm text-platinum-300">Name</dt>
                <dd className="text-base font-medium text-dark_amethyst-500">
                  {user?.name || "Not set"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-platinum-300">Email</dt>
                <dd className="text-base font-medium text-dark_amethyst-500">
                  {user?.email || "Not set"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-sm text-platinum-300">Phone number</dt>
                <dd className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    {editingPhone ? (
                      <Input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSavePhone();
                          }
                        }}
                        onBlur={() => {
                          setEditingPhone(false);
                        }}
                        className="h-9 w-36 px-2 text-sm"
                        placeholder="Enter phone"
                      />
                    ) : (
                      <>
                        <span className="text-base font-medium text-dark_amethyst-500">
                          {user?.Phoneno ?? "Not added"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setPhoneInput((user?.Phoneno ?? "").toString());
                            setEditingPhone(true);
                          }}
                          className="text-platinum-300 hover:text-dark_amethyst-400"
                          aria-label="Edit phone number"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                  {phoneError && (
                    <p className="text-xs text-red-600">{phoneError}</p>
                  )}
                </dd>
              </div>
            </dl>

            {/* Health profile */}
            <div className="mt-5 border-t border-platinum-400 pt-4">
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-platinum-300">
                Health profile
              </h4>
              <p className="mb-1 text-sm text-platinum-300">Allergies</p>

              {allergies.length === 0 ? (
                <p className="rounded-xl bg-platinum-700 px-3 py-2 text-sm text-platinum-300">
                  You have not added any allergies yet.
                </p>
              ) : (
                <div className="mb-2 flex flex-wrap gap-1">
                  {allergies.map((a) => (
                    <span
                      key={a}
                      className="group inline-flex items-center gap-1 rounded-full bg-platinum-600 px-2 py-0.5 text-xs text-ink_black-300"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(a)}
                        disabled={removingAllergy === a}
                        className="rounded-full hover:bg-platinum-500 disabled:opacity-50"
                        aria-label={`Remove ${a}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAllergy();
                    }
                  }}
                  placeholder="Add allergy (e.g. Penicillin)"
                  className="h-9 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  disabled={addingAllergy}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-deep_lilac-400 text-periwinkle-900 hover:bg-deep_lilac-300 disabled:opacity-60"
                  aria-label="Add allergy"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              {allergyError && (
                <p className="mt-1 text-xs text-red-600">{allergyError}</p>
              )}
            </div>
          </div>

          {/* Saved medicines */}
          <div className="flex flex-col rounded-2xl bg-white p-5 text-base shadow-sm ring-1 ring-platinum-400">
            <h3 className="mb-1 text-base font-semibold text-dark_amethyst-500">
              Saved medicines
            </h3>
            <p className="mb-3 text-sm text-platinum-300">
              Medicines you have added from the search page.
            </p>

            {loadingMeds ? (
              <p className="mt-2 text-sm text-platinum-300">Loading…</p>
            ) : error ? (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            ) : medicines.length === 0 ? (
              <p className="mt-2 text-sm text-platinum-300">
                Any medicines you add from search will appear here.
              </p>
            ) : (
              <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto text-sm">
                {medicines.map((m) => (
                  <li
                    key={m._id}
                    className="flex items-center justify-between rounded-xl bg-platinum-700 px-3 py-2 text-dark_amethyst-500"
                  >
                    <span className="truncate">{m.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSavedMedicine(m)}
                      disabled={savingMedId === m.medicineId}
                      className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-platinum-600 text-xs leading-none text-ink_black-300 hover:bg-platinum-500 disabled:opacity-60"
                      aria-label={`Remove ${m.name} from saved medicines`}
                    >
                      {savingMedId === m.medicineId ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink_black-300 border-t-transparent" />
                      ) : (
                        "×"
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Tools / links */}
        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/calculate"
            className="group rounded-2xl bg-white p-5 text-base shadow-sm ring-1 ring-platinum-400 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="mb-1 text-base font-semibold text-dark_amethyst-500">
              Cost calculator
            </h3>
            <p className="text-sm text-platinum-300">
              View and manage your saved medicine cost calculations.
            </p>
            <span className="mt-3 inline-flex text-sm font-semibold text-deep_lilac-400 group-hover:text-deep_lilac-300">
              Open calculator →
            </span>
          </Link>

          <Link
            href="/calendar_pg"
            className="group rounded-2xl bg-white p-5 text-base shadow-sm ring-1 ring-platinum-400 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h3 className="mb-1 text-base font-semibold text-dark_amethyst-500">
              Tracking calendar
            </h3>
            <p className="text-sm text-platinum-300">
              Open your medicine tracking calendar.
            </p>
            <span className="mt-3 inline-flex text-sm font-semibold text-deep_lilac-400 group-hover:text-deep_lilac-300">
              Open calendar →
            </span>
          </Link>
        </section>

        {/* Logout + Delete account */}
        <section className="mt-6 space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="w-full rounded-2xl bg-dark_amethyst-500 p-5 text-left text-base font-semibold text-periwinkle-900 shadow-sm hover:bg-dark_amethyst-400"
              >
                Log out
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log out</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-dark_amethyst-500 text-periwinkle-900 hover:bg-dark_amethyst-400"
                >
                  Yes, log out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="w-full rounded-2xl bg-red-50 p-5 text-left text-base shadow-sm ring-1 ring-red-100 hover:bg-red-100/80"
              >
                <h3 className="mb-1 text-base font-semibold text-red-700">
                  Delete account
                </h3>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete account</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove all of your data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
    </div>
  );
}
