"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import {
  SearchableSelect,
  MultiSearchableSelect,
  ComboboxOption,
} from "@/components/form/SearchableDropdown";
import Button from "@/components/ui/button/Button";
import {
  getUsers,
  getAnggotasForDropdown,
  getRolesForDropdown,
  createUser,
  updateUser,
  deleteUser,
  bulkCreateUsers,
} from "@/lib/actions/users.actions";
import EnhancedDataTable, { ColumnDef } from "@/components/common/EnhancedDataTable";
import { ExportColumnDef } from "@/lib/utils/excelExport";
import {
  Pencil,
  Trash2,
  Lock,
} from "lucide-react";

// ----- types -----

type UserRow = {
  id: number;
  username: string;
  anggota: {
    id: number;
    nama: string;
    nim: string;
  } | null;
  roles: Array<{
    id: number;
    name: string;
  }>;
};

type AnggotaOption = {
  id: number;
  nama: string;
  nim: string;
  statusAktif: boolean;
  user: { id: number } | null;
};

type RoleOption = {
  id: number;
  name: string;
};

// ----- component -----

export default function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [anggotaList, setAnggotaList] = useState<AnggotaOption[]>([]);
  const [rolesList, setRolesList] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Form states
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formAnggotaId, setFormAnggotaId] = useState("");
  const [formRoleIds, setFormRoleIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  // ----- fetch -----

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [usersResult, anggotasResult, rolesResult] = await Promise.all([
      getUsers(),
      getAnggotasForDropdown(),
      getRolesForDropdown(),
    ]);

    if (usersResult.success) {
      setUsers(usersResult.data as UserRow[]);
    } else {
      setError(usersResult.error);
    }

    if (anggotasResult.success) {
      setAnggotaList(anggotasResult.data as AnggotaOption[]);
    }

    if (rolesResult.success) {
      setRolesList(rolesResult.data as RoleOption[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ----- Table Column Definitions -----

  const displayColumns: ColumnDef[] = [
    {
      key: "username",
      label: "Username",
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-gray-400" />
          {value}
        </div>
      ),
    },
    {
      key: "anggota",
      label: "Anggota",
      sortable: true,
      render: (value: UserRow["anggota"]) =>
        value ? (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-gray-700 dark:text-white/80">
              {value.nama}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {value.nim}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">—</span>
        ),
    },
    {
      key: "roles",
      label: "Roles",
      sortable: false,
      render: (value: UserRow["roles"]) =>
        value && value.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {value.map((role) => (
              <span
                key={role.id}
                className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
              >
                {role.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">—</span>
        ),
    },
  ];

  // ----- Export Column Definitions -----

  const usersExportColumns: ExportColumnDef[] = [
    { key: "username", label: "Username" },
    { key: "anggota", label: "NIM", relationshipType: "anggota" },
    { key: "roles", label: "Roles", relationshipType: "roles" },
  ];

  // ----- Actions Column -----

  const displayColumnsWithActions: ColumnDef[] = [
    ...displayColumns,
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_, row: UserRow) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // Build anggota and roles select options
  const anggotaSelectOptions: ComboboxOption[] = anggotaList.map((a) => ({
    value: String(a.id),
    label: a.nama,
    sublabel: a.nim,
  }));

  const rolesSelectOptions: ComboboxOption[] = rolesList.map((r) => ({
    value: String(r.id),
    label: r.name,
  }));

  // ----- CREATE -----

  function openCreateModal() {
    setFormUsername("");
    setFormPassword("");
    setFormAnggotaId("");
    setFormRoleIds([]);
    setFormError("");
    setShowCreateModal(true);
  }

  async function handleCreate() {
    setFormError("");

    if (!formUsername.trim()) {
      setFormError("Username is required");
      return;
    }
    if (!formPassword.trim()) {
      setFormError("Password is required");
      return;
    }
    if (formPassword.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    if (!formAnggotaId) {
      setFormError("Anggota is required");
      return;
    }
    if (formRoleIds.length === 0) {
      setFormError("At least one role is required");
      return;
    }

    setSubmitting(true);
    const result = await createUser({
      username: formUsername,
      password: formPassword,
      anggotaId: Number(formAnggotaId),
      roleIds: formRoleIds.map(Number),
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

  function openEditModal(user: UserRow) {
    setSelectedUser(user);
    setFormUsername(user.username);
    setFormPassword("");
    setFormAnggotaId(String(user.anggota?.id || ""));
    setFormRoleIds(user.roles.map((r) => String(r.id)));
    setFormError("");
    setShowEditModal(true);
  }

  async function handleUpdate() {
    if (!selectedUser) return;
    setFormError("");

    if (!formUsername.trim()) {
      setFormError("Username is required");
      return;
    }
    if (!formAnggotaId) {
      setFormError("Anggota is required");
      return;
    }
    if (formRoleIds.length === 0) {
      setFormError("At least one role is required");
      return;
    }

    setSubmitting(true);
    const result = await updateUser(selectedUser.id, {
      username: formUsername,
      password: formPassword || undefined,
      anggotaId: Number(formAnggotaId),
      roleIds: formRoleIds.map(Number),
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

  function openDeleteModal(user: UserRow) {
    setSelectedUser(user);
    setDeleteError("");
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!selectedUser) return;
    setDeleteError("");
    setSubmitting(true);
    const result = await deleteUser(selectedUser.id);
    setSubmitting(false);
    if (result.success) {
      setShowDeleteModal(false);
      fetchData();
    } else {
      setDeleteError(result.error);
    }
  }

  // ----- IMPORT -----

  async function handleImport(importedData: Record<string, any>[]) {
    try {
      // Map imported data to BulkImportUserInput format
      const mappedData = importedData.map((row) => ({
        username: row.username || row.Username,
        password: row.password || row.Password || "pcc2026", // Default password if not provided
        anggota: row.nim || row.NIM || undefined,
        roles: row.roles || row.Roles || undefined,
      }));

      const result = await bulkCreateUsers(mappedData);

      if (result.success && result.data) {
        const summary = result.data;
        if (summary.errorCount > 0) {
          setError(
            `Import completed with errors: ${summary.createdCount} created, ${summary.errorCount} failed, ${summary.skippedCount} skipped. Check errors below.`
          );
        } else {
          setError(`Successfully imported ${summary.createdCount} users!`);
        }
        fetchData();
      } else {
        setError("Import failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import error");
    }
  }

  // ----- FORM FIELDS -----

  function renderFormFields(mode: "create" | "edit") {
    return (
      <div className="space-y-4">
        {/* Username */}
        <div>
          <Label htmlFor={`${mode}-user-username`}>Username</Label>
          <Input
            id={`${mode}-user-username`}
            type="text"
            placeholder="e.g. ahmad.fauzi"
            value={formUsername}
            onChange={(e) => setFormUsername(e.target.value)}
          />
        </div>

        {/* Password */}
        <div>
          <Label htmlFor={`${mode}-user-password`}>Password</Label>
          <Input
            id={`${mode}-user-password`}
            type="password"
            placeholder={
              mode === "create"
                ? "e.g. SecurePass123"
                : "Leave blank to keep current password"
            }
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            hint={
              mode === "edit"
                ? "Leave blank if you don't want to change the password"
                : "Minimum 6 characters"
            }
          />
        </div>

        {/* Anggota Dropdown */}
        <div>
          <Label htmlFor={`${mode}-user-anggota`}>Anggota</Label>
          <SearchableSelect
            options={anggotaSelectOptions}
            value={formAnggotaId}
            onChange={setFormAnggotaId}
            placeholder="Search by nama or NIM..."
          />
        </div>

        {/* Roles Multi-Select */}
        <div>
          <Label htmlFor={`${mode}-user-roles`}>Roles</Label>
          <MultiSearchableSelect
            options={rolesSelectOptions}
            value={formRoleIds}
            onChange={setFormRoleIds}
            placeholder="Search and select roles..."
          />
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
      <EnhancedDataTable
        title="Users Management"
        description="Manage system users, credentials, and role assignments"
        columns={displayColumnsWithActions}
        data={users}
        loading={loading}
        error={error}
        onCreateClick={openCreateModal}
        onImport={handleImport}
        exportFilename="users_export"
        exportColumns={usersExportColumns}
        createButtonLabel="Add User"
        showExport={true}
        showImport={true}
        searchPlaceholder="Search by username or anggota nama..."
      />

      {/* ── CREATE MODAL ── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        className="max-w-lg p-6 lg:p-8"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Add New User
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
            {submitting ? "Creating..." : "Create User"}
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
          Edit User
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
            {submitting ? "Updating..." : "Update User"}
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
            Delete User
          </h3>
          <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-700 dark:text-white/80">
              &quot;{selectedUser?.username}&quot;
            </span>
            ?
          </p>
          <p className="mb-6 text-xs text-gray-400 dark:text-gray-500">
            Anggota: {selectedUser?.anggota?.nama || "—"} · This action cannot be
            undone.
          </p>
          {deleteError && (
            <div className="mb-4 w-full rounded-lg border border-error-300 bg-error-50 px-3 py-2 text-left text-xs text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {deleteError}
            </div>
          )}
          <div className="flex w-full gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 bg-error-500 hover:bg-error-600"
            >
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
