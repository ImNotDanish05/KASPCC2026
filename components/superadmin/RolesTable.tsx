"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import EnhancedDataTable, { ColumnDef } from "@/components/common/EnhancedDataTable";
import { getRoles, createRole, updateRole, deleteRole } from "@/lib/actions/role.actions";
import { Pencil, Trash2, AlertCircle, Plus } from "lucide-react";

type RoleRow = {
  id: number;
  name: string;
  users: { user: { id: number; username: string } }[];
};

export default function RolesTable() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleRow | null>(null);

  // ----- Fetch -----

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await getRoles();
    if (result.success) {
      setRoles(result.data as RoleRow[]);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ----- Create -----

  function openCreateModal() {
    setFormName("");
    setFormError("");
    setShowCreateModal(true);
  }

  async function handleCreate() {
    setFormError("");
    if (!formName.trim()) {
      setFormError("Role name is required");
      return;
    }
    setSubmitting(true);
    const result = await createRole(formName);
    setSubmitting(false);
    if (result.success) {
      setShowCreateModal(false);
      fetchData();
    } else {
      setFormError(result.error);
    }
  }

  // ----- UPDATE -----

  function openEditModal(role: RoleRow) {
    setSelectedRole(role);
    setFormName(role.name);
    setFormError("");
    setShowEditModal(true);
  }

  async function handleUpdate() {
    if (!selectedRole) return;
    setFormError("");
    if (!formName.trim()) {
      setFormError("Role name is required");
      return;
    }
    setSubmitting(true);
    const result = await updateRole(selectedRole.id, formName);
    setSubmitting(false);
    if (result.success) {
      setShowEditModal(false);
      fetchData();
    } else {
      setFormError(result.error);
    }
  }

  // ----- DELETE -----

  function openDeleteModal(role: RoleRow) {
    setSelectedRole(role);
    setFormError("");
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!selectedRole) return;
    setFormError("");
    setSubmitting(true);
    const result = await deleteRole(selectedRole.id);
    setSubmitting(false);
    if (result.success) {
      setShowDeleteModal(false);
      fetchData();
    } else {
      setFormError(result.error);
    }
  }

  // ----- RENDER -----

  // Define columns for EnhancedDataTable
  const roleColumns: ColumnDef[] = [
    { key: "name", label: "Role Name", sortable: true },
    {
      key: "users",
      label: "Assigned Users",
      sortable: false,
      render: (value: any, role: RoleRow) =>
        role.users.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {role.users.map((u) => (
              <span
                key={u.user.id}
                className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
              >
                {u.user.username}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">—</span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (value: any, role: RoleRow) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEditModal(role)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => openDeleteModal(role)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 transition-colors hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Enhanced Data Table */}
      <EnhancedDataTable
        columns={roleColumns}
        data={roles}
        title="Manajemen Roles"
        description="Kelola role, kredensial, dan role assignments"
        loading={loading}
        onCreateClick={openCreateModal}
        searchPlaceholder="Cari berdasarkan role name..."
      />

      {/* ── CREATE MODAL ── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        className="max-w-md p-6 lg:p-8"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
          Add New Role
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="create-role-name">Role Name</Label>
            <Input
              id="create-role-name"
              type="text"
              placeholder="e.g. Bendahara Internal"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              error={!!formError}
              hint={formError || undefined}
            />
          </div>
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
              {submitting ? "Saving..." : "Save Role"}
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
          Edit Role
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-role-name">Role Name</Label>
            <Input
              id="edit-role-name"
              type="text"
              placeholder="e.g. Bendahara Internal"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              error={!!formError}
              hint={formError || undefined}
            />
          </div>
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
              {submitting ? "Updating..." : "Update Role"}
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
            Delete Role
          </h3>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete{" "}
            <span className="font-medium text-gray-700 dark:text-white/80">
              &quot;{selectedRole?.name}&quot;
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
