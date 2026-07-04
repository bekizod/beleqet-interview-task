'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCreateFreelanceJobMutation, useGetFreelanceCategoriesQuery, useGetFreelanceJobsQuery } from '@/lib/store/slices/freelanceApiSlice';
import toast from 'react-hot-toast';

export default function CreateFreelanceJobPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { data: categories } = useGetFreelanceCategoriesQuery();
  const [createJob, { isLoading: isCreating }] = useCreateFreelanceJobMutation();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
    deadlineDays: '',
    categoryId: '',
    skills: '',
  });

  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.budgetMin || !formData.budgetMax || !formData.deadlineDays) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      await createJob({
        title: formData.title,
        description: formData.description,
        budgetMin: Number(formData.budgetMin),
        budgetMax: Number(formData.budgetMax),
        deadlineDays: Number(formData.deadlineDays),
        categoryId: formData.categoryId,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      }).unwrap();
      toast.success('Freelance job posted successfully!');
      router.push('/freelance');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Unable to create freelance job.');
    }
  };

  return (
    <div className="container-page py-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-pageH1">Post a Freelance Gig</h1>
          <p className="text-muted text-sm mt-2">Create a new freelance job and receive bids from freelancers</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-white p-8">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Full Stack Developer for E-commerce Site"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brandGreen focus:ring-brandGreen/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the project requirements, deliverables, and expectations..."
              rows={6}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brandGreen focus:ring-brandGreen/20 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Minimum Budget (ETB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.budgetMin}
                onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                placeholder="10000"
                min={1}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brandGreen focus:ring-brandGreen/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Maximum Budget (ETB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.budgetMax}
                onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                placeholder="20000"
                min={1}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brandGreen focus:ring-brandGreen/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Deadline (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.deadlineDays}
              onChange={(e) => setFormData({ ...formData, deadlineDays: e.target.value })}
              placeholder="30"
              min={1}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brandGreen focus:ring-brandGreen/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brandGreen focus:ring-brandGreen/20"
            >
              <option value="">Select a category</option>
              {categories?.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Skills (comma-separated)
            </label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="React, Node.js, PostgreSQL"
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brandGreen focus:ring-brandGreen/20"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-semibold text-ink hover:bg-pageBg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 rounded-lg bg-brandGreen px-4 py-3 text-sm font-semibold text-white hover:bg-darkGreen transition-colors disabled:opacity-60"
            >
              {isCreating ? 'Posting...' : 'Post Gig'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
