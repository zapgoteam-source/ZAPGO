'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/types';
import { getRoleDisplayName } from '@/lib/permissions';

const ROLES: UserRole[] = ['ADMIN', 'WORKER', 'AGENCY', 'CUSTOMER'];

export default function UsersManagementPage() {
  const { role, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setDataLoading(true);
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers((data as User[]) || []);
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && role === 'ADMIN') loadUsers();
  }, [loading, role, loadUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdating(userId);
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
    setUpdating(null);
  };

  if (dataLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-6 w-6 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">사용자 관리</h1>
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">이름</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">전화번호</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">역할</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {u.name || <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {u.phone || <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={updating === u.id}
                    onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                    className="border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:border-gray-400 disabled:opacity-50"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{getRoleDisplayName(r)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(u.created_at).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  사용자가 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
