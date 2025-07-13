import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { SkeletonDashboard } from './SkeletonLoader';
import DarkModeToggle from './DarkModeToggle';
import { Link } from 'react-router-dom';
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  CalendarIcon,
  ShieldCheckIcon,
  BellIcon,
  CogIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    lastLogin: string;
    memberSince: string;
  };
  stats: {
    accountAge: number;
  };
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await authAPI.getDashboard();
        setDashboardData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <SkeletonDashboard />;
  }

  const metrics = [
    {
      title: 'Account Age',
      value: `${dashboardData?.stats.accountAge || 0} days`,
      icon: CalendarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+2 days',
      changeType: 'positive'
    },
    {
      title: 'Account Status',
      value: 'Active',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: 'Verified',
      changeType: 'positive'
    },
    {
      title: 'Role',
      value: user?.role || 'User',
      icon: ShieldCheckIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: 'Standard',
      changeType: 'neutral'
    },
    {
      title: 'Total Sessions',
      value: '12',
      icon: ArrowTrendingUpIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '+3 this week',
      changeType: 'positive'
    }
  ];

  const quickActions = [
    {
      title: 'AI Sales Call',
      description: 'Make AI-powered calls to qualify leads',
      icon: PhoneIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/calls'
    },
    {
      title: 'Start New Campaign',
      description: 'Create and launch your next outbound campaign',
      icon: SparklesIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/campaigns/new'
    },
    {
      title: 'View Analytics',
      description: 'Check your campaign performance and metrics',
      icon: ChartBarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/analytics'
    },
    {
      title: 'Manage Contacts',
      description: 'Add and organize your prospect lists',
      icon: UsersIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/contacts'
    },
    {
      title: 'Account Settings',
      description: 'Update your profile and preferences',
      icon: CogIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      href: '/settings'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="dashboard-header sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-xl shadow-sm mr-3">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <BellIcon className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                  <UserCircleIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="card mb-8 animate-fade-in">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name}! 👋
                </h2>
                <p className="text-gray-600">
                  Here's what's happening with your Outbound AI account today.
                </p>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Last login: {user?.lastLogin 
                    ? new Date(user.lastLogin).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Never'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <div key={metric.title} className="metric-card animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between mb-4">
                <div className={`metric-icon ${metric.bgColor}`}>
                  <metric.icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  metric.changeType === 'positive' ? 'bg-green-100 text-green-700' :
                  metric.changeType === 'negative' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {metric.change}
                </span>
              </div>
              <div>
                <p className="metric-value">{metric.value}</p>
                <p className="metric-label">{metric.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link key={action.title} to={action.href} className="card hover:shadow-lg transition-all duration-200 cursor-pointer animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="card-body">
                  <div className={`w-12 h-12 ${action.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{action.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <div className="flex items-center text-sm font-medium text-primary-600">
                    Get started
                    <ArrowRightOnRectangleIcon className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Account Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              <p className="text-sm text-gray-600">Your account details and settings</p>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Full Name</span>
                  <span className="text-sm text-gray-900">{user?.name}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Email Address</span>
                  <span className="text-sm text-gray-900">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Account Role</span>
                  <span className="badge badge-primary">{user?.role}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-500">Member Since</span>
                  <span className="text-sm text-gray-900">
                    {user?.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Unknown'
                    }
                  </span>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-secondary btn-sm">
                <CogIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-600">Your latest actions and updates</p>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Account created successfully</p>
                    <p className="text-xs text-gray-500">Welcome to Outbound AI!</p>
                  </div>
                  <span className="text-xs text-gray-400">Just now</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Profile setup completed</p>
                    <p className="text-xs text-gray-500">Your profile is now ready</p>
                  </div>
                  <span className="text-xs text-gray-400">2 min ago</span>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <SparklesIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Dashboard accessed</p>
                    <p className="text-xs text-gray-500">First time login detected</p>
                  </div>
                  <span className="text-xs text-gray-400">5 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to get started?</h3>
                <p className="text-gray-600 mb-4">
                  Set up your first campaign and start reaching out to prospects with AI-powered personalization.
                </p>
                <div className="flex space-x-3">
                  <button className="btn btn-primary">
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    Create Campaign
                  </button>
                  <button className="btn btn-secondary">
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    View Tutorial
                  </button>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center">
                  <SparklesIcon className="h-16 w-16 text-primary-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 