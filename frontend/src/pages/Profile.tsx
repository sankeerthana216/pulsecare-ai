import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { 
  User, 
  Phone, 
  Users, 
  Settings2, 
  Calendar,
  Save,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const Profile: React.FC = () => {
  const queryClient = useQueryClient();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    age: 30,
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    heartRateThreshold: 100,
    temperatureThreshold: 38.0,
  });

  // 1. Query current user profile
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiRequest('/profile'),
  });

  // Sync database values with form state on load
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        age: profileData.age || 30,
        gender: (profileData.gender as any) || 'MALE',
        phone: profileData.phone || '',
        emergencyContactName: profileData.emergencyContactName || '',
        emergencyContactPhone: profileData.emergencyContactPhone || '',
        heartRateThreshold: profileData.heartRateThreshold || 100,
        temperatureThreshold: profileData.temperatureThreshold || 38.0,
      });
    }
  }, [profileData]);

  // 2. Profile update mutation
  const updateMutation = useMutation({
    mutationFn: (updatedData: typeof formData) =>
      apiRequest('/profile', {
        method: 'PUT',
        bodyData: updatedData,
      }),
    onSuccess: (data) => {
      setSuccessMsg('Profile settings updated successfully.');
      queryClient.setQueryData(['profile'], data.profile);
      // Automatically update logged user name in sidebar
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.name = data.profile.name;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update profile settings.');
      setTimeout(() => setErrorMsg(''), 4000);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'heartRateThreshold'
        ? parseInt(value) || 0
        : name === 'temperatureThreshold'
          ? parseFloat(value) || 0.0
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col justify-center items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        <p className="text-sm text-slate-500">Retrieving profile settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-8 text-center text-red-400 rounded-3xl border-red-500/15">
        Failed to load patient profile records.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Alert success banner */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold leading-relaxed">
          <CheckCircle2 className="h-4.5 w-4.5" />
          {successMsg}
        </div>
      )}

      {/* Alert error banner */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold leading-relaxed">
          <AlertTriangle className="h-4.5 w-4.5" />
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Module 1: About Patient */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
            <User className="h-4.5 w-4.5 text-primary" />
            Personal Identification
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>

            {/* Email (Readonly) */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Registered Email</label>
              <input
                type="email"
                disabled
                value={profileData.user?.email || ''}
                className="w-full bg-slate-950 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Age */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Age</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="number"
                  required
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-primary"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">My Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="tel"
                required
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Module 2: Emergency Contact */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
            <Users className="h-4.5 w-4.5 text-primary" />
            Caregiver Emergency Contact
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Contact name */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Caregiver Name</label>
              <input
                type="text"
                required
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>

            {/* Contact phone */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Caregiver Phone</label>
              <input
                type="tel"
                required
                name="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <span className="text-[10px] text-slate-500 block leading-relaxed">
            Emergency contact details are mapped by the system during critical vital triggers to automatically send alerts and display dial buttons.
          </span>
        </div>

        {/* Module 3: Alert Thresholds */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-3">
            <Settings2 className="h-4.5 w-4.5 text-primary" />
            Alert Threshold Boundaries
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* HR Threshold */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Heart Rate Alert (BPM)</label>
              <input
                type="number"
                required
                name="heartRateThreshold"
                value={formData.heartRateThreshold}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-primary"
              />
              <span className="text-[9px] text-slate-500">Triggers WARNING if heart rate exceeds this value.</span>
            </div>

            {/* Temp Threshold */}
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">Temperature Alert (°C)</label>
              <input
                type="number"
                step="0.1"
                required
                name="temperatureThreshold"
                value={formData.temperatureThreshold}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-primary"
              />
              <span className="text-[9px] text-slate-500">Triggers WARNING if temperature exceeds this value.</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl text-xs shadow-lg shadow-primary/15 transition-all duration-200 disabled:opacity-50"
        >
          <Save className="h-4.5 w-4.5" />
          {updateMutation.isPending ? 'Saving Settings...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
