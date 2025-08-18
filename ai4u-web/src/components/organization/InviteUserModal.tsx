import React, { useState } from 'react';
import { Mail, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { FormInput } from '../shared/FormInput';
import { validateEmail } from '../../utils/validation/authValidation';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (member: any) => void;
}

interface InviteForm {
  email: string;
  role: 'admin' | 'user';
  message: string;
}

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<InviteForm>({
    email: '',
    role: 'user',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<InviteForm & { submit: string }>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = () => {
    setFormData({
      email: '',
      role: 'user',
      message: '',
    });
    setErrors({});
    setSuccess(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<InviteForm> = {};

    // Email validation
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // API call to send invitation
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay

      // Mock successful response
      const newMember = {
        id: Date.now(),
        name: 'Pending User',
        email: formData.email,
        role: formData.role,
        status: 'pending' as const,
        joinedAt: new Date().toISOString(),
        lastActive: 'Never',
        progress: 0,
        coursesCompleted: 0,
      };

      setSuccess(true);
      
      // Track invitation event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'team_member_invited', {
            invited_role: formData.role,
            organization_action: 'invite_sent',
        });
        }

      // Call success callback after a brief delay to show success state
      setTimeout(() => {
        onSuccess(newMember);
        handleClose();
      }, 1500);

    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to send invitation',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof InviteForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Success state content
  if (success) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Invitation Sent!"
        size="md"
      >
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Invitation Successfully Sent!
          </h3>
          <p className="text-gray-600 mb-4">
            An invitation has been sent to <strong>{formData.email}</strong>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• The user will receive an email invitation</li>
              <li>• They can accept and create their account</li>
              <li>• Once accepted, they'll appear in your team list</li>
              <li>• You can track their progress and assign courses</li>
            </ul>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Team Member"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center pb-4 border-b border-gray-200">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-gray-600">
            Invite a new member to join your organization and start learning
          </p>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <FormInput
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            placeholder="Enter email address"
            error={errors.email}
            icon={Mail}
            required
            hint="The invitation will be sent to this email address"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={handleInputChange('role')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-gray-500">
              {formData.role === 'admin' 
                ? 'Admins can manage team members, settings, and have full access to all features'
                : 'Users can access learning content and view their progress'
              }
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Personal Message (Optional)
            </label>
            <textarea
              value={formData.message}
              onChange={handleInputChange('message')}
              placeholder="Add a personal message to the invitation..."
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
            />
            <p className="text-xs text-gray-500">
              This message will be included in the invitation email
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Invitation Preview</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>To:</strong> {formData.email || 'email@example.com'}</p>
            <p><strong>Role:</strong> {formData.role === 'admin' ? 'Administrator' : 'Team Member'}</p>
            {formData.message && (
              <div>
                <p><strong>Message:</strong></p>
                <p className="italic bg-white p-2 rounded border mt-1">"{formData.message}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{errors.submit}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || !formData.email}
          >
            {loading ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};