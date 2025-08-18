import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Save, 
  Upload, 
  CreditCard, 
  Settings, 
  Users, 
  Globe,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { FormInput } from '../shared/FormInput';
import { useAuth } from '../auth/AuthProvider';

interface OrganizationData {
  id: number;
  name: string;
  description: string;
  industry: string;
  size: string;
  website: string;
  logo?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billing: {
    plan: string;
    planPrice: number;
    billingCycle: 'monthly' | 'yearly';
    nextBillingDate: string;
    paymentMethod: string;
  };
  settings: {
    allowPublicSignup: boolean;
    requireEmailVerification: boolean;
    enableSso: boolean;
    defaultUserRole: 'user' | 'admin';
  };
}

const industryOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'other', label: 'Other' },
];

const sizeOptions = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-25', label: '11-25 employees' },
  { value: '26-50', label: '26-50 employees' },
  { value: '51-100', label: '51-100 employees' },
  { value: '101-500', label: '101-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

export const OrganizationSettings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'billing' | 'advanced'>('general');
  const [orgData, setOrgData] = useState<OrganizationData>({
    id: 1,
    name: '',
    description: '',
    industry: '',
    size: '',
    website: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    billing: {
      plan: 'Enterprise',
      planPrice: 299,
      billingCycle: 'monthly',
      nextBillingDate: '2024-03-15',
      paymentMethod: '**** **** **** 4242',
    },
    settings: {
      allowPublicSignup: false,
      requireEmailVerification: true,
      enableSso: false,
      defaultUserRole: 'user',
    },
  });
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      // Mock data - replace with actual API call
      setOrgData(prev => ({
        ...prev,
        name: user?.organization?.organizationName || 'Tech Corp',
        description: 'A leading technology company focused on innovation and learning',
        industry: 'technology',
        size: '26-50',
        website: 'https://techcorp.com',
        address: {
          street: '123 Tech Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'United States',
        },
      }));
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
    }
  };

  const handleSave = async (section: 'general' | 'billing' | 'advanced') => {
    setSaveStatus('saving');
    setErrors({});

    try {
      // API call to save organization data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setErrors({ submit: 'Failed to save changes' });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setOrgData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof OrganizationData] as any,
          [child]: value,
        },
      }));
    } else {
      setOrgData(prev => ({ ...prev, [field]: value }));
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Building className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'advanced', label: 'Advanced', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-gray-600">Manage your organization's profile and configuration</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Organization Profile */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Organization Profile</h3>
              <p className="text-sm text-gray-600">Basic information about your organization</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Organization Name"
                  value={orgData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter organization name"
                  required
                />
                <FormInput
                  label="Industry"
                  value={orgData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  placeholder="Select industry"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={orgData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your organization"
                  rows={3}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Company Size</label>
                  <select
                    value={orgData.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select size</option>
                    {sizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <FormInput
                  label="Website"
                  type="url"
                  value={orgData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://your-company.com"
                  icon={Globe}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave('general')}
                  loading={saveStatus === 'saving'}
                  disabled={saveStatus === 'saving'}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Address Information */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
              <p className="text-sm text-gray-600">Your organization's primary address</p>
            </div>
            <div className="p-6 space-y-4">
              <FormInput
                label="Street Address"
                value={orgData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                placeholder="Enter street address"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="City"
                  value={orgData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  placeholder="Enter city"
                />
                <FormInput
                  label="State/Province"
                  value={orgData.address.state}
                  onChange={(e) => handleInputChange('address.state', e.target.value)}
                  placeholder="Enter state"
                />
                <FormInput
                  label="ZIP/Postal Code"
                  value={orgData.address.zipCode}
                  onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                  placeholder="Enter ZIP code"
                />
              </div>

              <FormInput
                label="Country"
                value={orgData.address.country}
                onChange={(e) => handleInputChange('address.country', e.target.value)}
                placeholder="Enter country"
              />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
              <p className="text-sm text-gray-600">Manage your subscription and billing</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <h4 className="font-semibold text-blue-900">{orgData.billing.plan} Plan</h4>
                  <p className="text-sm text-blue-700">Up to 100 users with advanced features</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Next billing: {new Date(orgData.billing.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">
                    ${orgData.billing.planPrice}
                  </div>
                  <div className="text-sm text-blue-700">per month</div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
                <Button variant="outline">
                  Change Plan
                </Button>
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Credit Card ending in {orgData.billing.paymentMethod.slice(-4)}
                    </p>
                    <p className="text-sm text-gray-500">Expires 12/25</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
            </div>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Usage Statistics</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">25</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                  <div className="text-xs text-gray-500">of 100 limit</div>
                </div>
                <div className="text-center">
                  <Building className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">156</div>
                  <div className="text-sm text-gray-600">Courses Completed</div>
                  <div className="text-xs text-gray-500">this month</div>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">78%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                  <div className="text-xs text-gray-500">team average</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'advanced' && (
        <div className="space-y-6">
          {/* Security Settings */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Security & Access</h3>
              <p className="text-sm text-gray-600">Configure security and access settings</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Require Email Verification</h4>
                  <p className="text-sm text-gray-600">New users must verify their email before accessing the platform</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orgData.settings.requireEmailVerification}
                    onChange={(e) => handleInputChange('settings.requireEmailVerification', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Allow Public Signup</h4>
                  <p className="text-sm text-gray-600">Allow users to sign up without an invitation</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={orgData.settings.allowPublicSignup}
                    onChange={(e) => handleInputChange('settings.allowPublicSignup', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Default User Role</label>
                <select
                  value={orgData.settings.defaultUserRole}
                  onChange={(e) => handleInputChange('settings.defaultUserRole', e.target.value)}
                  className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-gray-500">
                  Default role assigned to new members
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave('advanced')}
                  loading={saveStatus === 'saving'}
                  disabled={saveStatus === 'saving'}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card>
            <div className="p-6 border-b border-red-200 bg-red-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
              </div>
              <p className="text-sm text-red-700 mt-1">Irreversible and destructive actions</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h4 className="font-medium text-red-900">Delete Organization</h4>
                  <p className="text-sm text-red-700">
                    Permanently delete this organization and all associated data
                  </p>
                </div>
                <Button variant="danger" size="sm">
                  Delete Organization
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Save Status */}
      {saveStatus === 'saved' && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-800 px-4 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Changes saved successfully!
        </div>
      )}
    </div>
  );
};