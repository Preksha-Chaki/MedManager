"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Medicine } from "@/app/page";
import { Button } from "@/components/ui/button";

type MedicineDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicine: Medicine | null;
  similarMeds: Medicine[];
  onSelectSimilar: (med: Medicine) => void; // callback to parent
};

export function MedicineDialog({
  open,
  onOpenChange,
  medicine,
  similarMeds,
  onSelectSimilar,
}: MedicineDialogProps) {
  if (!medicine) return null;

  const isDiscontinued =
    medicine.Is_discontinued?.toUpperCase() === "TRUE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-dark_amethyst-500">
            {medicine.name}
          </DialogTitle>
          <DialogDescription className="text-platinum-300">
            {medicine.manufacturer_name || "Medicine details"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="font-medium text-platinum-300">Type</p>
              <p className="text-ink_black-400">
                {medicine.type || "Not specified"}
              </p>
            </div>
            <div>
              <p className="font-medium text-platinum-300">Pack size</p>
              <p className="text-ink_black-400">
                {medicine.pack_size_label || "Not specified"}
              </p>
            </div>
            <div>
              <p className="font-medium text-platinum-300">Price</p>
              <p className="font-semibold text-emerald-700">
                {medicine.price != null
                  ? `₹${medicine.price}${
                      medicine.pack_size_label
                        ? ` / ${medicine.pack_size_label}`
                        : " / unit"
                    }`
                  : "Price unavailable"}
              </p>
            </div>
            <div>
              <p className="font-medium text-platinum-300">Status</p>
              <p className="text-ink_black-400">
                {isDiscontinued ? "Discontinued" : "Available"}
              </p>
            </div>
          </div>

          {(medicine.short_composition1 || medicine.short_composition2) && (
            <div>
              <p className="font-medium text-platinum-300">Composition</p>
              <p className="text-ink_black-400">
                {medicine.short_composition1}
                {medicine.short_composition2 &&
                  `, ${medicine.short_composition2}`}
              </p>
            </div>
          )}
        </div>

        {similarMeds.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-dark_amethyst-500">
              Similar medicines (same short composition)
            </p>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {similarMeds.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => onSelectSimilar(m)} // update parent state
                  className="flex w-full items-start justify-between rounded-lg border border-platinum-400 bg-platinum-700 px-3 py-2 text-left text-xs hover:bg-platinum-600"
                >
                  <div>
                    <p className="font-medium text-dark_amethyst-500">
                      {m.name}
                    </p>
                    {m.manufacturer_name && (
                      <p className="text-[11px] text-platinum-300">
                        {m.manufacturer_name}
                      </p>
                    )}
                  </div>
                  {m.price != null && (
                    <p className="text-[11px] font-semibold text-emerald-700">
                      ₹{m.price}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
