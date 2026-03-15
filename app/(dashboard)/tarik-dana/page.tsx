"use client";

import { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";

type TarikDanaResponse = {
  data: {
    id: number;
  };
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default function TarikDanaPage() {
  const [nominal, setNominal] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");
  const [buktiNota, setBuktiNota] = useState<string>("");
  const [buktiFileName, setBuktiFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(file: File | null) {
    if (!file) {
      setBuktiFileName(null);
      setBuktiNota("");
      return;
    }
    setBuktiFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setBuktiNota(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    setMessage(null);
    setError(null);

    const nominalValue = Number(nominal);
    if (!Number.isFinite(nominalValue) || nominalValue <= 0) {
      setError("Nominal harus lebih dari 0.");
      return;
    }

    if (!keterangan.trim()) {
      setError("Keterangan wajib diisi.");
      return;
    }

    if (!buktiNota) {
      setError("Bukti nota wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/tarik-dana", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nominal: nominalValue,
          keterangan: keterangan.trim(),
          bukti_nota: buktiNota,
          buktiNota: buktiNota,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Gagal mengajukan tarik dana.");
      }

      const payload = (await response.json()) as TarikDanaResponse;
      setMessage(`Pengajuan berhasil dikirim. ID: ${payload.data.id}`);
      setNominal("");
      setKeterangan("");
      setBuktiNota("");
      setBuktiFileName(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Pengajuan Tarik Dana" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <ComponentCard
            title="Form Pengajuan"
            desc="Ajukan penarikan dana kas dengan nominal, alasan, dan bukti nota."
          >
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Nominal</Label>
                <input
                  type="number"
                  min={0}
                  value={nominal}
                  onChange={(event) => setNominal(event.target.value)}
                  placeholder="Contoh: 500000"
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Total: Rp {formatRupiah(Number(nominal) || 0)}
                </p>
              </div>
              <div>
                <Label>Keterangan</Label>
                <TextArea
                  value={keterangan}
                  onChange={(value) => setKeterangan(value)}
                  rows={4}
                  placeholder="Contoh: pembelian peralatan acara"
                />
              </div>
              <div>
                <Label>Bukti Nota</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0] ?? null)
                  }
                  className="h-11 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                />
                {buktiFileName ? (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    File terpilih: {buktiFileName}
                  </div>
                ) : null}
                <div className="mt-3">
                  <Label>URL bukti nota</Label>
                  <Input
                    placeholder="Atau masukkan URL bukti nota"
                    type="text"
                    value={buktiNota}
                    onChange={(event) => setBuktiNota(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <ComponentCard title="Ringkasan" desc="Ringkasan pengajuan dana.">
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>Nominal</span>
                <span className="font-semibold text-gray-800 dark:text-white/90">
                  Rp {formatRupiah(Number(nominal) || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="rounded-full bg-warning-50 px-3 py-1 text-xs font-semibold text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                  Pending
                </span>
              </div>
            </div>
            {error ? (
              <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="rounded-lg bg-success-50 px-4 py-3 text-sm text-success-600 dark:bg-success-500/10 dark:text-success-400">
                {message}
              </div>
            ) : null}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
              size="sm"
            >
              {submitting ? "Mengirim..." : "Kirim Pengajuan"}
            </Button>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
