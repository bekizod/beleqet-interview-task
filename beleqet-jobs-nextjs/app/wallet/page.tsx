'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useGetWalletQuery, useWithdrawMutation } from '@/lib/store/slices/walletApiSlice';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, DollarSign } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const { isAuthenticated, user } = useAuth();
  const { data: wallet, isLoading } = useGetWalletQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [withdraw] = useWithdrawMutation();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (parseFloat(withdrawAmount) > (wallet?.availableBalance || 0)) {
      toast.error('Insufficient available balance');
      return;
    }

    try {
      await withdraw({
        amount: parseFloat(withdrawAmount),
        bankAccount,
        bankName: 'Default Bank',
        accountHolder: `${user?.firstName} ${user?.lastName}`,
      }).unwrap();
      toast.success('Withdrawal request submitted successfully');
      setIsWithdrawing(false);
      setWithdrawAmount('');
      setBankAccount('');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit withdrawal request');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please log in to view your wallet</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Freelancer Wallet</h1>
          <p className="text-gray-600 mt-2">Manage your earnings and withdrawals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {wallet?.currency} {wallet?.availableBalance.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {wallet?.currency} {wallet?.pendingBalance.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {wallet?.currency} {((wallet?.availableBalance || 0) + (wallet?.pendingBalance || 0)).toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            </div>
            {wallet?.transactions && wallet.transactions.length > 0 ? (
              <div className="space-y-4">
                {wallet.transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${transaction.type.startsWith('CREDIT') ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                        {transaction.type.startsWith('CREDIT') ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.note || transaction.type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-semibold ${transaction.type.startsWith('CREDIT') ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {transaction.type.startsWith('CREDIT') ? '+' : '-'}{wallet.currency} {transaction.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No transactions yet</div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Funds</h3>
            {!isWithdrawing ? (
              <button
                onClick={() => setIsWithdrawing(true)}
                disabled={(wallet?.availableBalance || 0) <= 0}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Request Withdrawal
              </button>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ({wallet?.currency})
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={wallet?.availableBalance}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter amount"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Available: {wallet?.currency} {wallet?.availableBalance.toLocaleString()}</p>
                </div>
                <div>
                  <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    id="bankAccount"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter bank account number"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawing(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
