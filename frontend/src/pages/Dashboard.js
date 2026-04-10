import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Users, CheckCircle, XCircle, TrendUp } from '@phosphor-icons/react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/analytics`, {
        withCredentials: true,
      });
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, testId }) => (
    <div className="bg-white border border-[#E2E8F0] rounded-md p-6 card-hover" data-testid={testId}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-md flex items-center justify-center`} style={{ backgroundColor: `${color}14` }}>
          <Icon size={24} weight="bold" color={color} />
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-[#64748B] font-bold mb-1">{label}</p>
        <p className="text-3xl font-black text-[#0A0A0B]" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {loading ? (
            <span className="inline-block w-16 h-8 bg-[#F8F9FA] rounded skeleton"></span>
          ) : (
            value
          )}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]" data-testid="dashboard-page">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar title="Dashboard" />
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#1F2937] mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Overview
            </h2>
            <p className="text-sm text-[#475569]">Real-time insights into your client base</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={Users}
              label="Total Clients"
              value={analytics?.total_clients || 0}
              color="#0047FF"
              testId="stat-total-clients"
            />
            <StatCard
              icon={CheckCircle}
              label="Active Clients"
              value={analytics?.active_clients || 0}
              color="#00C853"
              testId="stat-active-clients"
            />
            <StatCard
              icon={XCircle}
              label="Inactive Clients"
              value={analytics?.inactive_clients || 0}
              color="#64748B"
              testId="stat-inactive-clients"
            />
            <StatCard
              icon={TrendUp}
              label="New (30 Days)"
              value={analytics?.recent_clients_30d || 0}
              color="#F59E0B"
              testId="stat-recent-clients"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E2E8F0] rounded-md p-6" data-testid="top-companies-card">
              <h3 className="text-xl font-semibold text-[#1F2937] mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Top Companies
              </h3>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-[#F8F9FA] rounded skeleton"></div>
                  ))}
                </div>
              ) : analytics?.top_companies && analytics.top_companies.length > 0 ? (
                <div className="space-y-3">
                  {analytics.top_companies.map((company, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-md hover:bg-[#F8F9FA] transition-colors"
                      data-testid={`company-item-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0047FF]/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-[#0047FF]">{company.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0A0A0B]">{company.name}</p>
                          <p className="text-xs text-[#64748B]">{company.count} {company.count === 1 ? 'client' : 'clients'}</p>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-[#0047FF]">{company.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12" data-testid="no-companies-empty-state">
                  <Users size={48} className="mx-auto mb-3 text-[#CBD5E1]" />
                  <p className="text-sm text-[#64748B]">No company data available</p>
                </div>
              )}
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-md p-6" data-testid="client-status-card">
              <h3 className="text-xl font-semibold text-[#1F2937] mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Client Status Distribution
              </h3>
              {loading ? (
                <div className="h-48 bg-[#F8F9FA] rounded skeleton"></div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-[#0A0A0B]">Active Clients</span>
                      <span className="text-sm font-bold text-[#00C853]">
                        {analytics?.total_clients > 0
                          ? Math.round((analytics.active_clients / analytics.total_clients) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#F8F9FA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00C853] transition-all duration-500"
                        style={{
                          width: analytics?.total_clients > 0
                            ? `${(analytics.active_clients / analytics.total_clients) * 100}%`
                            : '0%'
                        }}
                        data-testid="active-progress-bar"
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-[#0A0A0B]">Inactive Clients</span>
                      <span className="text-sm font-bold text-[#64748B]">
                        {analytics?.total_clients > 0
                          ? Math.round((analytics.inactive_clients / analytics.total_clients) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-[#F8F9FA] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#64748B] transition-all duration-500"
                        style={{
                          width: analytics?.total_clients > 0
                            ? `${(analytics.inactive_clients / analytics.total_clients) * 100}%`
                            : '0%'
                        }}
                        data-testid="inactive-progress-bar"
                      ></div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-[#00C853]/5 border border-[#00C853]/20 rounded-md">
                        <p className="text-2xl font-black text-[#00C853]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                          {analytics?.active_clients || 0}
                        </p>
                        <p className="text-xs uppercase tracking-wider text-[#64748B] font-bold mt-1">Active</p>
                      </div>
                      <div className="text-center p-4 bg-[#64748B]/5 border border-[#64748B]/20 rounded-md">
                        <p className="text-2xl font-black text-[#64748B]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                          {analytics?.inactive_clients || 0}
                        </p>
                        <p className="text-xs uppercase tracking-wider text-[#64748B] font-bold mt-1">Inactive</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;