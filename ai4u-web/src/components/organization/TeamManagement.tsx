import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  UserPlus, 
  Trash2, 
  Edit,
  Crown,
  User,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import { FormInput } from '../shared/FormInput';
import { Modal } from '../shared/Modal';
import { InviteUserModal } from './InviteUserModal';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
  lastActive: string;
  progress: number;
  coursesCompleted: number;
  avatar?: string;
}

interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingInvites: number;
  averageProgress: number;
}

export const TeamManagement: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<TeamStats>({
    totalMembers: 0,
    activeMembers: 0,
    pendingInvites: 0,
    averageProgress: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      // Mock data - replace with actual API calls
      setStats({
        totalMembers: 25,
        activeMembers: 22,
        pendingInvites: 3,
        averageProgress: 68,
      });

      setMembers([
        {
          id: 1,
          name: 'Sarah Wilson',
          email: 'sarah@techcorp.com',
          role: 'admin',
          status: 'active',
          joinedAt: '2024-01-15',
          lastActive: '2 hours ago',
          progress: 85,
          coursesCompleted: 12,
        },
        {
          id: 2,
          name: 'Mike Johnson',
          email: 'mike@techcorp.com',
          role: 'user',
          status: 'active',
          joinedAt: '2024-01-20',
          lastActive: '1 day ago',
          progress: 92,
          coursesCompleted: 15,
        },
        {
          id: 3,
          name: 'Emily Chen',
          email: 'emily@techcorp.com',
          role: 'user',
          status: 'active',
          joinedAt: '2024-02-01',
          lastActive: '3 hours ago',
          progress: 56,
          coursesCompleted: 8,
        },
        {
          id: 4,
          name: 'David Brown',
          email: 'david@techcorp.com',
          role: 'user',
          status: 'pending',
          joinedAt: '2024-02-10',
          lastActive: 'Never',
          progress: 0,
          coursesCompleted: 0,
        },
        {
          id: 5,
          name: 'Lisa Garcia',
          email: 'lisa@techcorp.com',
          role: 'user',
          status: 'active',
          joinedAt: '2024-01-25',
          lastActive: '5 hours ago',
          progress: 73,
          coursesCompleted: 10,
        },
        {
          id: 6,
          name: 'Alex Rodriguez',
          email: 'alex@techcorp.com',
          role: 'user',
          status: 'suspended',
          joinedAt: '2024-01-10',
          lastActive: '2 weeks ago',
          progress: 25,
          coursesCompleted: 3,
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'suspended':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleRoleChange = async (memberId: number, newRole: 'admin' | 'user') => {
    try {
      // API call to update member role
      setMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ));
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const handleStatusChange = async (memberId: number, newStatus: 'active' | 'suspended') => {
    try {
      // API call to update member status
      setMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, status: newStatus } : member
      ));
    } catch (error) {
      console.error('Failed to update member status:', error);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        // API call to remove member
        setMembers(prev => prev.filter(member => member.id !== memberId));
        setStats(prev => ({
          ...prev,
          totalMembers: prev.totalMembers - 1,
        }));
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };

  const handleResendInvite = async (memberId: number) => {
    try {
      // API call to resend invitation
      console.log('Resending invite to member:', memberId);
    } catch (error) {
      console.error('Failed to resend invite:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">Manage your organization's team members and permissions</p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          variant="primary"
          size="md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalMembers}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-xl font-bold text-gray-900">{stats.activeMembers}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Invites</p>
              <p className="text-xl font-bold text-gray-900">{stats.pendingInvites}</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Progress</p>
              <p className="text-xl font-bold text-gray-900">{stats.averageProgress}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <FormInput
              label=""
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members by name or email..."
              icon={Search}
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Members Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'user')}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={member.status === 'pending'}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(member.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${member.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 min-w-0">
                        {member.progress}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {member.coursesCompleted} courses completed
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.lastActive}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {member.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvite(member.id)}
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Resend
                        </Button>
                      )}
                      
                      {member.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(member.id, 'suspended')}
                        >
                          Suspend
                        </Button>
                      )}
                      
                      {member.status === 'suspended' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(member.id, 'active')}
                        >
                          Activate
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredMembers.length === 0 && (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No members found matching your criteria</p>
          </div>
        )}
      </Card>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={(newMember) => {
          setMembers(prev => [...prev, newMember]);
          setStats(prev => ({
            ...prev,
            totalMembers: prev.totalMembers + 1,
            pendingInvites: prev.pendingInvites + 1,
          }));
        }}
      />
    </div>
  );
};