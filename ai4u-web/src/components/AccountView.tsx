import React from 'react';
import { Trophy, Zap, Target, Award } from 'lucide-react';

interface AccountViewProps {
  setCurrentView: (view: string) => void;
}

const AccountView: React.FC<AccountViewProps> = ({ setCurrentView }) => {
  // Mock user data (replace with actual user data from your auth system)
  const user = {
    name: 'Anil Kumar Gupta',
    email: 'guptaka691@gmail.com',
    username: 'guptaka69176872',
    avatar: '/api/placeholder/64/64',
    joinDate: 'January 2024'
  };

  // Mock stats (replace with actual stats from Redux)
  const stats = {
    level: 1,
    totalQuestions: 0,
    accuracy: 0,
    bestStreak: 0,
    totalSessions: 5,
    hoursLearned: 12.5
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setCurrentView('home')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-semibold text-white">Account</h1>
        </div>

        <div className="space-y-8">
          {/* Profile Section */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <img src={user.avatar} alt="Avatar" className="w-16 h-16 rounded-full" />
                <div>
                  <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                  <p className="text-gray-400">{user.username}</p>
                  <p className="text-gray-500 text-sm">Joined {user.joinDate}</p>
                </div>
              </div>
              <button className="text-blue-400 hover:text-blue-300 transition-colors">
                Change avatar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-2">Full Name</label>
                <div className="flex items-center justify-between">
                  <span className="text-white">{user.name}</span>
                  <button className="text-blue-400 hover:text-blue-300 transition-colors">
                    Change
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Username</label>
                <div className="flex items-center justify-between">
                  <span className="text-white">{user.username}</span>
                  <button className="text-blue-400 hover:text-blue-300 transition-colors">
                    Change
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-300 mb-2">Email</label>
                <span className="text-white">{user.email}</span>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Subscription</h2>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-600/30 rounded-xl">
              <div>
                <h3 className="text-white font-medium">Thanks for using AI4U!</h3>
                <p className="text-blue-400 text-sm">Explore learning features and upgrade for more benefits.</p>
              </div>
              <div className="flex gap-3">
                <button className="text-gray-400 hover:text-white transition-colors">
                  Manage plan
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>

          {/* Learning Statistics */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-6">Learning Statistics</h2>
            
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 p-4 rounded-xl text-center">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.level}</div>
                <div className="text-gray-400 text-sm">Current Level</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-xl text-center">
                <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalQuestions}</div>
                <div className="text-gray-400 text-sm">Questions Answered</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-xl text-center">
                <Zap className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.accuracy}%</div>
                <div className="text-gray-400 text-sm">Accuracy Rate</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-xl text-center">
                <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.bestStreak}</div>
                <div className="text-gray-400 text-sm">Best Streak</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Total Sessions</span>
                  <span className="text-white font-semibold">{stats.totalSessions}</span>
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Hours Learned</span>
                  <span className="text-white font-semibold">{stats.hoursLearned}h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Achievements */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Achievement badges - you can add more based on user progress */}
              <div className="bg-gray-700 p-4 rounded-xl text-center opacity-50">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-white font-medium">First Quiz</div>
                <div className="text-gray-400 text-sm">Complete your first quiz</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-xl text-center opacity-50">
                <div className="text-3xl mb-2">🔥</div>
                <div className="text-white font-medium">5 Day Streak</div>
                <div className="text-gray-400 text-sm">Learn for 5 days in a row</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-xl text-center opacity-50">
                <div className="text-3xl mb-2">💯</div>
                <div className="text-white font-medium">Perfect Score</div>
                <div className="text-gray-400 text-sm">Get 100% on a quiz</div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-gray-800 rounded-2xl p-6 border border-red-600/30">
            <h2 className="text-xl font-semibold text-white mb-4">Account Management</h2>
            <div className="space-y-4">
              <button className="w-full text-left px-4 py-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg text-yellow-400 hover:bg-yellow-600/30 transition-colors">
                Reset Learning Progress
              </button>
              <button className="w-full text-left px-4 py-3 bg-red-600/20 border border-red-600/30 rounded-lg text-red-400 hover:bg-red-600/30 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountView;