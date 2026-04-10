// @ts-nocheck
import { useState, useEffect } from "react";
import {
  User, Edit2, Camera, ChevronRight, Lock, Phone,
  BookOpen, MapPin, Hash, Calendar, Layers, CheckCircle2,
  ArrowLeft, X, ZoomIn, ZoomOut, RotateCw, Image, Smile, Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import MobileLayout from "@/components/MobileLayout";
import AuthCard from "@/components/AuthCard";

// ─── Data Config ─────────────────────────────────────────────────────────────

const courses = ["B.Tech", "BBA", "BCA", "M.Tech", "MBA"] as const;
type CourseType = typeof courses[number];

const courseConfig: Record<CourseType, { duration: number; semesters: number; branches: string[] }> = {
  "B.Tech": { duration: 4, semesters: 8, branches: ["CSE", "ECE", "ME", "EE", "CE", "Other"] },
  "BBA":    { duration: 3, semesters: 6, branches: ["General", "Finance", "Marketing", "HR", "Other"] },
  "BCA":    { duration: 3, semesters: 6, branches: ["General", "Data Science", "Web Development", "Other"] },
  "M.Tech": { duration: 2, semesters: 4, branches: ["CSE", "ECE", "ME", "EE", "CE", "Other"] },
  "MBA":    { duration: 2, semesters: 4, branches: ["Finance", "Marketing", "HR", "Operations", "Other"] },
};

const busStops = [
  "Trisulia", "CDA Naibandha", "Bijupattnaik Park", "Aswini Hospital",
  "Satichaura", "Badambadi", "Link Road", "Press Chhaka", "Pahala",
  "Patia", "Kanan Vihar", "Shree Vihar", "Jaydevvihar", "Sastri Nagar",
  "Damana", "Railway Stadium", "Fire Station", "Baramunda", "ITER"
];

const countryCodes = ["+91", "+1", "+44", "+61", "+971"];

const nameSchema = z.string().min(2, "Minimum 2 characters").regex(/^[a-zA-Z\s]+$/, "Letters only");
const phoneSchema = z.string().regex(/^\d{10}$/, "Must be exactly 10 digits");

const getSemesterOptions = (c: string): string[] => {
  if (!c || !(c in courseConfig)) return [];
  const total = courseConfig[c as CourseType].semesters;
  return Array.from({ length: total }, (_, i) => `Sem ${i + 1}`);
};

const yearOptions = ["2024", "2025", "2026", "2027", "2028", "2029", "2030", "2031"];

// ─── Photo Options Sheet ──────────────────────────────────────────────────────

const PhotoSheet = ({ open, onClose, onCamera, onGallery, onAvatar, onDelete, hasPhoto }) => {
  if (!open) return null;
  const options = [
    { id: "camera",  label: "Take Photo",    icon: Camera, action: onCamera },
    { id: "gallery", label: "Choose from Gallery", icon: Image, action: onGallery },
    { id: "avatar",  label: "Pick an Avatar", icon: Smile, action: onAvatar },
  ];
  return (
    <>
      <div onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white dark:bg-gray-900 rounded-t-3xl z-50 shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
        <div className="px-6 pb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 text-center">Profile Photo</h2>
          <div className="space-y-1">
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { opt.action(); onClose(); }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                  <opt.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200">{opt.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
              </button>
            ))}
            {hasPhoto && (
              <button
                onClick={() => { onDelete(); onClose(); }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <span className="font-medium text-red-500">Remove Photo</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full mt-5 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Crop/Zoom Overlay ────────────────────────────────────────────────────────

const CropOverlay = ({ onSave, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const inputRef = useState<HTMLInputElement | null>(null);

  const triggerInput = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleSave = () => {
    if (!image) return;
    onSave(image);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="font-bold text-gray-900 dark:text-white">Adjust Photo</span>
          <button
            onClick={handleSave}
            disabled={!image}
            className="text-teal-600 dark:text-teal-400 font-bold text-sm disabled:opacity-40"
          >
            Save
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-teal-500 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {image ? (
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
                />
              ) : (
                <User className="w-16 h-16 text-gray-400" />
              )}
            </div>
          </div>

          {!image ? (
            <button
              onClick={triggerInput}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-teal-400 text-teal-600 dark:text-teal-400 font-semibold hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
            >
              Choose Image
            </button>
          ) : (
            <>
              {/* Zoom */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Zoom</span>
                  <span>{(scale * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <input
                    type="range" min="0.5" max="3" step="0.05" value={scale}
                    onChange={e => setScale(Number(e.target.value))}
                    className="flex-1 accent-teal-500"
                  />
                  <ZoomIn className="w-4 h-4 text-gray-500 flex-shrink-0" />
                </div>
              </div>

              {/* Rotation */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Rotation</span>
                  <span>{rotation}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="0" max="360" step="15" value={rotation}
                    onChange={e => setRotation(Number(e.target.value))}
                    className="flex-1 accent-teal-500"
                  />
                  <button
                    onClick={() => setRotation(r => (r + 90) % 360)}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
                  >
                    <RotateCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <button
                onClick={triggerInput}
                className="w-full py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50"
              >
                Choose Different
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Field Row (View Mode) ────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value, accent = false }) => (
  <div className="flex items-center gap-4 px-5 py-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${accent ? "bg-teal-50 dark:bg-teal-900/30" : "bg-gray-50 dark:bg-gray-800"}`}>
      <Icon className={`w-5 h-5 ${accent ? "text-teal-600 dark:text-teal-400" : "text-gray-500 dark:text-gray-400"}`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-gray-900 dark:text-white font-semibold truncate">{value || <span className="text-gray-400 font-normal italic">Not set</span>}</p>
    </div>
  </div>
);

// ─── Styled Select ────────────────────────────────────────────────────────────

const StyledSelect = ({ label, value, onChange, options, placeholder = "Select…", disabled = false, icon: Icon }) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">{label}</label>}
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 pr-10 text-gray-900 dark:text-white focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${Icon ? "pl-11" : "pl-4"}`}
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

// ─── Styled Input ─────────────────────────────────────────────────────────────

const StyledInput = ({ label, value, onChange, placeholder, error, disabled = false, readOnly = false, icon: Icon, type = "text" }) => (
  <div className="space-y-1.5">
    {label && <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">{label}</label>}
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`w-full bg-gray-50 dark:bg-gray-800 border rounded-2xl py-3.5 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all
          ${Icon ? "pl-11" : "pl-4"}
          ${error ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "border-gray-200 dark:border-gray-700 focus:border-teal-400 focus:ring-teal-400/20"}
          ${(disabled || readOnly) ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-900" : ""}`}
      />
      {(disabled || readOnly) && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
    {error && <p className="text-xs text-red-500 dark:text-red-400 px-1 font-medium">{error}</p>}
  </div>
);

// CalcChip removed — semester and year are now selectable dropdowns

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
    <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">{title}</span>
    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
  </div>
);

// ─── Main Profile Component ───────────────────────────────────────────────────

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing]           = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCropOverlay, setShowCropOverlay]   = useState(false);

  // Form state
  const [fullName, setFullName]         = useState(user?.fullName || "");
  const [email]                         = useState(user?.email || "");
  const [registrationNo, setRegNo]      = useState(user?.registrationNo || "");
  const [countryCode, setCountryCode]   = useState("+91");
  const [phone, setPhone]               = useState(user?.phoneNumber || "");
  const [course, setCourse]             = useState(user?.course || "");
  const [branchSelect, setBranchSelect] = useState("");
  const [branchText, setBranchText]     = useState("");
  const [semester, setSemester]         = useState(user?.semester || "");
  const [yearBatch, setYearBatch]       = useState(user?.yearBatch || "");
  const [busStop, setBusStop]           = useState(user?.busStop || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [errors, setErrors]             = useState<{ fullName?: string; phone?: string }>({});

  useEffect(() => {
    if (user?.branch) {
      const branches = course ? courseConfig[course as CourseType]?.branches || [] : [];
      if (branches.includes(user.branch)) {
        setBranchSelect(user.branch);
      } else {
        setBranchSelect("Other");
        setBranchText(user.branch);
      }
    }
  }, [user]);

  const handleCourseChange = (c: string) => {
    setCourse(c);
    setBranchSelect("");
    setBranchText("");
    setSemester("");
    setYearBatch("");
  };

  const validateAndSave = () => {
    const newErrors: { fullName?: string; phone?: string } = {};
    try { nameSchema.parse(fullName); } catch (e: any) { newErrors.fullName = e.errors?.[0]?.message; }
    if (phone) {
      try { phoneSchema.parse(phone.replace(/\D/g, "")); } catch (e: any) { newErrors.phone = e.errors?.[0]?.message; }
    }
    if (Object.keys(newErrors).length) { setErrors(newErrors); return; }

    updateUser({
      fullName, registrationNo,
      phoneNumber: phone, branch: branchSelect === "Other" ? branchText : branchSelect,
      course, semester, yearBatch, busStop, profileImage,
    });
    setIsEditing(false);
    setErrors({});
    toast({ title: "✅ Profile Updated", description: "Your changes have been saved." });
  };

  const handleImageSaved = (img: string) => {
    setProfileImage(img);
    setShowCropOverlay(false);
    toast({ title: "📸 Photo Updated" });
  };

  const handleDeletePhoto = () => {
    setProfileImage("");
    updateUser({ profileImage: "" });
    toast({ title: "Photo removed" });
  };

  const startEditing = () => {
    setFullName(user?.fullName || "");
    setRegNo(user?.registrationNo || "");
    setPhone(user?.phoneNumber || "");
    setCourse(user?.course || "");
    setSemester(user?.semester || "");
    setYearBatch(user?.yearBatch || "");
    setBusStop(user?.busStop || "");
    setErrors({});
    setIsEditing(true);
  };

  const currentBranchOptions = course ? (courseConfig[course as CourseType]?.branches || []) : [];

  return (
    <MobileLayout>
      <AuthCard className="max-h-[95vh] overflow-y-auto flex flex-col p-0 sm:p-0 my-auto bg-gray-50 dark:bg-gray-950">
        <div className="min-h-full bg-gray-50 dark:bg-gray-950">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 rounded-t-[2rem]">
        <div className="max-w-[430px] mx-auto flex items-center justify-between px-5 h-14">
          <button
            onClick={() => isEditing ? setIsEditing(false) : window.history.back()}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
          >
            {isEditing ? <X className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            {isEditing ? "Edit Profile" : "My Profile"}
          </h1>
          <button
            onClick={isEditing ? validateAndSave : startEditing}
            className={`text-sm font-bold px-4 py-2 rounded-full transition-all ${
              isEditing
                ? "bg-[#0E2A2F] text-white hover:bg-[#0E2A2F]/90 shadow-lg shadow-[#0E2A2F]/30"
                : "text-[#0E2A2F] dark:text-teal-400 hover:bg-[#0E2A2F]/10 dark:hover:bg-teal-900/20"
            }`}
          >
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>
      </div>

      <div className="max-w-[430px] mx-auto pb-24">

        {/* ── Hero Avatar Section ────────────────────────────────────── */}
        <div className="relative pt-10 pb-20 px-6 text-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #0E2A2F 0%, #133338 50%, #0E2A2F 100%)' }}>
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-5 -left-5 w-32 h-32 rounded-full bg-white/5 blur-xl" />

          <div className="relative inline-block">
            {/* Ring animation */}
            <div className={`absolute inset-0 rounded-full border-4 border-white/40 scale-110 ${isEditing ? "animate-pulse" : ""}`} />
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-200 flex items-center justify-center">
              {profileImage
                ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                : <User className="w-14 h-14 text-gray-400" />
              }
            </div>
            {isEditing ? (
              <button
                onClick={() => setShowPhotoOptions(true)}
                className="absolute -bottom-1 -right-1 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-[#0E2A2F]/30 hover:scale-110 transition-transform"
              >
                <Camera className="w-4 h-4 text-[#0E2A2F]" />
              </button>
            ) : (
              profileImage && (
                <button
                  onClick={() => setShowPhotoOptions(true)}
                  className="absolute -bottom-1 -right-1 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-200 hover:scale-110 transition-transform"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              )
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-bold text-white">{user?.fullName || "Your Name"}</h2>
            <p className="text-white/60 text-sm mt-0.5">{user?.email}</p>
            {user?.course && (
              <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                <BookOpen className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-semibold">{user.course} • {user?.branch || "No branch"}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Card Body (overlaps hero) ──────────────────────────────── */}
        <div className="-mt-10 mx-4 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">

          {/* ────── VIEW MODE ──────────────────────────────────────────── */}
          {!isEditing && (
            <div className="p-5 space-y-3">
              <SectionHeader title="Personal Info" />
              <InfoRow icon={User}    label="Full Name"       value={user?.fullName} accent />
              <InfoRow icon={Lock}    label="Email"           value={user?.email} />
              <InfoRow icon={Hash}    label="Registration No" value={user?.registrationNo} />
              <InfoRow icon={Phone}   label="Phone"           value={user?.phoneNumber ? `+91 ${user.phoneNumber}` : null} />

              <SectionHeader title="Academic Details" />
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={BookOpen}  label="Course"    value={user?.course} accent />
                <InfoRow icon={Layers}    label="Branch"    value={user?.branch} />
                <InfoRow icon={Calendar}  label="Semesters" value={user?.semester ? `${user.semester} Semesters` : null} accent />
                <InfoRow icon={Calendar}  label="Batch"     value={user?.yearBatch} />
              </div>

              <SectionHeader title="Commute" />
              <InfoRow icon={MapPin} label="Bus Stop" value={user?.busStop} accent />
            </div>
          )}

          {/* ────── EDIT MODE ──────────────────────────────────────────── */}
          {isEditing && (
            <div className="p-5 space-y-5">

              {/* Personal */}
              <SectionHeader title="Personal Info" />

              <StyledInput
                label="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                error={errors.fullName}
                icon={User}
              />

              <StyledInput
                label="Email Address"
                value={email}
                onChange={() => {}}
                placeholder="Email"
                icon={Lock}
                disabled
                readOnly
              />

              <StyledInput
                label="Registration Number"
                value={registrationNo}
                onChange={e => setRegNo(e.target.value)}
                placeholder="e.g. 2201001234"
                icon={Hash}
              />

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">Phone Number</label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={e => setCountryCode(e.target.value)}
                    className="w-24 appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl py-3.5 px-3 text-gray-900 dark:text-white text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all"
                  >
                    {countryCodes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex-1 relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(v);
                        if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="10-digit number"
                      className={`w-full bg-gray-50 dark:bg-gray-800 border rounded-2xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all
                        ${errors.phone
                          ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                          : "border-gray-200 dark:border-gray-700 focus:border-teal-400 focus:ring-teal-400/20"
                        }`}
                    />
                    {phone.length === 10 && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                </div>
                {errors.phone && <p className="text-xs text-red-500 dark:text-red-400 px-1 font-medium">{errors.phone}</p>}
                <p className="text-xs text-gray-400 px-1">{phone.length}/10 digits</p>
              </div>

              {/* Academic section */}
              <SectionHeader title="Academic Details" />

              <StyledSelect
                label="Course"
                value={course}
                onChange={handleCourseChange}
                options={[...courses]}
                placeholder="Select your course"
                icon={BookOpen}
              />

              <StyledSelect
                label="Branch"
                value={branchSelect}
                onChange={setBranchSelect}
                options={currentBranchOptions}
                placeholder={course ? "Select branch" : "Select a course first"}
                disabled={!course}
                icon={Layers}
              />

              {branchSelect === "Other" && (
                <StyledInput
                  label="Specify Branch"
                  value={branchText}
                  onChange={e => setBranchText(e.target.value)}
                  placeholder="Type your branch name"
                  icon={Layers}
                />
              )}

              {/* Semester & Year Dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <StyledSelect
                  label="Semester"
                  value={semester}
                  onChange={setSemester}
                  options={getSemesterOptions(course)}
                  placeholder={course ? "Select" : "Pick course"}
                  disabled={!course}
                  icon={Calendar}
                />
                <StyledSelect
                  label="Year"
                  value={yearBatch}
                  onChange={setYearBatch}
                  options={yearOptions}
                  placeholder="Select year"
                  icon={Calendar}
                />
              </div>

              {/* Commute */}
              <SectionHeader title="Commute" />

              <StyledSelect
                label="Boarding Bus Stop"
                value={busStop}
                onChange={setBusStop}
                options={busStops}
                placeholder="Select nearest stop"
                icon={MapPin}
              />

              {/* Save / Cancel Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setIsEditing(false); setErrors({}); }}
                  className="py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={validateAndSave}
                  className="py-3.5 rounded-2xl text-white font-bold shadow-lg shadow-[#0E2A2F]/30 hover:brightness-110 transition-all" style={{ background: '#0E2A2F' }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom CTA (view mode) ─────────────────────────────────── */}
        {!isEditing && (
          <div className="mx-4 mt-4">
            <button
              onClick={startEditing}
              className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg shadow-[#0E2A2F]/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2" style={{ background: '#0E2A2F' }}
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* ── Sheets & Modals ─────────────────────────────────────────── */}
      <PhotoSheet
        open={showPhotoOptions}
        onClose={() => setShowPhotoOptions(false)}
        onCamera={() => setShowCropOverlay(true)}
        onGallery={() => setShowCropOverlay(true)}
        onAvatar={() => setShowCropOverlay(true)}
        onDelete={handleDeletePhoto}
        hasPhoto={!!profileImage}
      />

      {showCropOverlay && (
        <CropOverlay
          onSave={handleImageSaved}
          onClose={() => setShowCropOverlay(false)}
        />
      )}
        </div>
      </AuthCard>
    </MobileLayout>
  );
};

export default Profile;
