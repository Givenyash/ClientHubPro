import React, { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ClientModal = ({ mode, client, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'Active',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (mode === 'edit' && client) {
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        status: client.status,
      });
    }
  }, [mode, client]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.company.trim()) newErrors.company = 'Company is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'create') {
        await axios.post(`${API_URL}/api/clients`, formData, {
          withCredentials: true,
        });
        toast.success('Client created successfully');
      } else {
        await axios.put(`${API_URL}/api/clients/${client.id}`, formData, {
          withCredentials: true,
        });
        toast.success('Client updated successfully');
      }
      onSuccess();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errorMessage = typeof detail === 'string' ? detail : 'Operation failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="client-modal">
      <div className="absolute inset-0 backdrop-blur-sm bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white border border-[#E2E8F0] rounded-lg shadow-xl w-full max-w-md" data-testid="modal-content">
        <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
          <h2 className="text-xl font-bold text-[#0A0A0B]" style={{ fontFamily: 'Manrope, sans-serif' }} data-testid="modal-title">
            {mode === 'create' ? 'Add New Client' : 'Edit Client'}
          </h2>
          <button
            onClick={onClose}
            data-testid="close-modal-button"
            className="p-2 rounded-md hover:bg-[#F8F9FA] text-[#475569] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" data-testid="client-form">
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-[#64748B] block mb-2">
              Full Name
            </label>
            <input
              type="text"
              data-testid="modal-name-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md text-sm focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] transition-all bg-white text-[#0A0A0B]"
              placeholder="John Doe"
            />
            {errors.name && <p className="text-xs text-[#FF3B30] mt-1" data-testid="name-error">{errors.name}</p>}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-[#64748B] block mb-2">
              Email Address
            </label>
            <input
              type="email"
              data-testid="modal-email-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md text-sm focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] transition-all bg-white text-[#0A0A0B]"
              placeholder="john@example.com"
            />
            {errors.email && <p className="text-xs text-[#FF3B30] mt-1" data-testid="email-error">{errors.email}</p>}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-[#64748B] block mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              data-testid="modal-phone-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md text-sm focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] transition-all bg-white text-[#0A0A0B]"
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && <p className="text-xs text-[#FF3B30] mt-1" data-testid="phone-error">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-[#64748B] block mb-2">
              Company
            </label>
            <input
              type="text"
              data-testid="modal-company-input"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md text-sm focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] transition-all bg-white text-[#0A0A0B]"
              placeholder="Acme Corp"
            />
            {errors.company && <p className="text-xs text-[#FF3B30] mt-1" data-testid="company-error">{errors.company}</p>}
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-[#64748B] block mb-2">
              Status
            </label>
            <select
              data-testid="modal-status-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md text-sm focus:ring-2 focus:ring-[#0047FF]/20 focus:border-[#0047FF] transition-all bg-white text-[#0A0A0B]"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              data-testid="cancel-button"
              className="flex-1 bg-white border border-[#E2E8F0] text-[#0A0A0B] hover:bg-[#F8F9FA] hover:text-[#0A0A0B] rounded-md px-4 py-2 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              data-testid="submit-client-button"
              className="flex-1 bg-[#0047FF] text-white hover:bg-[#0036CC] hover:text-white rounded-md px-4 py-2 transition-all duration-200 font-semibold focus:ring-2 focus:ring-[#0047FF]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Client' : 'Update Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;