"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import {
  getAnggotas,
  getJabatanOptions,
  createAnggota,
  updateAnggota,
  deleteAnggota,
} from "@/lib/actions/anggota.actions";
import {
  Pencil,
  Trash2,
  Plus,
  AlertCircle,
  UserCheck,
  UserX,
  Phone,
} from "lucide-react";

// ----- types -----

type JabatanOption = {
  id: number;
  namaJabatan: string;
  kategori: string;
};

type AnggotaRow = {
  id: number;
  nim: string;
  nama: string;
  noTelepon: string;
  jabatanId: number;
  statusAktif: boolean;
  jabatan: JabatanOption;
  user: { id: number; username: string } | null;
};

const KATEGORI_BADGE: Record<string, string> = {
  DIVISI: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  DEPARTEMEN: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  INTI: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

// ----- component -----

export default function AnggotaTable() {
  const [anggotas, setAnggotas] = useState<AnggotaRow[]>([]);
  const [jabatanList, setJabatanList] = useState<JabatanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [formNim, setFormNim] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formTelepon, setFormTelepon] = useState("");
  const [formJabatanId, setFormJabatanId] = useState("");
  const [formStatusAktif, setFormStatusAktif] = useState(true);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnggota, setSelectedAnggota] = useState<AnggotaRow | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");

  // ----- fetch -----

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [anggotaResult, jabatanResult] = await Promise.all([
      getAnggotas(),
      getJabatanOptions(),
    ]);

    if (anggotaResult.success) {
      setAnggotas(anggotaResult.data as AnggotaRow[]);
    } else {
      setError(anggotaResult.error);
    }

    if (jabatanResult.success) {
      setJabatanList(jabatanResult.data as JabatanOption[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build jabatan select options: grouped by kategori label
  const jabatanSelectOptions = jabatanList.map((j) => ({
    value: String(j.id),
    label: `${j.namaJabatan} (${j.kategori})`,
  }));

  // Filtered list
  const filteredAnggotas = anggotas.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.nim.toLowerCase().includes(q) ||
      a.nama.toLowerCase().includes(q) ||
      a.noTelepon.toLowerCase().includes(q) ||
      a.jabatan.namaJabatan.toLowerCase().includes(q)
    );
  });

  // ----- CREATE -----

  function openCreateModal() {
    setFormNim("");
    setFormNama("");
    setFormTelepon("");
    setFormJabatanId("");
    setFormStatusAktif(true);
    setFormError("");
    setShowCreateModal(true);
  }

  async function handleCreate() {
    setFormError("");
    if (!formNim.trim()) { setFormError("NIM is required"); return; }
    if (!formNama.trim()) { setFormError("Nama is required"); return; }
    if (!formTelepon.trim()) { setFormError("No. Telepon is required"); return; }
    if (!formJabatanId) { setFormError("Jabatan is required"); return; }

    setSubmitting(true);
    const result = await createAnggota({
      nim: formNim,
      nama: formNama,
      noTelepon: formTelepon,
      jabatanId: Number(formJabatanId),
      statusAktif: formStatusAktif,
    });
    setSubmitting(false);

    if (result.success) {
      setShowCreateModal(false);
      fetchData();
    } else {
      setFormError(result.error);
    }
  }

  // ----- UPDATE -----

  function openEditModal(anggota: AnggotaRow) {
    setSelectedAnggota(anggota);
    setFormNim(anggota.nim);
    setFormNama(anggota.nama);
    setFormTelepon(anggota.noTelepon);
    setFormJabatanId(String(anggota.jabatanId));
    setFormStatusAktif(anggota.statusAktif);
    setFormError("");
    setShowEditModal(true);
  }

  async function handleUpdate() {
    if (!selectedAnggota) return;
    setFormError("");
    if (!formNim.trim()) { setFormError("NIM is required"); return; }
    if (!formNama.trim()) { setFormError("Nama is required"); return; }
    if (!formTelepon.trim()) { setFormError("No. Telepon is required"); return; }
    if (!formJabatanId) { setFormError("Jabatan is required"); return; }

    setSubmitting(true);
    const result = await updateAnggota(selectedAnggota.id, {
      nim: formNim,
      nama: formNama,
      noTelepon: formTelepon,
      jabatanId: Number(formJabatanId),
      statusAktif: formStatusAktif,
    });
    setSubmitting(false);

    if (result.success) {
      setShowEditModal(false);
      fetchData();
    } else {
      setFormError(result.error);
    }
  }

  // ----- DELETE -----

  function openDeleteModal(anggota: AnggotaRow) {
    setSelectedAnggota(anggota);
    setFormError("");
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!selectedAnggota) return;
    setFormError("");
    setSubmitting(true);
    const result = await deleteAnggota(selectedAnggota.id);
    setSubmitting(false);
    if (result.success) {
      setShowDeleteModal(false);
      fetchData();
    } else {
      setFormError(result.error);
    }
  }

  // ----- form fields (shared between Create & Edit) -----

  function renderFormFields(mode: "create" | "edit") {
    return (
      <div className="space-y-4">
        {/* NIM */}
        <div>
          <Label htmlFor={`${mode}-anggota-nim`}>NIM</Label>
          <Input
            id={`${mode}-anggota-nim`}
            type="text"
            placeholder="e.g. 12345678"
            value={formNim}
            onChange={(e) => setFormNim(e.target.value)}
          />
        </div>

        {/* Nama */}
        <div>
          <Label htmlFor={`${mode}-anggota-nama`}>Nama Lengkap</Label>
          <Input
            id={`${mode}-anggota-nama`}
            type="text"
            placeholder="e.g. Ahmad Fauzi"
            value={formNama}
            onChange={(e) => setFormNama(e.target.value)}
          />
        </div>

        {/* No Telepon */}
        <div>
          <Label htmlFor={`${mode}-anggota-telepon`}>No. Telepon</Label>
          <Input
            id={`${mode}-anggota-telepon`}
            type="text"
            placeholder="e.g. 081234567890"
            value={formTelepon}
            onChange={(e) => setFormTelepon(e.target.value)}
          />
        </div>

        {/* Jabatan Dropdown */}
        <div>
          <Label htmlFor={`${mode}-anggota-jabatan`}>Jabatan</Label>
          <Select
            key={mode === "edit" ? selectedAnggota?.id : "create"}
            options={jabatanSelectOptions}
            placeholder="Pilih jabatan"
            onChange={(val) => setFormJabatanId(val)}
            defaultValue={mode === "edit" ? formJabatanId : ""}
          />
        </div>

        {/* Status Aktif Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={formStatusAktif}
            onClick={() => setFormStatusAktif(!formStatusAktif)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              formStatusAktif
                ? "bg-brand-500"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                formStatusAktif ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <Label className="mb-0 cursor-pointer">
            {formStatusAktif ? "Aktif" : "Tidak Aktif"}
          </Label>
        </div>

        {/* Error */}
        {formError && (
          <p className="text-xs text-error-500">{formError}</p>
        )}
      </div>
    );
  }

  // ----- RENDER -----

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Anggota Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage organization members and their positions
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          startIcon={<Plus className="h-4 w-4" />}
          onClick={openCreateModal}
        >
          Add Anggota
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by NIM, nama, telepon, or jabatan..."
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pl-10 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 dark:border-gray-800">
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  No
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  NIM
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nama
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    No. Telepon
                  </span>
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Jabatan
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                  User
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    colSpan={8}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      Loading anggota...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAnggotas.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    colSpan={8}
                  >
                    {searchQuery
                      ? "No matching anggota found."
                      : 'No anggota found. Click "Add Anggota" to create one.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAnggotas.map((anggota, index) => (
                  <TableRow
                    key={anggota.id}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm font-mono text-gray-700 dark:text-white/80">
                      {anggota.nim}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {anggota.nama}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {anggota.noTelepon}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-700 dark:text-white/80">
                          {anggota.jabatan.namaJabatan}
                        </span>
                        <span
                          className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            KATEGORI_BADGE[anggota.jabatan.kategori] ?? ""
                          }`}
                        >
                          {anggota.jabatan.kategori}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm">
                      {anggota.statusAktif ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-500/10 dark:text-success-400">
                          <UserCheck className="h-3 w-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <UserX className="h-3 w-3" />
                          Tidak Aktif
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {anggota.user ? (
                        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                          {anggota.user.username}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(anggota)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(anggota)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer count */}
        {!loading && (
          <div className="border-t border-gray-100 px-5 py-3 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing {filteredAnggotas.length} of {anggotas.length} anggota
            </p>
          </div>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        className="max-w-lg p-6 lg:p-8"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Add New Anggota
        </h3>
        {renderFormFields("create")}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Anggota"}
          </Button>
        </div>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        className="max-w-lg p-6 lg:p-8"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Edit Anggota
        </h3>
        {renderFormFields("edit")}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpdate}
            disabled={submitting}
          >
            {submitting ? "Updating..." : "Update Anggota"}
          </Button>
        </div>
      </Modal>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        className="max-w-sm p-6 lg:p-8"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/10">
            <Trash2 className="h-5 w-5 text-error-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
            Delete Anggota
          </h3>
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-700 dark:text-white/80">
              &quot;{selectedAnggota?.nama}&quot;
            </span>
            ?
          </p>
          <p className="mb-6 text-xs text-gray-400 dark:text-gray-500">
            NIM: {selectedAnggota?.nim} · This action cannot be undone.
          </p>
          {formError && (
            <div className="mb-4 w-full rounded-lg border border-error-300 bg-error-50 px-3 py-2 text-left text-xs text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {formError}
            </div>
          )}
          <div className="flex w-full items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <button
              onClick={handleDelete}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-error-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
