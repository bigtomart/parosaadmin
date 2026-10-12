import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Plus,
  Copy,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  MapPin,
  Lock,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Role, ScopeType, PermissionDefinition, PermissionCategory } from '../../types/rbac';
import { PERMISSION_CATEGORIES } from '../../types/permissions';

export const RolesPermissionsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { showSuccess, showError, showForbidden } = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form State
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [scopeType, setScopeType] = useState<ScopeType>('GLOBAL');
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const canCreate = hasPermission('roles.create');
  const canUpdate = hasPermission('roles.update');
  const canDelete = hasPermission('roles.delete');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData, citiesData] = await Promise.all([
        api.getRoles(),
        api.getPermissions(),
        api.getCities(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
      setCities(citiesData);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        showForbidden(err.requiredPermission || 'roles.view', user?.roleId || 'Admin');
      } else {
        showError('Failed to load roles', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setScopeType('GLOBAL');
    setSelectedCities([]);
    setSelectedPermissions(['dashboard.view']);
    setModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description);
    setScopeType(role.scopeType);
    setSelectedCities(role.allowedCities || []);
    setSelectedPermissions(role.permissions || []);
    setModalOpen(true);
  };

  const handleDuplicate = (role: Role) => {
    setEditingRole(null);
    setRoleName(`${role.name} (Copy)`);
    setRoleDescription(`Duplicated template from ${role.name}`);
    setScopeType(role.scopeType);
    setSelectedCities(role.allowedCities ? [...role.allowedCities] : []);
    setSelectedPermissions([...role.permissions]);
    setModalOpen(true);
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleToggleCategory = (category: string) => {
    const categoryPerms = permissions.filter((p) => p.category === category).map((p) => p.id);
    const allSelected = categoryPerms.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !categoryPerms.includes(p)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...categoryPerms])));
    }
  };

  const handleToggleRoleActive = async (r: Role) => {
    if (r.id === 'SUPER_ADMIN') {
      showError('Action Denied', 'Super Admin role cannot be deactivated.');
      return;
    }
    try {
      const updated = !r.isActive;
      await api.updateRole(r.id, { isActive: updated });
      showSuccess(`Role ${updated ? 'Activated' : 'Deactivated'}`, `${r.name} is now ${updated ? 'Active' : 'Inactive'}.`);
      fetchData();
    } catch (err: any) {
      showError('Status Update Failed', err.message);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      showError('Validation Error', 'Role name cannot be empty');
      return;
    }

    try {
      if (editingRole) {
        await api.updateRole(editingRole.id, {
          name: roleName,
          description: roleDescription,
          scopeType,
          allowedCities: scopeType === 'CITY' ? selectedCities : [],
          permissions: selectedPermissions,
        });
        showSuccess('Role Updated', `Role '${roleName}' has been successfully modified.`);
      } else {
        await api.createRole({
          name: roleName,
          description: roleDescription,
          scopeType,
          allowedCities: scopeType === 'CITY' ? selectedCities : [],
          permissions: selectedPermissions,
        });
        showSuccess('Role Created', `New custom role '${roleName}' created with ${selectedPermissions.length} permissions.`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 403) {
        showForbidden(err.requiredPermission || 'roles.update', user?.roleId || 'Admin');
      } else {
        showError('Role Operation Failed', err.message);
      }
    }
  };

  const handleDeleteRole = async (roleId: string, roleTitle: string) => {
    if (!confirm(`Are you sure you want to permanently delete role '${roleTitle}'? This action will be audited.`)) return;

    try {
      await api.deleteRole(roleId);
      showSuccess('Role Deleted', `Role '${roleTitle}' has been removed.`);
      fetchData();
    } catch (err: any) {
      showError('Delete Failed', err.message);
    }
  };

  const categories = ['All', ...PERMISSION_CATEGORIES];

  const filteredPermissions = permissions.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch =
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">PAROSA Role & Permission Matrix</h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              RBAC Central
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized permissions grouped across 15 operational domains, dynamic role generation, and territory boundaries.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Custom Role
          </button>
        )}
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((r) => {
          const isSuper = r.id === 'SUPER_ADMIN';

          return (
            <div
              key={r.id}
              className={`bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-all hover:border-slate-300 ${
                isSuper ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {r.name}
                      {r.isSystem && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          System
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{r.description}</p>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border shrink-0 ${
                      r.scopeType === 'CITY'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {r.scopeType} {r.allowedCities && r.allowedCities.length > 0 && `(${r.allowedCities.join(', ')})`}
                  </span>
                </div>

                {/* Permissions summary */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                    <span>Authorized Rules:</span>
                    <span className="text-slate-900 font-bold">{r.permissions.length} grants</span>
                  </div>

                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {r.permissions.slice(0, 6).map((perm, pIdx) => (
                      <span
                        key={pIdx}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200"
                      >
                        {perm}
                      </span>
                    ))}
                    {r.permissions.length > 6 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        +{r.permissions.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDuplicate(r)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Duplicate Role Template"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>

                  {!isSuper && canUpdate && (
                    <button
                      onClick={() => handleToggleRoleActive(r)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                        r.isActive
                          ? 'text-emerald-700 hover:bg-emerald-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                      title={r.isActive ? 'Deactivate Role' : 'Activate Role'}
                    >
                      {r.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {canUpdate && (
                    <button
                      onClick={() => openEditModal(r)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  {!r.isSystem && canDelete && (
                    <button
                      onClick={() => handleDeleteRole(r.id, r.name)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="Delete Custom Role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Creation / Editing Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-100 text-rose-600 border border-rose-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingRole ? `Modify Role: ${editingRole.name}` : 'Create Dynamic Custom Role'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign exact permission groups, scope boundaries, and active status.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="e.g. Alwar Territory Operations Lead"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500 shadow-2xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Access Scope Type *
                    </label>
                    <select
                      value={scopeType}
                      onChange={(e) => setScopeType(e.target.value as ScopeType)}
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500 shadow-2xs"
                    >
                      <option value="GLOBAL">GLOBAL (Unrestricted across all territories)</option>
                      <option value="CITY">CITY (Bound to assigned city, e.g. Alwar)</option>
                      <option value="RESTAURANT">RESTAURANT (Assigned restaurant only)</option>
                      <option value="SELF">SELF (Own administrative actions only)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Role Description
                  </label>
                  <input
                    type="text"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    placeholder="Brief description of responsibilities..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500 shadow-2xs"
                  />
                </div>

                {/* City Scope Selection */}
                {scopeType === 'CITY' && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      Select Permitted Territory Cities
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Users with this role will be quarantined strictly to these cities. Access to other cities is denied by the backend.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {cities.map((c) => {
                        const isChecked = selectedCities.includes(c.id);
                        return (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => {
                              setSelectedCities((prev) =>
                                prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                              );
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                              isChecked
                                ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {isChecked && <Check className="w-3.5 h-3.5" />}
                            {c.name} ({c.id})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Permissions Matrix */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>Permission Matrix Grants</span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          {selectedPermissions.length} selected
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Check explicit resource.action privileges authorized for this role
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search permissions..."
                        className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-rose-500 w-44"
                      />
                    </div>
                  </div>

                  {/* Category Pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                    {categories.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-rose-600 text-white font-bold shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Category Toggle All */}
                  {selectedCategory !== 'All' && (
                    <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <span className="text-slate-700 font-semibold">Bulk Select: {selectedCategory} Group</span>
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(selectedCategory)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                      >
                        Toggle All in {selectedCategory}
                      </button>
                    </div>
                  )}

                  {/* Checklist items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1">
                    {filteredPermissions.map((perm) => {
                      const isGranted = selectedPermissions.includes(perm.id);

                      return (
                        <div
                          key={perm.id}
                          onClick={() => handleTogglePermission(perm.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 shadow-2xs ${
                            isGranted
                              ? 'bg-rose-50/40 border-rose-300 text-slate-900'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isGranted
                                ? 'bg-rose-600 border-rose-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isGranted && <Check className="w-3 h-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-xs font-bold text-rose-700 truncate">
                                {perm.id}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-slate-100">
                                {perm.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-tight">
                              {perm.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-500 font-mono">
                  {selectedPermissions.length} permissions configured
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    {editingRole ? 'Save Changes' : 'Confirm & Create Role'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
