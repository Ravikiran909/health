import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  HeartPulse,
  Globe2,
  Mic,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="p-12 text-center text-teal-400 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
        <span className="text-sm font-medium">Loading district health intelligence...</span>
      </div>
    );
  }

  const { metrics, facilityUtilization, referralFlows } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-teal-950 p-6 sm:p-8 rounded-3xl border border-teal-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-2">
            <BarChart3 className="w-4 h-4" />
            <span>District Health Officer (DHO) Command Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Healthcare Access Analytics
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Live telemetry of facility search frequency, appointment fulfillment, ASHA maternal tracking, Kannada vs English adoption ratio, and inter-facility referral flows.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-slate-700 flex items-center gap-2 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Transparent Disclaimer */}
      <div className="p-3 bg-slate-900/80 rounded-2xl border border-teal-800/40 text-[11px] text-slate-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Transparency Notice:</strong> Real system session metrics combined with baseline district statistics. Never presented as unverified medical outcomes.
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold block uppercase">
            Monitored Facilities
          </span>
          <span className="text-3xl font-black text-white mt-1 block">
            {metrics.totalFacilitiesMonitored}
          </span>
          <span className="text-[11px] text-teal-400 mt-1 block">
            {metrics.activePHCs} PHCs • {metrics.activeCHCs} CHCs
          </span>
        </div>

        <div className="bg-slate-900 border border-rose-900/40 p-5 rounded-2xl">
          <span className="text-xs text-rose-300 font-semibold block uppercase">
            High-Risk Maternal
          </span>
          <span className="text-3xl font-black text-rose-400 mt-1 block">
            {metrics.highRiskMaternalTracked}
          </span>
          <span className="text-[11px] text-rose-300/80 mt-1 block">
            Active weekly ASHA visits
          </span>
        </div>

        <div className="bg-slate-900 border border-teal-900/40 p-5 rounded-2xl">
          <span className="text-xs text-teal-300 font-semibold block uppercase">
            Kannada Language Ratio
          </span>
          <span className="text-3xl font-black text-teal-400 mt-1 block">
            {metrics.kannadaLanguageAdoptionPct}%
          </span>
          <span className="text-[11px] text-teal-300/80 mt-1 block">
            Preferred rural interaction
          </span>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 p-5 rounded-2xl">
          <span className="text-xs text-emerald-300 font-semibold block uppercase">
            Voice AI Engagement
          </span>
          <span className="text-3xl font-black text-emerald-400 mt-1 block">
            {metrics.voiceAssistantUsagePct}%
          </span>
          <span className="text-[11px] text-emerald-300/80 mt-1 block">
            Speech-first user preference
          </span>
        </div>
      </div>

      {/* Facility Utilization Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-400" />
          <span>Primary & Secondary Facility Load Tracking</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Facility Name</th>
                <th className="py-3 px-4">Weekly Consultations</th>
                <th className="py-3 px-4">Deliveries Conducted</th>
                <th className="py-3 px-4">Bed Occupancy Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {facilityUtilization.map((f: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white">{f.name}</td>
                  <td className="py-3.5 px-4 font-semibold text-teal-300">{f.visitsThisWeek}</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-400">{f.deliveries}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-500 h-2 rounded-full"
                          style={{ width: `${f.bedOccupancyPct}%` }}
                        />
                      </div>
                      <span className="font-bold text-white">{f.bedOccupancyPct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referral Flow Inter-Facility Routing */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-400" />
          <span>Inter-Facility Referral Pipeline & Higher Centre Routing</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {referralFlows.map((flow: any, idx: number) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">{flow.from}</span>
                <ArrowRight className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-teal-300">{flow.to}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Referrals:</span>
                <span className="font-black text-white text-base">{flow.count}</span>
              </div>
              <span className="text-[11px] text-slate-400 block italic">
                Primary Indication: {flow.reason}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
