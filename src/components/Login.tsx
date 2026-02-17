import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Key, ArrowLeft } from 'lucide-react';
import AdminPanel from './AdminPanel';
import { supabase } from '@/integrations/supabase/client';

interface LoginProps {
  onLogin: (userType: 'owner' | 'staff', businessId: 'santhosh1' | 'santhosh2' | 'vasan' | 'demo1_business' | 'demo2_business' | 'demo3_business' | 'demo4_business' | 'demo5_business' | 'demo6_business' | 'demo7_business' | 'demo8_business' | 'demo9_business' | 'demo10_business') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [verificationUsername, setVerificationUsername] = useState('');
  const [verificationPassword, setVerificationPassword] = useState('');
  const [showVerificationPassword, setShowVerificationPassword] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'verify' | 'change'>('verify');
  const [successMessage, setSuccessMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);

  // User credentials storage (in real app, this would be in a secure database)
  const [userCredentials, setUserCredentials] = useState({
    'mathan': { password: '050467', userType: 'owner' as const, businessId: 'santhosh1' as const },
    'Vasan': { password: '1234@', userType: 'owner' as const, businessId: 'vasan' as const },
    // Legacy credentials for backward compatibility
    'Shop1': { password: 'abc@', userType: 'staff' as const, businessId: 'santhosh1' as const },
    'Santhosh': { password: '050467', userType: 'owner' as const, businessId: 'santhosh2' as const },
    'abc': { password: 'abc@', userType: 'staff' as const, businessId: 'santhosh2' as const },
    'Arasu': { password: '1234@', userType: 'owner' as const, businessId: 'santhosh1' as const },
    'Tamilnadu': { password: '1234@', userType: 'owner' as const, businessId: 'santhosh1' as const },
    'Bismi': { password: '1234@', userType: 'owner' as const, businessId: 'santhosh1' as const },
    'Staff': { password: '1234@', userType: 'staff' as const, businessId: 'santhosh1' as const },
    // Demo credentials for testing - each with unique business environment
    'demo1': { password: '1234@', userType: 'owner' as const, businessId: 'demo1_business' as const },
    'demo2': { password: '1234@', userType: 'owner' as const, businessId: 'demo2_business' as const },
    'demo3': { password: '1234@', userType: 'owner' as const, businessId: 'demo3_business' as const },
    'demo4': { password: '1234@', userType: 'owner' as const, businessId: 'demo4_business' as const },
    'demo5': { password: '1234@', userType: 'owner' as const, businessId: 'demo5_business' as const },
    'demo6': { password: '1234@', userType: 'owner' as const, businessId: 'demo6_business' as const },
    'demo7': { password: '1234@', userType: 'owner' as const, businessId: 'demo7_business' as const },
    'demo8': { password: '1234@', userType: 'owner' as const, businessId: 'demo8_business' as const },
    'demo9': { password: '1234@', userType: 'owner' as const, businessId: 'demo9_business' as const },
    'demo10': { password: '1234@', userType: 'owner' as const, businessId: 'demo10_business' as const }
  });

  const handleLogin = async () => {
    setError('');
    // Admin credentials
    if (username === 'billmychciken@gmail.com' && password === 'dvdpaiya10') {
      setIsAdmin(true);
      setShowAdminPanel(true);
      return;
    }
    // Supabase shops_logins
    const { data: shop, error: shopErr } = await (supabase as any)
      .from('shops_logins')
      .select('username, password, business_id')
      .eq('username', username)
      .single();
    if (!shopErr && shop && shop.password === password) {
      onLogin('owner', shop.business_id as any);
      return;
    }
    // Legacy demo fallback
    const user = userCredentials[username as keyof typeof userCredentials];
    if (user && user.password === password) {
      onLogin(user.userType, user.businessId);
      return;
    }
    setError('Invalid credentials, try again.');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setError('');
    setSuccessMessage('');
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setVerificationStep('verify');
    setVerificationUsername('');
    setVerificationPassword('');
    setNewUsername('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
    setSuccessMessage('');
  };

  const handleVerifyCredentials = () => {
    setError('');
    setSuccessMessage('');

    if (!verificationUsername || !verificationPassword) {
      setError('Please enter both username and password');
      return;
    }

    const user = userCredentials[verificationUsername as keyof typeof userCredentials];
    if (user && user.password === verificationPassword) {
      setVerificationStep('change');
      setNewUsername(verificationUsername);
    } else {
      setError('Invalid username or password');
    }
  };

  const handleSaveNewCredentials = () => {
    setError('');
    setSuccessMessage('');

    if (!newUsername || !newPassword || !confirmNewPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters long');
      return;
    }

    // Update credentials
    const currentUser = userCredentials[verificationUsername as keyof typeof userCredentials];
    if (currentUser) {
      const updatedCredentials = {
        ...userCredentials,
        [newUsername]: {
          password: newPassword,
          userType: currentUser.userType,
          businessId: currentUser.businessId
        }
      };

      // Remove old username if it's different
      if (newUsername !== verificationUsername) {
        delete updatedCredentials[verificationUsername as keyof typeof userCredentials];
      }

      setUserCredentials(updatedCredentials);
      setSuccessMessage('Username and password updated successfully!');
      
      // Reset form after 2 seconds
      setTimeout(() => {
        handleBackToLogin();
      }, 2000);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mb-4">
              <Key className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">
              Forgot Password
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {verificationStep === 'verify' ? 'Verify your current credentials' : 'Set new username and password'}
            </p>
          </div>

          <button
            onClick={handleBackToLogin}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </button>
          
          {verificationStep === 'verify' ? (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={verificationUsername}
                    onChange={(e) => setVerificationUsername(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Enter current username"
                  />
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showVerificationPassword ? 'text' : 'password'}
                    value={verificationPassword}
                    onChange={(e) => setVerificationPassword(e.target.value)}
                    className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Enter current password"
                  />
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowVerificationPassword(!showVerificationPassword)}
                    className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showVerificationPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center">
                  {error}
                </div>
              )}
              
              <button
                onClick={handleVerifyCredentials}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 rounded-lg hover:from-orange-700 hover:to-orange-800 font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Verify Credentials
              </button>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Enter new username"
                  />
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Enter new password"
                  />
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Confirm new password"
                  />
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmNewPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center">
                  {error}
                </div>
              )}
              
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 rounded-lg text-center">
                  {successMessage}
                </div>
              )}
              
              <button
                onClick={handleSaveNewCredentials}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Save New Credentials
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showAdminPanel && isAdmin) {
    const createShop = async (newUsername: string, newPassword: string, logoUrl?: string) => {
      const businessId = `${newUsername.replace(/[^a-zA-Z0-9]/g, '_')}` as any;
      const { error: insertErr } = await (supabase as any)
        .from('shops_logins')
        .insert({ username: newUsername, password: newPassword, business_id: businessId, logo_url: logoUrl || null });
      if (insertErr) throw new Error(insertErr.message);
      setUsername(newUsername);
      setPassword('');
      setShowAdminPanel(false);
      setShowForm(true);
    };
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-lg">
          <div className="text-center mb-6 sm:mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">Admin Panel</h1>
          </div>
          <AdminPanel onCreateShopLogin={createShop} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md relative">
        <button
          onClick={() => setShowAdminPrompt(true)}
          className="absolute right-4 top-4 text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Admin Access
        </button>
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">
            Billing Software
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">System Login</p>
        </div>
        <div className="space-y-4 sm:space-y-6">
          {showAdminPrompt && (
            <div className="p-2 bg-purple-50 text-purple-800 text-xs rounded border border-purple-200">
              Enter admin username and password to access the Admin Panel
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter username"
              />
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter password"
              />
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Login
          </button>
          
          <button
            onClick={handleForgotPassword}
            className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            Forgot Password?
          </button>
        </div>
        
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs text-gray-500">
            Secure login for authorized users only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
