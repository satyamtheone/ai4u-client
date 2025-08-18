import React, { useState, useEffect } from 'react';
import { Shield, Users, Settings, Eye, Edit, Trash2, Plus, Save, AlertCircle } from 'lucide-react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'user_management' | 'content' | 'organization' | 'analytics';
}

interface Role {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;
  userCount: number;
  permissions: string[];
}

const allPermissions: Permission[] = [
  // User Management
  { id: 'view_users', name: 'View Users', description: 'View team member list and profiles', category: 'user_management' },
  { id: 'invite_users', name: 'Invite Users', description: 'Send invitations to new team members', category: 'user_management' },
  { id: 'manage_users', name: 'Manage Users', description: 'Edit user roles, suspend, or remove users', category: 'user_management' },
  { id: 'assign_roles', name: 'Assign Roles', description: 'Change user roles and permissions', category: 'user_management' },
  
  // Content Management
  { id: 'view_content', name: 'View Content', description: 'Access learning materials and courses', category: 'content' },
  { id: 'create_content', name: 'Create Content', description: 'Create new courses and learning materials', category: 'content' },
  { id: 'edit_content', name: 'Edit Content', description: 'Modify existing courses and materials', category: 'content' },
  { id: 'delete_content', name: 'Delete Content', description: 'Remove courses and learning materials', category: 'content' },
  { id: 'assign_content', name: 'Assign Content', description: 'Assign courses to team members', category: 'content' },
  
  // Organization
  { id: 'view_org_settings', name: 'View Organization', description: 'View organization profile and settings', category: 'organization' },
  { id: 'edit_org_settings', name: 'Edit Organization', description: 'Modify organization settings and profile', category: 'organization' },
  { id: 'manage_billing', name: 'Manage Billing', description: 'Access billing information and payments', category: 'organization' },
  { id: 'manage_integrations', name: 'Manage Integrations', description: 'Configure third-party integrations', category: 'organization' },
  
  // Analytics
  { id: 'view_analytics', name: 'View Analytics', description: 'Access learning progress and team analytics', category: 'analytics' },
  { id: 'export_data', name: 'Export Data', description: 'Export reports and user data', category: 'analytics' },
  { id: 'view_detailed_reports', name: 'Detailed Reports', description: 'Access detailed analytics and insights', category: 'analytics' },
];

const defaultRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full access to all features and settings',
    isCustom: false,
    userCount: 3,
    permissions: allPermissions.map(p => p.id),
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Can manage team and content but not organization settings',
    isCustom: false,
    userCount: 5,
    permissions: [
      'view_users', 'invite_users', 'manage_users', 'assign_roles',
      'view_content', 'create_content', 'edit_content', 'assign_content',
      'view_org_settings', 'view_analytics', 'view_detailed_reports'
    ],
  },
  {
    id: 'user',
    name: 'User',
    description: 'Basic access to learning content',
    isCustom: false,
    userCount: 17,
    permissions: ['view_content', 'view_analytics'],
  },
];

export const PermissionMatrix: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const categoryLabels = {
    user_management: 'User Management',
    content: 'Content Management',
    organization: 'Organization',
    analytics: 'Analytics & Reports',
  };

  const categoryIcons = {
    user_management: <Users className="w-4 h-4" />,
    content: <Edit className="w-4 h-4" />,
    organization: <Settings className="w-4 h-4" />,
    analytics: <Eye className="w-4 h-4" />,
  };

  const permissionsByCategory = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handlePermissionToggle = (roleId: string, permissionId: string) => {
    setRoles(prev => prev.map(role => {
      if (role.id === roleId) {
        const hasPermission = role.permissions.includes(permissionId);
        return {
          ...role,
          permissions: hasPermission
            ? role.permissions.filter(p => p !== permissionId)
            : [...role.permissions, permissionId]
        };
      }
      return role;
    }));
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;

    const newRole: Role = {
      id: `custom_${Date.now()}`,
      name: newRoleName,
      description: newRoleDescription,
      isCustom: true,
      userCount: 0,
      permissions: [],
    };

    setRoles(prev => [...prev, newRole]);
    setNewRoleName('');
    setNewRoleDescription('');
    setShowCreateRole(false);
  };

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role? Users with this role will be assigned the default User role.')) {
      setRoles(prev => prev.filter(role => role.id !== roleId));
    }
  };

  const handleSaveChanges = async () => {
    setSaveStatus('saving');
    try {
      // API call to save role permissions
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions & Roles</h1>
          <p className="text-gray-600">Manage user roles and their permissions</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowCreateRole(true)}
            variant="outline"
            size="md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
          <Button
            onClick={handleSaveChanges}
            variant="primary"
            size="md"
            loading={saveStatus === 'saving'}
            disabled={saveStatus === 'saving'}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Create Role Form */}
      {showCreateRole && (
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Create New Role</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Enter role name"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Brief description of this role"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                onClick={() => setShowCreateRole(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                variant="primary"
                disabled={!newRoleName.trim()}
              >
                Create Role
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Roles Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => (
          <Card
            key={role.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{role.name}</h3>
                <div className="flex items-center gap-2">
                  {role.isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(role.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{role.description}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{role.userCount} users</span>
                <span className="text-blue-600">{role.permissions.length} permissions</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      {selectedRole && (
        <Card>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Permissions for {selectedRole.name}
                </h3>
                <p className="text-sm text-gray-600">{selectedRole.description}</p>
              </div>
              <div className="text-sm text-gray-500">
                {selectedRole.permissions.length} of {allPermissions.length} permissions
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {Object.entries(permissionsByCategory).map(([category, permissions]) => (
              <div key={category} className="mb-8 last:mb-0">
                <div className="flex items-center gap-2 mb-4">
                  {categoryIcons[category as keyof typeof categoryIcons]}
                  <h4 className="font-medium text-gray-900">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions.map((permission) => {
                    const hasPermission = selectedRole.permissions.includes(permission.id);
                    return (
                      <div
                        key={permission.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          hasPermission
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handlePermissionToggle(selectedRole.id, permission.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-gray-900">{permission.name}</h5>
                              {hasPermission && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{permission.description}</p>
                          </div>
                          <div className="ml-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasPermission}
                                onChange={() => {}} // Handled by parent onClick
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Warning Message */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Important Note</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Changes to permissions will take effect immediately for all users with the modified role. 
              Users may need to refresh their browser to see the changes.
            </p>
          </div>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus === 'saved' && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Permissions saved successfully!
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-200 text-red-800 px-4 py-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Failed to save permissions. Please try again.
        </div>
      )}
    </div>
  );
};