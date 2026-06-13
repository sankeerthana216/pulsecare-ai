import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Mail, Lock, User, Calendar, Phone, Users } from 'lucide-react';

const Register: React.FC = () => {
  const { signup, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    gender: 'MALE',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || '' : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (
      !formData.email ||
      !formData.password ||
      !formData.name ||
      !formData.age ||
      !formData.phone ||
      !formData.emergencyContactName ||
      !formData.emergencyContactPhone
    ) {
      setError('Please fill in all requested fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email might already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8 select-none">
        <div className="h-9 w-9 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
          <Heart className="h-5 w-5 text-white fill-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-white">
          PulseCare <span className="text-primary font-medium">AI</span>
        </span>
      </Link>

      {/* Signup Card */}
      <div className="glass-panel w-full max-w-lg p-8 rounded-3xl relative overflow-hidden">
        <h2 className="text-2xl font-display font-bold text-white mb-2">Create Account</h2>
        <p className="text-slate-400 text-sm mb-6">Register to activate your real-time health telemetry</p>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Age */}
            <div className="col-span-1 space-y-1">
              <label className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Age</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  required
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="30"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-primary"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">My Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="tel"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Block */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 mt-2">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Emergency Caregiver Contact
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  required
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  placeholder="Contact Name (e.g. Spouse/Child)"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <input
                  type="tel"
                  required
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="Contact Phone Number"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 py-3.5 rounded-xl text-white font-semibold shadow-lg shadow-primary/20 transition-all duration-200 text-sm mt-2"
          >
            {submitting ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already a member?{' '}
          <Link to="/login" className="text-primary hover:underline font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
