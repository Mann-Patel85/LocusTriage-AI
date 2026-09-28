'use client';

import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { CivicIssue } from '../types';
import confetti from 'canvas-confetti';
import {
  UploadCloud,
  Camera,
  MapPin,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  ThumbsUp,
  RefreshCw,
  Navigation,
  Building,
} from 'lucide-react';

interface CitizenPortalProps {
  onIssueCreated: () => void;
  recentIssues: CivicIssue[];
}

const INDIAN_CITY_PRESETS = [
  { name: 'Ahmedabad', lat: '23.022500', lon: '72.571400', state: 'Gujarat' },
  { name: 'Mumbai', lat: '19.076000', lon: '72.877700', state: 'Maharashtra' },
  { name: 'Delhi-NCR', lat: '28.613900', lon: '77.209000', state: 'Delhi' },
  { name: 'Bengaluru', lat: '12.971600', lon: '77.594600', state: 'Karnataka' },
  { name: 'Pune', lat: '18.520400', lon: '73.856700', state: 'Maharashtra' },
  { name: 'Surat', lat: '21.170200', lon: '72.831100', state: 'Gujarat' },
];

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  onIssueCreated,
  recentIssues,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<string>('23.022500');
  const [longitude, setLongitude] = useState<string>('72.571400');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [triageResult, setTriageResult] = useState<CivicIssue | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setTriageResult(null);
      setErrorMsg(null);
    }
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setTriageResult(null);
      setErrorMsg(null);
    }
  };

  // Get current device GPS
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLatitude('23.022500');
        setLongitude('72.571400');
        setIsLocating(false);
      }
    );
  };

  const handleSelectCityPreset = (city: typeof INDIAN_CITY_PRESETS[0]) => {
    setLatitude(city.lat);
    setLongitude(city.lon);
  };

  // Submit and Triage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select or capture a photo of the civic issue first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (latitude) formData.append('latitude', latitude);
      if (longitude) formData.append('longitude', longitude);
      if (customDescription.trim()) formData.append('custom_description', customDescription);

      const result = await api.uploadAndTriage(formData);
      setTriageResult(result);
      onIssueCreated();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with AI Triage Engine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setTriageResult(null);
    setCustomDescription('');
    setErrorMsg(null);
  };

  const handleUpvote = async (issue: CivicIssue) => {
    try {
      await api.upvoteIssue(issue.issue_id, (issue.upvotes || 0) + 1);
      onIssueCreated();
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl p-8 border border-orange-200/80 bg-gradient-to-r from-orange-500/15 via-amber-400/10 to-orange-100/30 backdrop-blur-xl shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Swachh & Smart City Municipal Triage — India</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 mb-3">
            Report Civic Hazards in Indian Cities
          </h1>
          <p className="text-base text-stone-600 leading-relaxed">
            Report potholes, broken streetlights, open manholes, garbage dumps, or water pipeline leaks.
            Our multimodal AI instantly evaluates urgency and logs the complaint to municipal corporations (AMC, BMC, MCD, BBMP).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Submit Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center space-x-2">
              <Camera className="w-5 h-5 text-orange-600" />
              <span>1. Upload Hazard Photo</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dropzone Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center ${
                  previewUrl
                    ? 'border-orange-500/60 bg-orange-500/5'
                    : 'border-orange-200 hover:border-orange-400 bg-orange-50/30 hover:bg-orange-50/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="space-y-3 w-full">
                    <div className="relative rounded-lg overflow-hidden max-h-72 w-full flex items-center justify-center bg-stone-100 border border-orange-200">
                      <img
                        src={previewUrl}
                        alt="Hazard Preview"
                        className="max-h-72 object-contain rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-orange-700 font-semibold">Click or drag another image to replace</p>
                  </div>
                ) : (
                  <div className="py-8 space-y-3">
                    <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-orange-600 ring-8 ring-orange-50">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">
                        Click to upload photo or drag & drop
                      </p>
                      <p className="text-xs text-stone-500 mt-1">PNG, JPG, JPEG (Auto EXIF GPS extraction)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Indian City Presets & Geolocation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-stone-800 flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span>Location Coordinates (India)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="text-xs font-semibold flex items-center space-x-1 text-orange-700 hover:text-orange-900 transition-colors"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Detecting GPS...' : 'Use My GPS'}</span>
                  </button>
                </div>

                {/* Quick Indian City Selector Buttons */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-semibold text-stone-500 mr-1 flex items-center">
                    <Building className="w-3 h-3 mr-1 text-orange-600" />
                    Quick City:
                  </span>
                  {INDIAN_CITY_PRESETS.map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => handleSelectCityPreset(city)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                        latitude === city.lat
                          ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                          : 'bg-white text-stone-700 border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude (e.g. 23.0225)"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude (e.g. 72.5714)"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Optional Note */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-stone-800">
                  Landmark / Specific Location Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="e.g. Near Bodakdev Cross Road, SG Highway, Ahmedabad..."
                  className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
                />
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md ${
                    isSubmitting || !selectedFile
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-500/25 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>AI Triage Analyzing Hazard...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze & Log to Municipal Queue</span>
                    </>
                  )}
                </button>

                {triageResult && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-3 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-stone-700 text-sm font-semibold transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: AI Triage Result or Guide */}
        <div className="lg:col-span-5 space-y-6">
          {triageResult ? (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border-orange-300 bg-orange-50/50 space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-orange-700">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <span className="font-extrabold text-base text-stone-900">Municipal Triage Report</span>
                </div>
                <span className="font-mono text-xs font-bold text-orange-700">{triageResult.issue_id}</span>
              </div>

              {/* Urgency Meter */}
              <div className="p-4 rounded-xl bg-white border border-orange-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                    Assessed Hazard Urgency
                  </span>
                  <span
                    className={`text-sm font-extrabold px-2.5 py-0.5 rounded-full ${
                      triageResult.urgency_score >= 8
                        ? 'bg-rose-100 text-rose-800'
                        : triageResult.urgency_score >= 5
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {triageResult.urgency_score} / 10
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      triageResult.urgency_score >= 8
                        ? 'bg-rose-600'
                        : triageResult.urgency_score >= 5
                        ? 'bg-orange-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${(triageResult.urgency_score / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Categorization & Summary */}
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-stone-600 uppercase tracking-wider font-bold block mb-1">
                    Municipal Category
                  </span>
                  <span className="inline-block px-3 py-1 rounded-lg bg-orange-100 text-orange-900 font-bold text-sm border border-orange-200">
                    {triageResult.category}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-stone-600 uppercase tracking-wider font-bold block mb-1">
                    AI Diagnosis Summary
                  </span>
                  <p className="text-sm text-stone-800 font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-orange-200">
                    {triageResult.description}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-orange-100/70 border border-orange-200 text-xs text-orange-900 font-medium">
                ✅ Logged to Municipal Corporation queue with status <strong className="text-stone-900">Pending</strong>.
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-5">
              <h3 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>Municipal AI Hazard Pipeline</span>
              </h3>
              <div className="space-y-4 text-xs text-stone-600">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <p className="leading-relaxed">
                    <strong className="text-stone-900">Visual Diagnosis:</strong> Gemini 2.5 Flash analyzes road cavities, water pipe leaks, gutter openings, and power cable hazards.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <p className="leading-relaxed">
                    <strong className="text-stone-900">Urgency Assessment:</strong> Issues receive a 1-10 severity score prioritized by public safety and traffic impedance.
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <p className="leading-relaxed">
                    <strong className="text-stone-900">Ward Dispatch:</strong> Automatically mapped with GPS coordinates for AMC, BMC, MCD, and BBMP field maintenance crews.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Community Feed */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center justify-between">
              <span>Recent Indian Community Reports</span>
              <span className="text-xs text-stone-500 font-normal">Recent 4 Issues</span>
            </h3>

            <div className="space-y-3">
              {recentIssues.slice(0, 4).map((issue) => (
                <div
                  key={issue.issue_id}
                  className="p-3 rounded-xl bg-white border border-orange-100 hover:border-orange-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-stone-900 truncate">{issue.category}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          issue.urgency_score >= 8
                            ? 'bg-rose-100 text-rose-800'
                            : issue.urgency_score >= 5
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {issue.urgency_score}/10
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">{issue.description}</p>
                  </div>

                  <button
                    onClick={() => handleUpvote(issue)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 text-xs font-semibold transition-colors shrink-0 border border-orange-200"
                    title="Upvote / Verify this issue"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-orange-600" />
                    <span>{issue.upvotes || 0}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
