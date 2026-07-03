'use client';

import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useGetProfileQuery } from "@/lib/store/slices/usersApiSlice";
import { useLogoutMutation } from "@/lib/store/slices/authApiSlice";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "@/lib/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { User, LogOut, Briefcase, Bell, Menu, LayoutDashboard, PlusCircle } from "lucide-react";
import { useState } from "react";
import Cookies from "js-cookie";
// Nav items shown to job seekers / unauthenticated users
const seekerNavItems = [
  { label: "Find Jobs", href: "/jobs" },
  { label: "Freelance", href: "/freelance" },
  { label: "About Us", href: "/about" },
  { label: "CV Maker", href: "/cv-maker" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

// Nav items shown to employers / admins
const employerNavItems = [
  { label: "Dashboard", href: "/my-jobs" },
  { label: "Freelance", href: "/freelance" },
  { label: "Post a Job", href: "/post-job" },
  { label: "About Us", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuthenticated });
  const [logoutMutation] = useLogoutMutation();
  const dispatch = useDispatch();
  const router = useRouter();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isEmployer = profile?.role === 'EMPLOYER' || profile?.role === 'ADMIN';

  const navItems = isEmployer ? employerNavItems : seekerNavItems;

  const handleLogout = async () => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
    try {
      await logoutMutation().unwrap();
    } catch {
      // even if the API call fails, clear local state
    } finally {
      dispatch(logoutAction());
      if (typeof window !== 'undefined') {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('user');
      }
      window.location.href = '/login'; 
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
      <div className="container-page flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-extrabold text-lg text-primary">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brandGreen text-white text-sm">
            B
          </span>
          <span>
            Beleqet <span className="text-brandGreen">Job</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-ink">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brandGreen transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isAuthenticated && profile ? (
            <>
              {/* Notifications bell */}
              <Link
                href="/notifications"
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-ink hover:text-brandGreen transition-colors"
              >
                <Bell className="h-4 w-4" />
              </Link>

              {/* User avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </span>
                  </div>
                  <span className="hidden sm:inline-block text-sm font-medium text-ink">
                    {profile.firstName}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* Role label */}
                    <div className="px-4 py-1.5 mb-1">
                      <p className="text-xs text-muted font-medium uppercase tracking-wide">
                        {profile.role.replace('_', ' ')}
                      </p>
                    </div>
                    <hr className="mb-1" />

                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>

                    {/* Job seeker links */}
                    {!isEmployer && (
                      <Link
                        href="/applications"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Briefcase className="h-4 w-4" />
                        My Applications
                      </Link>
                    )}

                    {/* Employer links */}
                    {isEmployer && (
                      <>
                        <Link
                          href="/my-jobs"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          My Jobs
                        </Link>
                        <Link
                          href="/post-job"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <PlusCircle className="h-4 w-4" />
                          Post a Job
                        </Link>
                      </>
                    )}

                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Employer CTA in header */}
              {isEmployer && (
                <Link
                  href="/post-job"
                  className="hidden sm:inline-flex items-center rounded-full bg-brandGreen px-4 py-2 text-sm font-semibold text-white hover:bg-darkGreen transition-colors"
                >
                  Post a Job
                </Link>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-block text-sm font-medium text-ink hover:text-brandGreen transition-colors"
            >
              Login / Sign Up
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 bg-white py-4">
          <nav className="flex flex-col gap-4 px-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink hover:text-brandGreen transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-ink hover:text-brandGreen transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Profile
                </Link>

                {!isEmployer && (
                  <Link
                    href="/applications"
                    className="text-sm font-medium text-ink hover:text-brandGreen transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    My Applications
                  </Link>
                )}

                {isEmployer && (
                  <Link
                    href="/my-jobs"
                    className="text-sm font-medium text-ink hover:text-brandGreen transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    My Jobs
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-700 text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-ink hover:text-brandGreen transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Login / Sign Up
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
