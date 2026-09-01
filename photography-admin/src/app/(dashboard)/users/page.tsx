"use client";

import { useState, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users as UsersIcon,
  Download,
  Plus,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  Mail,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
import { SearchBar } from "@/components/shared/search-bar";
import { FilterPanel, FilterGroup } from "@/components/shared/filter-panel";
import { formatDate, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Import API hooks
import { useUsers, User as ApiUser, useCreateUser } from "@/hooks/use-users";
import { toast } from "sonner";
import { X } from "lucide-react";

// ============================================
// STATUS BADGE COMPONENT
// ============================================

interface StatusBadgeProps {
  emailVerified: boolean;
  phoneVerified: boolean;
}

function StatusBadge({ emailVerified, phoneVerified }: StatusBadgeProps) {
  if (emailVerified && phoneVerified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
        <CheckCircle className="w-3 h-3" />
        Verified
      </span>
    );
  }

  if (emailVerified) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
        Email Only
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
      <Ban className="w-3 h-3" />
      Unverified
    </span>
  );
}

// ============================================
// USERS LIST PAGE
// ============================================

export default function UsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({
    userType: "ALL",
    emailVerified: undefined,
    phoneVerified: undefined,
  });

  // Add User modal state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    userType: 'CLIENT' as 'CLIENT' | 'PHOTOGRAPHER' | 'ADMIN',
    city: '',
    country: '',
  });

  // Fetch users from API
  const { data, isLoading, error, refetch } = useUsers({
    page: currentPage,
    limit: 20,
    search: searchQuery,
    userType: filters.userType === "ALL" ? undefined : filters.userType,
    emailVerified: filters.emailVerified,
    phoneVerified: filters.phoneVerified,
  });

  const { mutate: createUser, isPending: isCreatingUser } = useCreateUser();

  const users = data?.users || [];
  const pagination = data?.pagination;

  // Calculate stats from data
  const stats = useMemo(() => {
    if (!data) return { total: 0, verified: 0, emailVerified: 0, phoneVerified: 0 };
    return {
      total: pagination?.total || 0,
      verified: users.filter(u => u.emailVerified && u.phoneVerified).length,
      emailVerified: users.filter(u => u.emailVerified).length,
      phoneVerified: users.filter(u => u.phoneVerified).length,
    };
  }, [data, users, pagination]);

  // Filter configuration
  const filterGroups: FilterGroup[] = [
    {
      id: "userType",
      label: "User Type",
      type: "select",
      value: filters.userType,
      options: [
        { label: "All Users", value: "ALL" },
        { label: "Clients", value: "CLIENT" },
        { label: "Photographers", value: "PHOTOGRAPHER" },
      ],
    },
    {
      id: "emailVerified",
      label: "Email Verified",
      type: "select",
      value: filters.emailVerified === undefined ? "" : filters.emailVerified.toString(),
      options: [
        { label: "All", value: "" },
        { label: "Verified", value: "true" },
        { label: "Unverified", value: "false" },
      ],
    },
    {
      id: "phoneVerified",
      label: "Phone Verified",
      type: "select",
      value: filters.phoneVerified === undefined ? "" : filters.phoneVerified.toString(),
      options: [
        { label: "All", value: "" },
        { label: "Verified", value: "true" },
        { label: "Unverified", value: "false" },
      ],
    },
  ];

  // Table columns
  const columns: ColumnDef<ApiUser>[] = [
    {
      id: "user",
      header: "User",
      accessorKey: "fullName",
      cell: (user) => (
        <div className="flex items-center gap-3">
          <img
            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
            alt={user.fullName}
            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"
          />
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {user.fullName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
          </div>
        </div>
      ),
      width: "30%",
    },
    {
      id: "type",
      header: "Type",
      accessorKey: "userType",
      cell: (user) => (
        <span className={cn(
          "px-2.5 py-1 text-xs font-semibold rounded-full",
          user.userType === "CLIENT" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
          user.userType === "PHOTOGRAPHER" && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
          user.userType === "ADMIN" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        )}>
          {user.userType}
        </span>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      accessorKey: "phoneNumber",
      cell: (user) => (
        <span className="text-gray-700 dark:text-gray-300">
          {user.phoneNumber || "—"}
        </span>
      ),
    },
    {
      id: "location",
      header: "Location",
      accessorKey: "city",
      cell: (user) => (
        <span className="text-gray-700 dark:text-gray-300">
          {user.city ? `${user.city}, ${user.country}` : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (user) => <StatusBadge emailVerified={user.emailVerified} phoneVerified={user.phoneVerified} />,
      width: "15%",
      sortable: false,
    },
    {
      id: "joined",
      header: "Joined",
      accessorKey: "createdAt",
      cell: (user) => (
        <span className="text-gray-700 dark:text-gray-300">{formatDate(user.createdAt)}</span>
      ),
    },
  ];

  // Handle filter change
  const handleFilterChange = (filterId: string, value: any) => {
    if (filterId === "emailVerified" || filterId === "phoneVerified") {
      setFilters((prev) => ({
        ...prev,
        [filterId]: value === "" ? undefined : value === "true"
      }));
    } else {
      setFilters((prev) => ({ ...prev, [filterId]: value }));
    }
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      userType: "ALL",
      emailVerified: undefined,
      phoneVerified: undefined,
    });
    setCurrentPage(1);
  };

  // Handle row click
  const handleRowClick = (user: ApiUser) => {
    router.push(`/users/${user.id}`);
  };

  // Handle export to CSV
  const handleExport = () => {
    if (users.length === 0) {
      toast.error('No users to export');
      return;
    }

    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Type', 'City', 'Country', 'Email Verified', 'Phone Verified', 'Created At'];
    const rows = users.map(user => [
      user.fullName,
      user.email,
      user.phoneNumber || '',
      user.userType,
      user.city || '',
      user.country || '',
      user.emailVerified ? 'Yes' : 'No',
      user.phoneVerified ? 'Yes' : 'No',
      formatDate(user.createdAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${users.length} users successfully`);
  };

  // Handle add user form submission
  const handleSubmitNewUser = (e: FormEvent) => {
    e.preventDefault();

    if (!newUserForm.email || !newUserForm.fullName) {
      toast.error('Email and Full Name are required');
      return;
    }

    createUser(
      {
        email: newUserForm.email,
        fullName: newUserForm.fullName,
        phoneNumber: newUserForm.phoneNumber || undefined,
        userType: newUserForm.userType,
        city: newUserForm.city || undefined,
        country: newUserForm.country || undefined,
      },
      {
        onSuccess: () => {
          setIsAddUserModalOpen(false);
          setNewUserForm({
            email: '',
            fullName: '',
            phoneNumber: '',
            userType: 'CLIENT',
            city: '',
            country: '',
          });
          refetch();
        },
      }
    );
  };

  // Row actions menu
  const renderRowActions = (user: ApiUser) => {
    return (
      <div className="relative group">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/users/${user.id}`);
          }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Eye className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    );
  };

  // Show error state
  if (error && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-teal-600" />
              Users Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage all platform users (clients)
            </p>
          </div>
        </div>

        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Failed to load users. Please try again.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-teal-600" />
            Users Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage all platform users (clients)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            onClick={handleExport}
            disabled={isLoading || users.length === 0}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors font-medium"
            onClick={() => setIsAddUserModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {isLoading ? "—" : stats.total}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Fully Verified</div>
          <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {isLoading ? "—" : stats.verified}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Email Verified</div>
          <div className="mt-2 text-3xl font-bold text-teal-600 dark:text-teal-400">
            {isLoading ? "—" : stats.emailVerified}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
        >
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone Verified</div>
          <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {isLoading ? "—" : stats.phoneVerified}
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, email, or phone..."
          isLoading={isLoading}
        />

        <FilterPanel
          filters={filterGroups}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Results Count */}
      {!isLoading && pagination && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{users.length}</span> of{" "}
          <span className="font-semibold text-gray-900 dark:text-gray-100">{pagination.total}</span> users
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}

      {/* Data Table */}
      {!isLoading && users.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">No users found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || filters.userType !== "ALL" || filters.emailVerified !== undefined || filters.phoneVerified !== undefined
              ? "Try adjusting your filters or search terms"
              : "No users available yet"}
          </p>
        </div>
      ) : (
        <DataTable
          data={users}
          columns={columns}
          onRowClick={handleRowClick}
          rowActions={renderRowActions}
          isLoading={isLoading}
          emptyMessage="No users found matching your search criteria"
          pageSize={20}
          currentPage={currentPage}
          totalPages={pagination?.totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddUserModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setIsAddUserModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Add New User
                </h2>
                <button
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmitNewUser} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserForm.fullName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="john@example.com"
                  />
                </div>

                {/* User Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User Type *
                  </label>
                  <select
                    value={newUserForm.userType}
                    onChange={(e) => setNewUserForm({ ...newUserForm, userType: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="CLIENT">Client</option>
                    <option value="PHOTOGRAPHER">Photographer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newUserForm.phoneNumber}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phoneNumber: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="+233 24 123 4567"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={newUserForm.city}
                    onChange={(e) => setNewUserForm({ ...newUserForm, city: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Accra"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={newUserForm.country}
                    onChange={(e) => setNewUserForm({ ...newUserForm, country: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Ghana"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                  >
                    {isCreatingUser ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    disabled={isCreatingUser}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
