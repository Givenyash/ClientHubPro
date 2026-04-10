import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ClientModal from '../components/ClientModal';
import { MagnifyingGlass, FunnelSimple, Plus, PencilSimple, Trash, CaretLeft, CaretRight } from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Clients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [modalMode, setModalMode] = useState('create');

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter, companyFilter, currentPage, sortBy, sortOrder]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (companyFilter) params.append('company', companyFilter);

      const { data } = await axios.get(`${API_URL}/api/clients?${params}`, {
        withCredentials: true,
      });
      setClients(data.clients);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (user?.role !== 'admin') {
      toast.error('Only admins can create clients');
      return;
    }
    setModalMode('create');
    setSelectedClient(null);
    setShowModal(true);
  };

  const handleEdit = (client) => {
    if (user?.role !== 'admin') {
      toast.error('Only admins can edit clients');
      return;
    }
    setModalMode('edit');
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleDelete = async (clientId) => {
    if (user?.role !== 'admin') {
      toast.error('Only admins can delete clients');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this client?')) return;

    try {
      await axios.delete(`${API_URL}/api/clients/${clientId}`, {
        withCredentials: true,
      });
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete client');
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]" data-testid="clients-page">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar title="Clients" />
        <div className="flex-1 p-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#1F2937] mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Client Management
              </h2>
              <p className="text-sm text-[#475569]">{total} total clients</p>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={handleCreate}
                data-testid="add-client-button"
                className="flex items-center gap-2 bg-[#0047FF] text-white hover:bg-[#0036CC] hover:text-white rounded-md px-4 py-2 transition-all duration-200 font-semibold focus:ring-2 focus:ring-[#0047FF]/30"
              >
                <Plus size={20} weight="bold" />
                Add Client
              </button>
            )}
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-md mb-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  data-testid="search-input"
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-[#E2E8F0] rounded-md text-sm focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] transition-all bg-white text-[#0A0A0B]"
                />
              </div>

              <div className="relative">
                <FunnelSimple size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <select
                  data-testid="status-filter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-[#E2E8F0] rounded-md text-sm focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] transition-all bg-white text-[#0A0A0B]"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <input
                type="text"
                data-testid="company-filter"
                placeholder="Filter by company..."
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md text-sm focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] transition-all bg-white text-[#0A0A0B]"
              />
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-md overflow-hidden" data-testid="clients-table">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F8F9FA] border-b border-[#E2E8F0]">
                  <tr>
                    <th
                      className="text-xs uppercase text-[#64748B] font-semibold py-3 px-4 text-left cursor-pointer hover:bg-[#E2E8F0] transition-colors"
                      onClick={() => handleSort('name')}
                      data-testid="sort-name"
                    >
                      Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-xs uppercase text-[#64748B] font-semibold py-3 px-4 text-left">Email</th>
                    <th className="text-xs uppercase text-[#64748B] font-semibold py-3 px-4 text-left">Phone</th>
                    <th
                      className="text-xs uppercase text-[#64748B] font-semibold py-3 px-4 text-left cursor-pointer hover:bg-[#E2E8F0] transition-colors"
                      onClick={() => handleSort('company')}
                      data-testid="sort-company"
                    >
                      Company {sortBy === 'company' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-xs uppercase text-[#64748B] font-semibold py-3 px-4 text-left">Status</th>
                    {user?.role === 'admin' && (
                      <th className="text-xs uppercase text-[#64748B] font-semibold py-3 px-4 text-right">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="border-b border-[#F1F5F9]">
                        <td colSpan={user?.role === 'admin' ? 6 : 5} className="py-3 px-4">
                          <div className="h-8 bg-[#F8F9FA] rounded skeleton"></div>
                        </td>
                      </tr>
                    ))
                  ) : clients.length === 0 ? (
                    <tr>
                      <td colSpan={user?.role === 'admin' ? 6 : 5} className="py-12 text-center" data-testid="no-clients-empty-state">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-[#F8F9FA] rounded-full flex items-center justify-center mb-3">
                            <MagnifyingGlass size={32} className="text-[#CBD5E1]" />
                          </div>
                          <p className="text-sm text-[#64748B] mb-1">No clients found</p>
                          <p className="text-xs text-[#94A3B8]">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    clients.map((client, index) => (
                      <tr key={client.id} className="border-b border-[#F1F5F9] table-row-hover" data-testid={`client-row-${index}`}>
                        <td className="py-3 px-4 text-sm text-[#334155] font-semibold">{client.name}</td>
                        <td className="py-3 px-4 text-sm text-[#334155]">{client.email}</td>
                        <td className="py-3 px-4 text-sm text-[#334155]">{client.phone}</td>
                        <td className="py-3 px-4 text-sm text-[#334155]">{client.company}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                              client.status === 'Active' ? 'status-badge-active' : 'status-badge-inactive'
                            }`}
                            data-testid={`client-status-${index}`}
                          >
                            {client.status}
                          </span>
                        </td>
                        {user?.role === 'admin' && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(client)}
                                data-testid={`edit-client-${index}`}
                                className="p-2 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#F8F9FA] hover:text-[#0A0A0B] text-[#475569] transition-all duration-200"
                              >
                                <PencilSimple size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(client.id)}
                                data-testid={`delete-client-${index}`}
                                className="p-2 rounded-md border border-[#FF3B30]/30 bg-white hover:bg-[#FF3B30] hover:text-white text-[#FF3B30] transition-all duration-200"
                              >
                                <Trash size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="border-t border-[#E2E8F0] p-4 flex items-center justify-between" data-testid="pagination">
                <p className="text-sm text-[#475569]">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="previous-page"
                    className="flex items-center gap-1 px-3 py-2 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#F8F9FA] hover:text-[#0A0A0B] text-[#475569] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CaretLeft size={16} />
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="next-page"
                    className="flex items-center gap-1 px-3 py-2 rounded-md border border-[#E2E8F0] bg-white hover:bg-[#F8F9FA] hover:text-[#0A0A0B] text-[#475569] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <CaretRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <ClientModal
          mode={modalMode}
          client={selectedClient}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchClients();
          }}
        />
      )}
    </div>
  );
};

export default Clients;