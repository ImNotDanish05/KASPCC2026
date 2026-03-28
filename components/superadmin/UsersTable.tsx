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
import {
  SearchableSelect,
  MultiSearchableSelect,
  ComboboxOption,
} from "@/components/form/SearchableDropdown";
import {
  getUsers,
  getAnggotasForDropdown,
  getRolesForDropdown,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/actions/users.actions";
import {
  Pencil,
  Trash2,
  Plus,
  AlertCircle,
  Lock,
  Users,
} from "lucide-react";

// ----- types -----

type UserRow = {
  id: number;
  username: string;
  anggota: {
    id: number;
    nama: string;
    nim: string;
  };
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

  // Form states
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formAnggotaId, setFormAnggotaId] = useState("");
  const [formRoleIds, setFormRoleIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");

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

  // Build anggota select options: "Nama (NIM)"
  const anggotaSelectOptions: ComboboxOption[] = anggotaList.map((a) => ({
    value: String(a.id),
    label: a.nama,
    sublabel: a.nim,
  }));

  // Build roles select options
  const rolesSelectOptions: ComboboxOption[] = rolesList.map((r) => ({
    value: String(r.id),
    label: r.name,
  }));

  // Filtered list
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.anggota.nama.toLowerCase().includes(q)
    );
  });

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
    setFormAnggotaId(String(user.anggota.id));
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
    setFormError("");
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!selectedUser) return;
    setFormError("");
    setSubmitting(true);
    const result = await deleteUser(selectedUser.id);
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Users Management
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage system users, credentials, and role assignments
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          startIcon={<Plus className="h-4 w-4" />}
          onClick={openCreateModal}
        >
          Add User
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username or anggota nama..."
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
                  Username
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  Anggota
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400"
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Roles
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
                      Loading users...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    colSpan={5}
                  >
                    {searchQuery
                      ? "No matching users found."
                      : 'No users found. Click "Add User" to create one.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {index + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-gray-400" />
                        {user.username}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-700 dark:text-white/80">
                          {user.anggota.nama}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {user.anggota.nim}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <span
                              key={role.id}
                              className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                            >
                              {role.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">
                            —
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
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
              Showing {filteredUsers.length} of {users.length} users
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
            Anggota: {selectedUser?.anggota.nama} · This action cannot be
            undone.
          </p>
          {formError && (
            <div className="mb-4 w-full rounded-lg border border-error-300 bg-error-50 px-3 py-2 text-left text-xs text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {formError}
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
