"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TitleBar from "@/components/TitleBar";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DayCellMountArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";

type FrequencyUnit = "DAY" | "WEEK" | "MONTH";
type WeekdayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

type PrescriptionMedicine = {
  medicineId: string;
  medicineName: string;
  dosage: number;
  frequency: number;
  frequencyUnit: FrequencyUnit;
  doseTimes: string[];
  weeklyDays?: WeekdayCode[];
  monthlyDates?: number[];
};

type Prescription = {
  _id: string;
  userId: string;
  startDate: string;
  endDate: string;
  medicines: PrescriptionMedicine[];
  isActive: boolean;
};

function isInRange(date: Date, startStr: string, endStr: string) {
  const d = new Date(date.toDateString());
  const s = new Date(new Date(startStr).toDateString());
  const e = new Date(new Date(endStr).toDateString());
  return d >= s && d <= e;
}

function isEndingSoon(date: Date, endStr: string, daysBefore = 2) {
  const d = new Date(date.toDateString());
  const e = new Date(new Date(endStr).toDateString());
  const diff = (e.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= daysBefore;
}

function daysBetween(date: Date, endStr: string) {
  const d = new Date(date.toDateString());
  const e = new Date(new Date(endStr).toDateString());
  const diffMs = e.getTime() - d.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function formatFrequency(m: PrescriptionMedicine) {
  if (m.frequencyUnit === "DAY") {
    return `${m.dosage} units × ${m.frequency} times/day`;
  }
  if (m.frequencyUnit === "WEEK") {
    const days = m.weeklyDays && m.weeklyDays.length > 0
      ? ` on ${m.weeklyDays.join(", ")}`
      : "";
    return `${m.dosage} units × ${m.frequency} times/week${days}`;
  }
  if (m.frequencyUnit === "MONTH") {
    const dates =
      m.monthlyDates && m.monthlyDates.length > 0
        ? ` on days ${m.monthlyDates.join(", ")}`
        : "";
    return `${m.dosage} units × ${m.frequency} times/month${dates}`;
  }
  return `${m.dosage} units × ${m.frequency}`;
}

export default function DashboardWithCalendar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<
    string | null
  >(null);
  const [mounted, setMounted] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayMeds, setSelectedDayMeds] = useState<PrescriptionMedicine[]>(
    [],
  );
  const [selectedDayEndingMeds, setSelectedDayEndingMeds] = useState<
    { med: PrescriptionMedicine; daysLeft: number }[]
  >([]);

  const selectedPrescription = prescriptions.find(
    (p) => p._id === selectedPrescriptionId,
  );

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

  useEffect(() => {
    setMounted(true);
    const u =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/fetch_prescription?userId=${user.id}`);
        const data = await res.json();
        if (res.ok) {
          setPrescriptions(data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [user]);

  if (!mounted) {
    return (
      <div className="mt-10 min-h-screen bg-white">
        <TitleBar />
        <main className="mx-auto flex max-w-6xl flex-col px-4 pb-12 pt-6 sm:pt-8">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-dark_amethyst-500">
            Tracking calendar
          </h1>
          <p className="mb-6 text-sm text-platinum-300">
            Loading your prescriptions and calendar...
          </p>
        </main>
      </div>
    );
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden rounded-2xl border border-platinum-400 bg-white">
          <DialogHeader>
            <DialogTitle className="text-dark_amethyst-500">
              {selectedDay
                ? `Medicines on ${selectedDay.toDateString()}`
                : "Medicines"}
            </DialogTitle>
            <DialogDescription className="text-platinum-300">
              Dosage details for active prescriptions on this day.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 space-y-4 overflow-y-auto pt-1">
            {selectedDayEndingMeds.length > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
                <p className="mb-2 font-semibold text-amber-800">
                  Medicines ending soon
                </p>
                <div className="space-y-2">
                  {selectedDayEndingMeds.map(({ med, daysLeft }) => (
                    <div key={med.medicineId} className="text-amber-900">
                      <p className="font-semibold">{med.medicineName}</p>
                      <p>
                        Ends in {daysLeft} day{daysLeft === 1 ? "" : "s"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDayMeds.length === 0 ? (
              <p className="text-sm text-platinum-300">
                No medicines scheduled for this day.
              </p>
            ) : (
              selectedDayMeds.map((m) => (
                <div
                  key={m.medicineId}
                  className="rounded-xl border border-platinum-400 bg-platinum-500 p-3 text-sm"
                >
                  <p className="font-semibold text-dark_amethyst-500">
                    {m.medicineName}
                  </p>
                  <p className="text-ink_black-400">
                    {formatFrequency(m)}
                  </p>
                  {m.doseTimes && m.doseTimes.length > 0 && (
                    <p className="text-ink_black-400">
                      Times: {m.doseTimes.join(", ")}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="outline" className="border-platinum-400">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-10 min-h-screen bg-white">
        <TitleBar />
        <main className="mx-auto flex max-w-6xl flex-col px-4 pb-12 pt-6 sm:pt-8">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-dark_amethyst-500">
            Tracking calendar
          </h1>
          <p className="mb-6 text-sm text-platinum-300">
            See when your prescriptions are active and which ones are ending
            soon.
          </p>

          {loading ? (
            <p className="text-sm text-platinum-300">
              Loading prescriptions…
            </p>
          ) : (
            <section className="rounded-2xl bg-white p-5 text-sm shadow-sm ring-1 ring-platinum-400 sm:p-6">
              <div className="flex flex-col gap-6 md:flex-row">
                <div className="w-full space-y-3 md:w-1/3">
                  {prescriptions.length === 0 && (
                    <p className="text-sm text-platinum-300">
                      No prescriptions found.
                    </p>
                  )}
                  {prescriptions.map((p, idx) => {
                    const isSelected = p._id === selectedPrescriptionId;

                    const defaultTitle = `Prescription ${idx + 1}`;
                    const medNames = p.medicines.map((m) => m.medicineName);
                    const detailedTitle =
                      medNames.length === 1
                        ? medNames[0]
                        : `${medNames[0]} + ${medNames.length - 1} more`;

                    const title = isSelected ? detailedTitle : defaultTitle;

                    const today = new Date();
                    const todayMidnight = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate(),
                    );
                    const endDate = new Date(p.endDate);
                    const endMidnight = new Date(
                      endDate.getFullYear(),
                      endDate.getMonth(),
                      endDate.getDate(),
                    );
                    const isActiveByDate = endMidnight >= todayMidnight;

                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() =>
                          setSelectedPrescriptionId(
                            isSelected ? null : p._id,
                          )
                        }
                        className={`w-full rounded-2xl border px-3 py-2 text-left transition ${
                          isSelected
                            ? "border-deep_lilac-400 bg-deep_lilac-800"
                            : "border-platinum-400 bg-platinum-700 hover:border-deep_lilac-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                isSelected
                                  ? "text-periwinkle-100"
                                  : "text-dark_amethyst-500"
                              }`}
                            >
                              {title}
                            </p>
                            <p
                              className={`text-xs ${
                                isSelected
                                  ? "text-platinum-100"
                                  : "text-platinum-300"
                              }`}
                            >
                              {new Date(
                                p.startDate,
                              ).toLocaleDateString()}{" "}
                              – {new Date(
                                p.endDate,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              isActiveByDate
                                ? "bg-olive-500 text-ink_black-500"
                                : "bg-platinum-400 text-ink_black-400"
                            }`}
                          >
                            {isActiveByDate ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {isSelected && (
                          <div className="mt-2 space-y-2 border-t border-platinum-400 pt-2 text-xs">
                            {p.medicines.map((m) => (
                              <div key={m.medicineId}>
                                <p className="font-semibold text-periwinkle-100">
                                  {m.medicineName}
                                </p>
                                <p className="text-platinum-100">
                                  {formatFrequency(m)}
                                </p>
                                {m.doseTimes && m.doseTimes.length > 0 && (
                                  <p className="text-platinum-100">
                                    Times: {m.doseTimes.join(", ")}
                                  </p>
                                )}
                              </div>
                            ))}
                            <p className="text-platinum-100">
                              <span className="font-semibold">
                                Prescription ID:
                              </span>{" "}
                              {p._id}
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="w-full md:w-2/3">
                  <div className="rounded-2xl border border-platinum-400 bg-platinum-500 p-4">
                    <FullCalendar
                      key={selectedPrescriptionId ?? "all"}
                      plugins={[dayGridPlugin, interactionPlugin]}
                      initialView="dayGridMonth"
                      height="auto"
                      dayMaxEventRows={3}
                      headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "",
                      }}
                      dateClick={(info: DateClickArg) => {
                        const date = info.date;

                        const dayPresAll = prescriptions.filter((p) =>
                          isInRange(date, p.startDate, p.endDate),
                        );
                        const dayPres =
                          selectedPrescription != null
                            ? dayPresAll.filter(
                                (p) => p._id === selectedPrescription._id,
                              )
                            : dayPresAll;

                        const meds: PrescriptionMedicine[] = [];
                        const endingMeds: {
                          med: PrescriptionMedicine;
                          daysLeft: number;
                        }[] = [];

                        dayPres.forEach((p) => {
                          const daysLeft = daysBetween(date, p.endDate);
                          p.medicines.forEach((m) => {
                            meds.push(m);
                            if (daysLeft >= 0 && daysLeft <= 2) {
                              endingMeds.push({ med: m, daysLeft });
                            }
                          });
                        });

                        setSelectedDay(date);
                        setSelectedDayMeds(meds);
                        setSelectedDayEndingMeds(endingMeds);
                        setIsDialogOpen(true);
                      }}
                      dayCellDidMount={(arg: DayCellMountArg) => {
                        const date = arg.date;

                        const dayPresAll = prescriptions.filter((p) =>
                          isInRange(date, p.startDate, p.endDate),
                        );
                        const dayPres =
                          selectedPrescription != null
                            ? dayPresAll.filter(
                                (p) => p._id === selectedPrescription._id,
                              )
                            : dayPresAll;

                        if (!dayPres.length) return;

                        const hasEndingSoon = dayPres.some((p) =>
                          isEndingSoon(date, p.endDate, 2),
                        );

                        const totalMeds = dayPres.reduce(
                          (sum, p) => sum + (p.medicines?.length || 0),
                          0,
                        );

                        const container = document.createElement("div");
                        container.className =
                          "mt-1 flex flex-col gap-0.5";

                        if (hasEndingSoon) {
                          const badge = document.createElement("span");
                          badge.className =
                            "rounded-full bg-amber-100 px-1 text-[9px] font-semibold text-amber-800";
                          badge.innerText = "Ending soon";
                          container.appendChild(badge);
                        }

                        const medsSpan = document.createElement("span");
                        medsSpan.className =
                          "rounded-full bg-deep_lilac-800 px-1 text-[9px] text-bg-deep_lilac-800";
                        medsSpan.innerText = `${totalMeds} med`;
                        container.appendChild(medsSpan);

                        arg.el
                          .querySelector(".fc-daygrid-day-top")
                          ?.appendChild(container);
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
