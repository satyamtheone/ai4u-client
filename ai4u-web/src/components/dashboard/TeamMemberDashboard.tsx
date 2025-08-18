import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  Trophy, 
  Clock, 
  TrendingUp,
  Play,
  Star,
  Calendar,
  MessageSquare,
  Target,
  Award,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';

interface TeamStats {
  myProgress: number;
  teamAverage: number;
  myRank: number;
  totalMembers: number;
  completedThisWeek: number;
  teamGoal: number;
}

interface TeamMember {
  id: number;
  name: string;
  progress: number;
  streak: number;
  avatar?: string;
}

interface TeamCourse {
  id: number;
  title: string;
  description: string;
  assignedBy: string;
  dueDate: string;
  progress: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface TeamAnnouncement {
  id: number;
  title: string;
  message: string;
  author: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning';
}

export const TeamMemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [teamStats, setTeamStats] = useState<TeamStats>({
    myProgress: 0,
    teamAverage: 0,
    myRank: 0,
    totalMembers: 0,
    completedThisWeek: 0,
    teamGoal: 0,
  });
  const [topPerformers, setTopPerformers] = useState<TeamMember[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<TeamCourse[]>([]);
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data - replace with actual API calls
      setTeamStats({
        myProgress: 78,
        teamAverage: 65,
        myRank: 3,
        totalMembers: 25,
        completedThisWeek: 2,
        teamGoal: 5,
      });

      setTopPerformers([
        { id: 1, name: 'Sarah Wilson', progress: 92, streak: 12 },
        { id: 2, name: 'Mike Johnson', progress: 87, streak: 8 },
        { id: 3, name: user?.name || 'You', progress: 78, streak: 5 },
        { id: 4, name: 'Emily Chen', progress: 72, streak: 3 },
        { id: 5, name: 'David Brown', progress: 68, streak: 7 },
      ]);

      setAssignedCourses([
        {
          id: 1,
          title: 'Security Best Practices',
          description: 'Learn essential security practices for web applications',
          assignedBy: 'Tech Lead',
          dueDate: '2024-02-15',
          progress: 45,
          priority: 'high',
          category: 'Security',
        },
        {
          id: 2,
          title: 'Team Collaboration Tools',
          description: 'Master our development workflow and tools',
          assignedBy: 'Project Manager',
          dueDate: '2024-02-20',
          progress: 20,
          priority: 'medium',
          category: 'Tools',
        },
        {
          id: 3,
          title: 'Advanced Testing Strategies',
          description: 'Improve code quality with advanced testing techniques',
          assignedBy: 'QA Lead',
          dueDate: '2024-02-28',
          progress: 0,
          priority: 'low',
          category: 'Testing',
        },
      ]);

      setAnnouncements([
        {
          id: 1,
          title: 'New Learning Path Available',
          message: 'Check out the new "Full Stack Development" learning path designed specifically for our team.',
          author: 'Learning & Development',
          timestamp: '2 hours ago',
          type: 'info',
        },
        {
          id: 2,
          title: 'Great Job This Week!',
          message: 'Our team exceeded the weekly learning goal. Keep up the excellent work!',
          author: 'Team Lead',
          timestamp: '1 day ago',
          type: 'success',
        },
        {
          id: 3,
          title: 'Upcoming Deadline',
          message: 'Remember: Security training must be completed by February 15th.',
          author: 'HR Department',
          timestamp: '2 days ago',
          type: 'warning',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name}! 🚀
          </h1>
          <p className="text-gray-600">
            You're part of <span className="font-medium">{user?.organization?.organizationName}</span> team
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Team Chat
          </Button>
          <Button variant="primary" size="sm">
            <BookOpen className="w-4 h-4 mr-2" />
            Continue Learning
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card padding="lg" className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Progress</p>
              <p className="text-3xl font-bold text-gray-900">{teamStats.myProgress}%</p>
              <p className="text-sm text-gray-500 mt-1">
                vs {teamStats.teamAverage}% team avg
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card padding="lg" className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Ranking</p>
              <p className="text-3xl font-bold text-gray-900">
                #{teamStats.myRank}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                of {teamStats.totalMembers} members
              </p>
            </div>
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card padding="lg" className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Goal</p>
              <p className="text-3xl font-bold text-gray-900">
                {teamStats.completedThisWeek}/{teamStats.teamGoal}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(teamStats.completedThisWeek / teamStats.teamGoal) * 100}%` }}
                ></div>
              </div>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Courses */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Assigned Courses</h3>
            </div>
            <div className="p-6 space-y-4">
              {assignedCourses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{course.title}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded border ${getPriorityColor(course.priority)}`}>
                          {course.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span>Assigned by: {course.assignedBy}</span>
                        <span>Due: {formatDate(course.dueDate)}</span>
                        <span>Category: {course.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 min-w-0">
                        {course.progress}%
                      </span>
                    </div>
                    <Button size="sm" variant="primary" className="ml-4">
                      <Play className="w-3 h-3 mr-1" />
                      {course.progress > 0 ? 'Continue' : 'Start'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Team Leaderboard & Announcements */}
        <div className="space-y-6">
          {/* Team Leaderboard */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Team Leaderboard</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {topPerformers.map((member, index) => (
                  <div 
                    key={member.id} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      member.name === user?.name ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-300 text-orange-900' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.name}
                          {member.name === user?.name && (
                            <span className="ml-1 text-blue-600">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.streak} day streak
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{member.progress}%</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button variant="ghost" size="sm" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  View Full Leaderboard
                </Button>
              </div>
            </div>
          </Card>

          {/* Team Announcements */}
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Team Updates</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div 
                    key={announcement.id} 
                    className={`border-l-4 p-3 rounded-r-lg ${getAnnouncementColor(announcement.type)}`}
                  >
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {announcement.title}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      {announcement.message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{announcement.author}</span>
                      <span>{announcement.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Button variant="ghost" size="sm" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View All Updates
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="p-4 text-center">
            <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">My Courses</h4>
            <p className="text-xs text-gray-600">View all assigned content</p>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="p-4 text-center">
            <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">Team Progress</h4>
            <p className="text-xs text-gray-600">See team achievements</p>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="p-4 text-center">
            <Calendar className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">Schedule</h4>
            <p className="text-xs text-gray-600">Manage learning time</p>
          </div>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <div className="p-4 text-center">
            <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-gray-900 mb-1">Achievements</h4>
            <p className="text-xs text-gray-600">View badges earned</p>
          </div>
        </Card>
      </div>
    </div>
  );
};