"use client";

import { FormEvent, useEffect, useState } from "react";
import TitleBar from "@/components/TitleBar";
import { MedicineDialog } from "@/components/Dialog";

export type Medicine = {
  _id: string;
  id?: string;
  name: string;
  manufacturer_name?: string;
  short_composition1?: string;
  short_composition2?: string;
  "price(₹)"?: string;
  price?: number;
  pack_size_label?: string;
  type?: string;
  Is_discontinued?: string;
};

export type User = {
  id?: string;
  name?: string;
  email?: string;
};

type CalcMedicine = {
  medicineId: string;
  quantity: number;
  cost: number;
};

export default function Home() {
  const [searchData, setSearch] = useState({ term: "", type: "" });
  const [error, setError] = useState("");
  const [result, setResult] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);

  const [loginMessage, setLoginMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [calcMeds, setCalcMeds] = useState<CalcMedicine[]>([]);
  const [calcLoading, setCalcLoading] = useState(false);

  const [allergies, setAllergies] = useState<string[]>([]);

  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    }
  }, []);

  const isLoggedIn = !!user?.id;

  useEffect(() => {
    if (!user?.id) return;

    const fetchCalcMeds = async () => {
      try {
        setCalcLoading(true);
        const res = await fetch(`/api/fetch_med_calc?userId=${user.id}`);
        if (!res.ok) {
          setCalcMeds([]);
          return;
        }
        const data = await res.json();
        const meds: CalcMedicine[] = (data?.data || []).map((m: any) => ({
          medicineId: m.medicineId,
          quantity: m.quantity,
          cost: m.cost,
        }));
        setCalcMeds(meds);
      } catch (e) {
        console.error("❌ Fetch calc meds error:", e);
      } finally {
        setCalcLoading(false);
      }
    };

    fetchCalcMeds();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchAllergies = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

        if (!token) {
          setAllergies([]);
          return;
        }

        const res = await fetch("/api/allergies", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setAllergies([]);
          return;
        }

        const data = await res.json();
        setAllergies(data.allergies || []);
      } catch (err) {
        console.error("Error fetching allergies:", err);
        setAllergies([]);
      }
    };

    fetchAllergies();
  }, [user]);

  const isAllergicToMedicine = (med: Medicine): boolean => {
    if (!allergies.length) return false;
    const text = `${med.short_composition1 || ""} ${
      med.short_composition2 || ""
    }`.toLowerCase();
    return allergies.some((a) => text.includes(a.toLowerCase()));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams(searchData as any).toString();

    try {
      setLoading(true);
      setError("");
      setResult([]);
      const res = await fetch(`/api/get_medicine?${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const validMedicines = (data.data || []).map((raw: any) => {
        const priceStr = raw["price(₹)"];
        const parsedPrice = priceStr ? parseFloat(priceStr) : null;

        return {
          _id: raw._id || `temp-${Math.random()}`,
          id: raw.id,
          name: raw.name || "Unknown",
          manufacturer_name: raw.manufacturer_name,
          short_composition1: raw.short_composition1,
          short_composition2: raw.short_composition2,
          "price(₹)": priceStr,
          price: !isNaN(parsedPrice!) ? parsedPrice : null,
          pack_size_label: raw.pack_size_label,
          type: raw.type,
          Is_discontinued: raw.Is_discontinued,
        } as Medicine;
      });

      setResult(validMedicines);
      console.log("Found medicines:", validMedicines);
    } catch (err: any) {
      console.error("Search error:", err);
      setError("Failed to fetch medicines: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const getUnitPrice = (med: Medicine): number | null => {
    return typeof med.price === "number" ? med.price : null;
  };

  useEffect(() => {
    if (!result.length || !calcMeds.length) return;

    setQuantities((prev) => {
      const next = { ...prev };
      for (const med of result) {
        const inCalc = calcMeds.find((c) => c.medicineId === med._id);
        if (inCalc && inCalc.quantity > 0) {
          next[med._id] = 1;
        }
      }
      return next;
    });
  }, [result, calcMeds]);

  const toggleMedicine = async (med: Medicine) => {
    if (!isLoggedIn || !user?.id) {
      setLoginMessage("Please log in to save medicines.");
      return;
    }

    if (isAllergicToMedicine(med)) {
      setLoginMessage(
        "This medicine matches your allergies and cannot be selected."
      );
      return;
    }

    const currentQty = quantities[med._id] || 0;
    const nextQty = currentQty === 1 ? 0 : 1;

    const unitPrice = getUnitPrice(med);
    if (unitPrice === null) {
      setLoginMessage(`Price not available for "${med.name}".`);
      return;
    }

    try {
      setSavingId(med._id);

      const res = await fetch("/api/add_med_calc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          med: {
            medicineId: med._id,
            quantity: nextQty,
            cost: unitPrice * nextQty,
          },
        }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        console.error("❌ add_med_calc failed", res.status, text);
        throw new Error(data?.error || data?.message || "API request failed");
      }

      setQuantities((prev) => ({
        ...prev,
        [med._id]: nextQty,
      }));

      setCalcMeds((prev) => {
        const existing = prev.find((c) => c.medicineId === med._id);
        if (nextQty === 0) {
          return prev.filter((c) => c.medicineId !== med._id);
        }
        if (existing) {
          return prev.map((c) =>
            c.medicineId === med._id
              ? { ...c, quantity: nextQty, cost: unitPrice * nextQty }
              : c
          );
        }
        return [
          ...prev,
          { medicineId: med._id, quantity: nextQty, cost: unitPrice * nextQty },
        ];
      });

      setLoginMessage("");
    } catch (e) {
      console.error("❌ Toggle medicine error:", e);
      setLoginMessage("Failed to update medicine");
    } finally {
      setSavingId(null);
    }
  };

  const similarMeds =
    selectedMed && selectedMed.short_composition1
      ? result.filter(
          (m) =>
            m._id !== selectedMed._id &&
            m.short_composition1 === selectedMed.short_composition1
        )
      : [];

  return (
    <div className="min-h-screen bg-white">
      <TitleBar />

      <main className="mx-auto flex max-w-6xl flex-col items-stretch px-4 pb-12 pt-6 sm:pt-8">
        <h1 className="mt-15 mb-6 text-center text-3xl font-semibold tracking-tight text-deep_lilac-300">
          Search Medicines
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-3 rounded-2xl bg-[#edf2f4] p-4 shadow-sm ring-1 ring-[#edf2f4] sm:flex-row sm:items-center sm:gap-4 sm:p-5"
        >
          <div className="w-full sm:w-1/3">
            <select
              value={searchData.type}
              onChange={(e) =>
                setSearch({ ...searchData, type: e.target.value })
              }
              className="w-full rounded-xl border border-[#edf2f4] bg-white px-3 py-2 text-sm text-dark_amethyst-400 focus:border-deep_lilac-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-deep_lilac-200"
              required
            >
              <option value="" disabled className="text-[#8d99ae]">
                Search by...
              </option>
              <option value="name">Name</option>
              <option value="short_composition">Short Composition</option>
              <option value="manufacturer">Manufacturer</option>
            </select>
          </div>

          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#8d99ae]">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                />
              </svg>
            </span>
            <input
              value={searchData.term}
              onChange={(e) =>
                setSearch({ ...searchData, term: e.target.value })
              }
              className="w-full rounded-xl border border-[#edf2f4] bg.white px-9 py-2 text-sm text-dark_amethyst-400 placeholder:text-[#8d99ae] focus:border-deep_lilac-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-deep_lilac-200"
              placeholder="Search (e.g., paracetamol)"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl bg-deep_lilac-400 px-5 py-2 text-sm font-semibold text-periwinkle-900 shadow-sm transition hover:bg-deep_lilac-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {!loading && result.length === 0 && (
          <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <a
              href="/calculate"
              className="group flex h-64 flex-col items-center rounded-2xl bg-[#edf2f4] p-5 shadow-sm ring-1 ring-[#edf2f4] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-deep_lilac-100/10">
                <img
                  src="/assets/Calculator-rafiki.svg"
                  alt="Cost calculator"
                  className="h-24 w-24 object-contain"
                />
              </div>
              <div className="mt-4 w-full text-center">
                <h3 className="text-base font-semibold text-dark_amethyst-400">
                  Cost calculator
                </h3>
                <p className="mt-2 text-sm text-[#8d99ae]">
                  Quickly calculate and save medicine costs for your profile.
                </p>
                <span className="mt-3 inline-flex text-sm font-semibold text-deep_lilac-400 group-hover:text-deep_lilac-300">
                  Open calculator →
                </span>
              </div>
            </a>

            <a
              href="/calendar_pg"
              className="group flex h-64 flex-col items-center rounded-2xl bg-[#edf2f4] p-5 shadow-sm ring-1 ring-[#edf2f4] transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-periwinkle-800">
                <img
                  src="/assets/undraw_date-picker_8qys.svg"
                  alt="Tracking calendar"
                  className="h-24 w-24 object-contain"
                />
              </div>
              <div className="mt-4 w-full text-center">
                <h3 className="text-base font-semibold text-dark_amethyst-400">
                  Tracking calendar
                </h3>
                <p className="mt-2 text-sm text-[#8d99ae]">
                  Plan and track your daily medicine schedule on a calendar.
                </p>
                <span className="mt-3 inline-flex text-sm font-semibold text-deep_lilac-400 group-hover:text-deep_lilac-300">
                  Open calendar →
                </span>
              </div>
            </a>
          </section>
        )}

        {error && (
          <p className="mt-3 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {loginMessage && (
          <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {loginMessage}
          </p>
        )}

        {!loading && result.length > 0 && (
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between text-xs text-[#8d99ae]">
              <span>
                Showing {result.length} result{result.length !== 1 && "s"}
              </span>
              {calcLoading && <span>Syncing saved medicines…</span>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.map((med) => {
                const unitPrice = getUnitPrice(med);
                const hasValidPrice = unitPrice !== null;
                const isDiscontinued =
                  med.Is_discontinued?.toUpperCase() === "TRUE";

                const qty = quantities[med._id] || 0;
                const isSelected = qty === 1;
                const isSaving = savingId === med._id;
                const allergic = isAllergicToMedicine(med);

                const openDialogForMed = () => {
                  setSelectedMed(med);
                  setIsDialogOpen(true);
                };

                return (
                  <article
                    key={med._id}
                    onClick={openDialogForMed}
                    className={`group relative cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      allergic
                        ? "border-red-300 bg-red-50"
                        : isDiscontinued
                        ? "border-red-200 bg-red-50"
                        : "border-[#edf2f4]"
                    }`}
                  >
                    <div
                      className="absolute right-4 top-4 flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isSelected && (
                        <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                          Selected
                        </span>
                      )}
                      {allergic && (
                        <span className="rounded-full border border-red-300 bg-red-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-700">
                          Allergy risk
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleMedicine(med)}
                        disabled={
                          !hasValidPrice ||
                          isDiscontinued ||
                          isSaving ||
                          allergic
                        }
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                          isSelected
                            ? "bg-[#8d99ae] text-white hover:bg-[#6c778a]"
                            : "bg-deep_lilac-400 text-periwinkle-900 hover:bg-deep_lilac-300"
                        } disabled:cursor-not-allowed disabled:bg-[#edf2f4] disabled:text-[#8d99ae]`}
                        title={
                          allergic
                            ? "This medicine conflicts with your allergies"
                            : !hasValidPrice
                            ? "Price unavailable"
                            : isDiscontinued
                            ? "Discontinued"
                            : isSelected
                            ? "Remove from selection"
                            : "Add to selection"
                        }
                      >
                        {isSaving ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-periwinkle-900 border-t-transparent" />
                        ) : isSelected ? (
                          "−"
                        ) : (
                          "+"
                        )}
                      </button>
                    </div>

                    <h3 className="mb-1 pr-16 text-base font-semibold text-dark_amethyst-400">
                      {med.name}
                    </h3>

                    {med.manufacturer_name && (
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#8d99ae]">
                        {med.manufacturer_name}
                      </p>
                    )}

                    <div className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
                      {med.type && (
                        <span className="rounded-full bg-[#edf2f4] px-2 py-0.5 text-[#8d99ae]">
                          {med.type}
                        </span>
                      )}
                      {med.pack_size_label && (
                        <span className="rounded-full bg-[#edf2f4] px-2 py-0.5 text-[#8d99ae]">
                          Pack: {med.pack_size_label}
                        </span>
                      )}
                      {allergic && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                          Allergy risk
                        </span>
                      )}
                      {isDiscontinued && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                          Discontinued
                        </span>
                      )}
                    </div>

                    <p className="mb-2 text-sm">
                      {hasValidPrice ? (
                        <span className="text-sm font-semibold text-emerald-700">
                          ₹{unitPrice}{" "}
                          <span className="text-xs font-normal text-[#8d99ae]">
                            {med.pack_size_label
                              ? `/ ${med.pack_size_label}`
                              : "/ unit"}
                          </span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800">
                          Price unavailable
                        </span>
                      )}
                    </p>

                    {med.short_composition1 && (
                      <p className="line-clamp-2 text-xs text-[#8d99ae]">
                        {med.short_composition1}
                        {med.short_composition2 && `, ${med.short_composition2}`}
                      </p>
                    )}

                    {allergic && (
                      <p className="mt-2 text-xs font-semibold text-red-700">
                        ⚠️ You have an allergy matching this medicine
                      </p>
                    )}

                    {isDiscontinued && (
                      <p className="mt-2 text-xs font-semibold text-red-700">
                        ⚠️ Discontinued
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {!loading && result.length === 0 && searchData.term && (
          <p className="mt-10 text-center text-sm text-[#8d99ae]">
            No medicines found for "{searchData.term}". Try different search
            terms.
          </p>
        )}

        <MedicineDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsDialogOpen(false);
              setSelectedMed(null);
            } else {
              setIsDialogOpen(true);
            }
          }}
          medicine={selectedMed}
          similarMeds={similarMeds}
          onSelectSimilar={(med) => {
            setSelectedMed(med);
          }}
        />
      </main>
    </div>
  );
}
