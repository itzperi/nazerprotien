import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, PlusCircle, Image as ImageIcon } from 'lucide-react';

interface AdminPanelProps {
  onCreateShopLogin: (username: string, password: string, logoUrl?: string) => Promise<void>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onCreateShopLogin }) => {
  const [shopsCount, setShopsCount] = useState<number>(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadCounts = async () => {
      const { count, error } = await supabase
        .from('shops_logins')
        .select('*', { count: 'exact', head: true });
      if (!error) setShopsCount(count || 0);
    };
    loadCounts();
  }, []);

  const handleCreate = async () => {
    setError('');
    setSuccess('');
    if (!username.trim()) { setError('Username is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      await onCreateShopLogin(username.trim(), password, logoUrl.trim() || undefined);
      setSuccess('Shop login created successfully');
      setUsername('');
      setPassword('');
      setLogoUrl('');
      const { count } = await supabase
        .from('shops_logins')
        .select('*', { count: 'exact', head: true });
      setShopsCount(count || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to create shop');
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded border">
        <div className="flex items-center gap-2 text-gray-800">
          <Users className="h-5 w-5" />
          <div className="font-medium">Total Shops:</div>
          <div className="font-bold">{shopsCount}</div>
        </div>
      </div>

      <div className="p-4 bg-white rounded border space-y-3">
        <div className="font-semibold">Create New Shop Login</div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Shop username (email or name)"
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 chars)"
          className="w-full p-2 border rounded"
        />
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-gray-500" />
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="Optional logo URL"
            className="flex-1 p-2 border rounded"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-green-600 text-white rounded inline-flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" /> Create Shop Login
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;


