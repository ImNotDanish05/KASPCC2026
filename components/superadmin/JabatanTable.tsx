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
  getJabatans,
  createJabatan,
  updateJabatan,
  deleteJabatan,
} from "@/lib/actions/jabatan.actions";
import { Pencil, Trash2, Plus, AlertCircle, Users } from "lucide-react";

// ----- types -----

type JabatanRow = {
  id: number;
  namaJabatan: string;
  kategori: "DIVISI" | "DEPARTEMEN" | "INTI";
  anggotas: { id: number; nama: string }[];
};

const KATEGORI_OPTIONS = [
  { value: "DIVISI", label: "Divisi" },
  { value: "DEPARTEMEN", label: "Departemen" },
  { value: "INTI", label: "Inti" },
];

const KATEGORI_BADGE: Record<string, string> = {
  DIVISI:
    "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  DEPARTEMEN:
    "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  INTI:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
};

// ----- component -----

export default function JabatanTable() {
  const [jabatans, setJabatans] = useState<JabatanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formKategori, setFormKategori] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedJabatan, setSelectedJabatan] = useState<JabatanRow | null>(null);

  // ----- fetch -----

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await getJabatans();
    if (result.success) {
      setJabatans(result.data as JabatanRow[]);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ----- CREATE -----

  function openCreateModal() {
    setFormName("");
    setFormKategori("");
    setFormError("");
    setShowCreateModal(true);
  }

  async function handleCreate() {
    setFormError("");
    if (!formName.trim()) {
      setFormError("Nama jabatan is required");
      return;
    }
    if (!formKategori) {
      setFormError("Kategori is required");
      return;
    }
    setSubmitting(true);
    const result = await createJabatan(formName, formKategori);
    setSubmitting(false);
    if (result.success) {
      setShowCreateModal(false);
      fetchData();
    } else {
      setFormError(result.error);
    }
  }

  // ----- UPDATE -----

  function openEditModal(jabatan: JabatanRow) {
    setSelectedJabatan(jabatan);
    setFormName(jabatan.namaJabatan);
    setFormKategori(jabatan.kategori);
    setFormError("");
    setShowEditModal(true);
  }

  async function handleUpdate() {
    if (!selectedJabatan) return;
    setFormError("");
    if (!formName.trim()) {
      setFormError("Nama jabatan is required");
      return;
    }
    if (!formKategori) {
      setFormError("Kategori is required");
      return;
    }
    setSubmitting(true);
    const result = await updateJabatan(selectedJabatan.id, formName, formKategori);
    setSubmitting(false);
    if (result.success) {
      setShowEditModal(false);
      fetchData();
    } else {
      setFormError(result.error);
    }
  }

  // ----- DELETE -----

  function openDeleteModal(jabatan: JabatanRow) {
    setSelectedJabatan(jabatan);
    setFormError("");
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!selectedJabatan) return;
    setFormError("");
    setSubmitting(true);
    const result = await deleteJabatan(selectedJabatan.id);
    setSubmitting(false);
    if (result.success) {
      setShowDeleteModal(false);
      fetchData();
    } else {
      setFormError(result.error);
    }
  }

  // ----- RENDER -----

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Jabatan Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage organizational positions and divisions
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          startIcon={<Plus className="h-4 w-4" />}
          onClick={openCreateModal}
        >
          Add Jabatan
        </Button>
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
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  No
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Nama Jabatan
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Kategori
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Anggota
                  </span>
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    colSpan={5}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      Loading jabatan...
                    </div>
                  </TableCell>
                </TableRow>
              ) : jabatans.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    colSpan={5}
                  >
                    No jabatan found. Click &quot;Add Jabatan&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                jabatans.map((jabatan, index) => (
                  <TableRow
                    key={jabatan.id}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {jabatan.namaJabatan}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          KATEGORI_BADGE[jabatan.kategori] ?? ""
                        }`}
                      >
                        {jabatan.kategori}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {jabatan.anggotas.length > 0 ? (
                        <span className="font-medium text-gray-700 dark:text-white/80">
                          {jabatan.anggotas.length} anggota
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(jabatan)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(jabatan)}
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
      </div>

      {/* ── CREATE MODAL ── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        className="max-w-md p-6 lg:p-8"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Add New Jabatan
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="create-jabatan-name">Nama Jabatan</Label>
            <Input
              id="create-jabatan-name"
              type="text"
              placeholder="e.g. Ketua Divisi"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="create-jabatan-kategori">Kategori</Label>
            <Select
              options={KATEGORI_OPTIONS}
              placeholder="Pilih kategori"
              onChange={(val) => setFormKategori(val)}
              defaultValue=""
            />
          </div>
          {formError && (
            <p className="text-xs text-error-500">{formError}</p>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
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
              {submitting ? "Saving..." : "Save Jabatan"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        className="max-w-md p-6 lg:p-8"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Edit Jabatan
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-jabatan-name">Nama Jabatan</Label>
            <Input
              id="edit-jabatan-name"
              type="text"
              placeholder="e.g. Ketua Divisi"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-jabatan-kategori">Kategori</Label>
            <Select
              key={selectedJabatan?.id}
              options={KATEGORI_OPTIONS}
              placeholder="Pilih kategori"
              onChange={(val) => setFormKategori(val)}
              defaultValue={selectedJabatan?.kategori ?? ""}
            />
          </div>
          {formError && (
            <p className="text-xs text-error-500">{formError}</p>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
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
              {submitting ? "Updating..." : "Update Jabatan"}
            </Button>
          </div>
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
            Delete Jabatan
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-700 dark:text-white/80">
              &quot;{selectedJabatan?.namaJabatan}&quot;
            </span>
            ? This action cannot be undone.
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
