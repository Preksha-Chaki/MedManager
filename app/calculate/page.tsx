"use client";

import { useEffect, useState } from "react";
import TitleBar from "@/components/TitleBar";
import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type FrequencyUnit = "DAY" | "WEEK" | "MONTH";
type WeekdayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

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

  // coming from /api/fetch_med_calc now (optional in case older docs exist)
  frequency?: number;
  frequencyUnit?: FrequencyUnit;
};

type SelectedMedicine = Medicine & {
  quantityPerDose: number; // units per dose
  frequency: number; // times per unit
  frequencyUnit: FrequencyUnit;
  weeklyDays: WeekdayCode[];   // selected weekdays when unit=WEEK
  monthlyDates: number[];      // selected dates when unit=MONTH
};

type PrescriptionMedicinePayload = {
  medicineId: string;
  medicineName: string;
  dosage: number;
  frequency: number;
  frequencyUnit: FrequencyUnit;
  doseTimes: string[];
  weeklyDays?: WeekdayCode[];
  monthlyDates?: number[];
};

export default function Page() {
  const router = useRouter();

  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const [selectedMeds, setSelectedMeds] = useState<SelectedMedicine[]>([]);
  const [result, setResult] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const formatForApi = (d: Date | undefined) =>
    d ? d.toISOString().slice(0, 10) : "";

  const validateDates = () => {
    if (!fromDate || !toDate) {
      setError("Please select both start and end dates");
      return false;
    }
    if (toDate <= fromDate) {
      setError("End date must be after start date");
      return false;
    }
    return true;
  };

  // Load user from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        router.push("/login");
        return;
      }
    } catch {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  // Load user
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("user");
        if (u) setUser(JSON.parse(u));
      } catch {
        setUser(null);
      }
    }
  }, []);

  // Fetch saved medicines
  useEffect(() => {
    const fetchMedicines = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/fetch_med_calc?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setMedicines(data.data);
        } else {
          setError("Failed to fetch medicines: " + data.error);
        }
      } catch (err) {
        setError("Error fetching medicines");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();
  }, [user]);

  const addMedicine = (med: Medicine) => {
    // toggle: if already selected, remove
    if (selectedMeds.find((m) => m._id === med._id)) {
      setSelectedMeds((prev) => prev.filter((m) => m._id !== med._id));
      setError("");
      return;
    }

    // Default frequency: existing from calc if present; else 1 per DAY
    const defaultFrequencyUnit: FrequencyUnit = med.frequencyUnit ?? "DAY";
    const defaultFrequency = med.frequency ?? 1;

    setSelectedMeds((prev) => [
      ...prev,
      {
        ...med,
        quantityPerDose: 1,
        frequency: defaultFrequency,
        frequencyUnit: defaultFrequencyUnit,
        weeklyDays: [],
        monthlyDates: [],
      },
    ]);
    setError("");
  };

  const removeMedicine = (id: string) => {
    setSelectedMeds((prev) => prev.filter((m) => m._id !== id));
  };

  const updateFrequency = (id: string, freq: number) => {
    setSelectedMeds((prev) =>
      prev.map((m) =>
        m._id === id ? { ...m, frequency: Math.max(1, freq) } : m
      )
    );
  };

  const updateFrequencyUnit = (id: string, unit: FrequencyUnit) => {
    setSelectedMeds((prev) =>
      prev.map((m) =>
        m._id === id
          ? {
              ...m,
              frequencyUnit: unit,
              // reset schedule when changing unit
              weeklyDays: unit === "WEEK" ? m.weeklyDays : [],
              monthlyDates: unit === "MONTH" ? m.monthlyDates : [],
            }
          : m
      )
    );
  };

  const updateQuantity = (id: string, quantity: number) => {
    setSelectedMeds((prev) =>
      prev.map((m) =>
        m._id === id ? { ...m, quantityPerDose: Math.max(0.5, quantity) } : m
      )
    );
  };

  // Enforce: weeklyDays.length <= frequency
  const toggleWeeklyDay = (id: string, day: WeekdayCode) => {
    setSelectedMeds((prev) =>
      prev.map((m) => {
        if (m._id !== id) return m;

        const alreadySelected = m.weeklyDays.includes(day);

        // If unselecting, always allow
        if (alreadySelected) {
          return {
            ...m,
            weeklyDays: m.weeklyDays.filter((d) => d !== day),
          };
        }

        // If selecting a new day, block if max reached
        if (m.weeklyDays.length >= m.frequency) {
          return m;
        }

        return {
          ...m,
          weeklyDays: [...m.weeklyDays, day],
        };
      })
    );
  };

  // Allow multiple dates up to frequency
  const updateMonthlyDay = (id: string, day: number) => {
    const clamped = Math.min(31, Math.max(1, day));

    setSelectedMeds((prev) =>
      prev.map((m) => {
        if (m._id !== id) return m;

        if (m.monthlyDates.includes(clamped)) {
          return m;
        }

        if (m.monthlyDates.length >= m.frequency) {
          return m;
        }

        return {
          ...m,
          monthlyDates: [...m.monthlyDates, clamped],
        };
      })
    );
  };

  const calculateCost = async () => {
    setError("");
    setSuccessMsg("");

    if (!validateDates()) return;

    if (selectedMeds.length === 0) {
      setError("Please select at least one medicine");
      return;
    }

    const noPriceMeds = selectedMeds.filter((m) => m.price === null);
    if (noPriceMeds.length > 0) {
      setError(`Cannot calculate: ${noPriceMeds[0].name} has no price`);
      return;
    }

    try {
      setCalculating(true);

      const medicinesWithUnitCost = selectedMeds.map((m) => {
        let packQuantity = 1;

        if (m.pack_size_label) {
          const match = m.pack_size_label.match(
            /(\d+(?:\.\d+)?)\s*(ml|tablet|capsule|strip)/i
          );
          if (match) {
            packQuantity = parseFloat(match[1]);
          }
        }

        const costPerActualUnit = m.price! / packQuantity;

        return {
          medicineId: m._id,
          pricePerUnit: costPerActualUnit,
          quantityPerDose: m.quantityPerDose,
          packPrice: m.price,
          packQuantity: packQuantity,
          frequency: m.frequency,
          frequencyUnit: m.frequencyUnit,
        };
      });

      const res = await fetch("/api/Calculate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          fromDate: formatForApi(fromDate),
          toDate: formatForApi(toDate),
          medicines: medicinesWithUnitCost,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.data);
      } else {
        setError("Calculation failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      setError("Error calculating cost");
      console.error(err);
    } finally {
      setCalculating(false);
    }
  };

  const saveAsPrescription = async () => {
    setError("");
    setSuccessMsg("");

    if (!user?.id) {
      setError("You must be logged in to save a prescription");
      return;
    }

    if (!result || selectedMeds.length === 0) {
      setError("Please calculate cost before saving as prescription");
      return;
    }

    if (!validateDates()) return;

    try {
      setSavingPrescription(true);

      const medicinesPayload: PrescriptionMedicinePayload[] = selectedMeds.map(
        (m) => ({
          medicineId: m._id,
          medicineName: m.name,
          dosage: m.quantityPerDose,
          frequency: m.frequency,
          frequencyUnit: m.frequencyUnit,
          doseTimes: [],
          weeklyDays: m.frequencyUnit === "WEEK" ? m.weeklyDays : undefined,
          monthlyDates: m.frequencyUnit === "MONTH" ? m.monthlyDates : undefined,
        })
      );

      const resp = await fetch("/api/add_prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          startDate: formatForApi(fromDate),
          endDate: formatForApi(toDate),
          medicines: medicinesPayload,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        setError(data.error || "Failed to save prescription");
      } else {
        setSuccessMsg("Prescription saved successfully");
      }
    } catch (err) {
      console.error(err);
      setError("Error saving prescription");
    } finally {
      setSavingPrescription(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex h-screen items-center justify-center">
          <p className="text-lg text-platinum-300">
            Loading your medicines...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TitleBar />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-center text-3xl font-semibold text-dark_amethyst-500">
          Cost Calculator
        </h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            {successMsg}
          </div>
        )}

        {/* Date pickers */}
        <div className="mb-8 flex flex-wrap items-start justify-center gap-8">
          <div className="flex flex-col gap-3">
            <Label htmlFor="from-date" className="px-1 text-platinum-300">
              Start date
            </Label>
            <Popover open={fromOpen} onOpenChange={setFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="from-date"
                  className="w-48 justify-between font-normal border-platinum-400 text-ink_black-400"
                >
                  {fromDate ? fromDate.toLocaleDateString() : "Select start"}
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={fromDate}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setFromDate(date);
                    setFromOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="to-date" className="px-1 text-platinum-300">
              End date
            </Label>
            <Popover open={toOpen} onOpenChange={setToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="to-date"
                  className="w-48 justify-between font-normal border-platinum-400 text-ink_black-400"
                >
                  {toDate ? toDate.toLocaleDateString() : "Select end"}
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={toDate}
                  captionLayout="dropdown"
                  onSelect={(date) => {
                    setToDate(date);
                    setToOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Selected Medicines */}
        {selectedMeds.length > 0 && (
          <div className="mb-8 rounded-lg bg-platinum-500 p-6">
            <h2 className="mb-4 text-xl font-semibold text-dark_amethyst-500">
              Selected Medicines ({selectedMeds.length})
            </h2>
            <div className="space-y-3">
              {selectedMeds.map((med) => (
                <div
                  key={med._id}
                  className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-platinum-400 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-dark_amethyst-500">
                      {med.name}
                    </h3>
                    <p className="text-sm text-platinum-300">
                      ₹{med.price}{" "}
                      {med.pack_size_label
                        ? `/ ${med.pack_size_label}`
                        : "/ unit"}
                    </p>
                    <p className="mt-1 text-xs text-platinum-300">
                      Frequency: {med.frequency} times / {med.frequencyUnit}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Times */}
                    <div>
                      <label className="mr-2 text-sm text-platinum-300">
                        Times:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={med.frequency}
                        onChange={(e) =>
                          updateFrequency(
                            med._id,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20 rounded border border-platinum-400 px-2 py-1 text-sm text-ink_black-400 focus:border-deep_lilac-400 focus:outline-none focus:ring-1 focus:ring-deep_lilac-200"
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="mr-2 text-sm text-platinum-300">
                        Unit:
                      </label>
                      <select
                        value={med.frequencyUnit}
                        onChange={(e) =>
                          updateFrequencyUnit(
                            med._id,
                            e.target.value as FrequencyUnit
                          )
                        }
                        className="w-28 rounded border border-platinum-400 bg-white px-2 py-1 text-sm text-ink_black-400 focus:border-deep_lilac-400 focus:outline-none focus:ring-1 focus:ring-deep_lilac-200"
                      >
                        <option value="DAY">per day</option>
                        <option value="WEEK">per week</option>
                        <option value="MONTH">per month</option>
                      </select>
                    </div>

                    {/* Qty/dose */}
                    <div>
                      <label className="mr-2 text-sm text-platinum-300">
                        Qty/dose:
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={med.quantityPerDose}
                        onChange={(e) =>
                          updateQuantity(
                            med._id,
                            parseFloat(e.target.value) || 1
                          )
                        }
                        className="w-20 rounded border border-platinum-400 px-2 py-1 text-sm text-ink_black-400 focus:border-deep_lilac-400 focus:outline-none focus:ring-1 focus:ring-deep_lilac-200"
                      />
                    </div>

                    {/* Weekly day pills */}
                    {med.frequencyUnit === "WEEK" && (
                      <div className="flex flex-wrap gap-1">
                        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                          (day) => {
                            const code = day as WeekdayCode;
                            const active = med.weeklyDays.includes(code);
                            const reachedMax =
                              !active && med.weeklyDays.length >= med.frequency;

                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() =>
                                  !reachedMax && toggleWeeklyDay(med._id, code)
                                }
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  active
                                    ? "bg-deep_lilac-400 text-white"
                                    : reachedMax
                                    ? "bg-platinum-300 text-platinum-500 cursor-not-allowed"
                                    : "bg-platinum-400 text-ink_black-400"
                                }`}
                              >
                                {day}
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}

                    {/* Monthly dates: multiple chips up to frequency */}
                    {med.frequencyUnit === "MONTH" && (
                      <div className="flex flex-col gap-1">
                        <div>
                          <label className="mr-2 text-sm text-platinum-300">
                            Day of month:
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={31}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const value = parseInt(
                                  (e.target as HTMLInputElement).value
                                );
                                if (!isNaN(value)) {
                                  updateMonthlyDay(med._id, value);
                                  (e.target as HTMLInputElement).value = "";
                                }
                              }
                            }}
                            className="w-24 rounded border border-platinum-400 px-2 py-1 text-sm text-ink_black-400 focus:border-deep_lilac-400 focus:outline-none focus:ring-1 focus:ring-deep_lilac-200"
                            placeholder="1–31"
                          />
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {med.monthlyDates.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() =>
                                setSelectedMeds((prev) =>
                                  prev.map((m) =>
                                    m._id === med._id
                                      ? {
                                          ...m,
                                          monthlyDates: m.monthlyDates.filter(
                                            (x) => x !== d
                                          ),
                                        }
                                      : m
                                  )
                                )
                              }
                              className="rounded-full bg-deep_lilac-400 px-2 py-1 text-xs font-semibold text-white"
                            >
                              {d}
                            </button>
                          ))}
                          {med.monthlyDates.length >= med.frequency && (
                            <span className="text-xs text-platinum-400">
                              Max {med.frequency} dates reached
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => removeMedicine(med._id)}
                      className="font-semibold text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded border border-platinum-400 bg-white p-3 text-sm text-platinum-300">
              <p className="mb-1 font-medium text-dark_amethyst-500">
                Input Guide:
              </p>
              <p>
                <span className="font-semibold">Times:</span> How many times in
                the chosen period.
              </p>
              <p>
                <span className="font-semibold">Unit:</span> Period (per day,
                per week, per month).
              </p>
              <p>
                <span className="font-semibold">Weekdays:</span> When unit is
                week, select the specific days; you cannot select more days than
                the number of weekly doses.
              </p>
              <p>
                <span className="font-semibold">Day of month:</span> When unit
                is month, press Enter to add each date; you can add up to the
                number of monthly doses.
              </p>
              <p>
                <span className="font-semibold">Qty/dose:</span> Amount per
                dose (e.g., 2 for 2 tablets or 5 for 5ml).
              </p>
            </div>
          </div>
        )}

        {/* Available Medicines */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-dark_amethyst-500">
            Your Saved Medicines
          </h2>

          {medicines.length === 0 ? (
            <div className="rounded-lg bg-platinum-700 p-8 text-center">
              <p className="text-platinum-300">
                No medicines found. Add medicines from the search page first!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {medicines.map((med) => {
                const isSelected = selectedMeds.some(
                  (m) => m._id === med._id
                );
                const isDiscontinued =
                  med.Is_discontinued?.toUpperCase() === "TRUE";

                return (
                  <div
                    key={med._id}
                    onClick={() =>
                      !isDiscontinued &&
                      med.price &&
                      addMedicine(med)
                    }
                    className={`rounded-lg border p-4 transition-all ${
                      isSelected
                        ? "border-emerald-300 bg-emerald-50"
                        : isDiscontinued || !med.price
                        ? "cursor-not-allowed border-platinum-400 bg-platinum-700 opacity-60"
                        : "cursor-pointer border-platinum-400 bg-white hover:bg-platinum-500 hover:shadow-md"
                    }`}
                  >
                    <h3 className="mb-1 font-semibold text-dark_amethyst-500">
                      {med.name}
                    </h3>
                    {med.manufacturer_name && (
                      <p className="mb-2 text-xs text-platinum-300">
                        {med.manufacturer_name}
                      </p>
                    )}
                    <p className="mb-1 text-sm">
                      {med.price ? (
                        <span className="font-medium text-emerald-700">
                          ₹{med.price}{" "}
                          {med.pack_size_label
                            ? `/ ${med.pack_size_label}`
                            : "/ unit"}
                        </span>
                      ) : (
                        <span className="text-amber-700">
                          Price unavailable
                        </span>
                      )}
                    </p>
                    {med.short_composition1 && (
                      <p className="mt-1 line-clamp-1 text-xs text-platinum-300">
                        {med.short_composition1}
                      </p>
                    )}
                    {isDiscontinued && (
                      <p className="mt-1 text-xs font-semibold text-red-600">
                        ⚠️ Discontinued
                      </p>
                    )}
                    {isSelected && (
                      <p className="mt-1 text-xs font-semibold text-emerald-700">
                        ✓ Selected (click again to remove)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Calculate + Save buttons */}
        <div className="mb-8 flex justify-center gap-4">
          <button
            onClick={calculateCost}
            disabled={calculating || selectedMeds.length === 0}
            className="rounded-lg bg-deep_lilac-400 px-8 py-3 font-semibold text-periwinkle-900 transition-colors hover:bg-deep_lilac-300 disabled:cursor-not-allowed disabled:bg-platinum-400 disabled:text-platinum-700"
          >
            {calculating ? "Calculating..." : "Calculate Cost"}
          </button>

          {result && (
            <button
              onClick={saveAsPrescription}
              disabled={savingPrescription}
              className="rounded-lg bg-olive-500 px-8 py-3 font-semibold text-ink_black-500 transition-colors hover:bg-olive-400 disabled:cursor-not-allowed disabled:bg-platinum-400"
            >
              {savingPrescription ? "Saving..." : "Save as Prescription"}
            </button>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="mb-4 text-2xl font-bold text-emerald-800">
              Total Cost: ₹{result.finalCost}
            </h2>
            <p className="mb-4 text-lg text-ink_black-400">
              Duration: {result.numDays} days (
              {new Date(result.fromDate).toLocaleDateString()} -{" "}
              {new Date(result.toDate).toLocaleDateString()})
            </p>
            <h3 className="mb-3 font-semibold text-dark_amethyst-500">
              Breakdown by Medicine:
            </h3>
            <div className="space-y-2">
              {result.medicines.map((m: any, idx: number) => {
                const medDetails = selectedMeds.find(
                  (sm) => sm._id === m.medicineId
                );

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded bg-white p-3 ring-1 ring-platinum-400"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-dark_amethyst-500">
                        {medDetails?.name || "Unknown Medicine"}
                      </p>
                      <p className="text-sm text-platinum-300">
                        Frequency: {m.frequency} times / {m.frequencyUnit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-emerald-700">
                        ₹{m.cost}
                      </p>
                      <p className="text-xs text-platinum-300">
                        Total qty: {m.quantity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
