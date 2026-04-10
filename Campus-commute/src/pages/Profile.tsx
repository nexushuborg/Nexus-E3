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
import BackButton from "@/components/BackButton";

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
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <span className="font-bold text-gray-900 dark:text-white">Adjust Photo</span>
          <button
            onClick={handleSave}
            disabled={!image}
            className="text-primary font-bold text-sm disabled:opacity-40"
          >
            Save
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex justify-center">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-primary bg-gray-100 flex items-center justify-center">
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
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-primary text-primary font-semibold hover:bg-primary/10 transition-colors"
            >
              Choose Image
            </button>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Zoom</span>
                  <span>{(scale * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-gray-500" />
                  <input
                    type="range" min="0.5" max="3" step="0.05" value={scale}
                    onChange={e => setScale(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <ZoomIn className="w-4 h-4 text-gray-500" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Rotation</span>
                  <span>{rotation}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="0" max="360" step="15" value={rotation}
                    onChange={e => setRotation(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <button
                    onClick={() => setRotation(r => (r + 90) % 360)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                  >
                    <RotateCw className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <button
                onClick={triggerInput}
                className="w-full py-2.5 rounded-2xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
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

// ─── Info Card (matches DriverInfo) ──────────────────────────────────────────

const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined; }) => (
  <div className="bg-muted rounded-2xl p-4">
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value || <span className="italic font-normal opacity-50">Not set</span>}</p>
      </div>
    </div>
  </div>
);

// ─── Styled Inputs for Edit Mode ──────────────────────────────────────────

const StyledInput = ({ label, value, onChange, placeholder, error, disabled = false, icon: Icon, type = "text" }: any) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm text-muted-foreground ml-1">{label}</label>}
    <div className="relative border border-border/50 bg-muted/30 focus-within:border-primary/50 focus-within:bg-muted/50 rounded-xl transition-all">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-transparent py-3 text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50
          ${Icon ? "pl-10 pr-4" : "px-4"}`}
      />
    </div>
    {error && <p className="text-xs text-red-500 px-1">{error}</p>}
  </div>
);

const StyledSelect = ({ label, value, onChange, options, placeholder = "Select…", disabled = false, icon: Icon }: any) => (
  <div className="space-y-1.5">
    {label && <label className="block text-sm text-muted-foreground ml-1">{label}</label>}
    <div className="relative border border-border/50 bg-muted/30 focus-within:border-primary/50 focus-within:bg-muted/50 rounded-xl transition-all">
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full appearance-none bg-transparent py-3 pr-10 text-foreground focus:outline-none disabled:opacity-50
          ${Icon ? "pl-10" : "px-4"}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o: string) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
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
    toast({ title: "Profile Updated", description: "Your changes have been saved." });
  };

  const handleImageSaved = (img: string) => {
    setProfileImage(img);
    setShowCropOverlay(false);
    toast({ title: "Photo Updated" });
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
      <AuthCard className="max-h-[95vh] overflow-y-auto flex flex-col p-6 sm:p-8 my-auto">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            {isEditing ? (
              <button onClick={() => setIsEditing(false)} className="w-10 h-10 flex items-center justify-center bg-muted rounded-full">
                <X className="w-5 h-5 text-foreground" />
              </button>
            ) : (
              <BackButton to="/home" />
            )}
            <h1 className="text-xl font-bold text-foreground">
              {isEditing ? "Edit Profile" : "My Profile"}
            </h1>
            {!isEditing ? (
              <button onClick={startEditing} className="text-primary font-semibold text-sm">
                Edit
              </button>
            ) : (
              <button onClick={validateAndSave} className="text-primary font-bold text-sm">
                Save
              </button>
            )}
          </div>

          <div className="flex-1">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                {isEditing ? (
                  <button
                    onClick={() => setShowPhotoOptions(true)}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-background hover:scale-110 transition-transform"
                  >
                    <Camera className="w-4 h-4 text-primary-foreground" />
                  </button>
                ) : (
                  profileImage && (
                    <button
                      onClick={() => setShowPhotoOptions(true)}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-muted rounded-full flex items-center justify-center shadow-lg border-2 border-background hover:scale-110 transition-transform"
                    >
                      <Edit2 className="w-4 h-4 text-foreground" />
                    </button>
                  )
                )}
              </div>
            </div>

            {/* View Mode Fields */}
            {!isEditing && (
              <div className="space-y-4">
                <InfoCard icon={<User className="w-5 h-5 text-primary" />} label="Full Name" value={user?.fullName} />
                <InfoCard icon={<Lock className="w-5 h-5 text-primary" />} label="Email Address" value={user?.email} />
                
                {/* Expand Registration No, Phone, Academic Data in the same styling format */}
                {user?.role === "student" && (
                  <>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2 ml-1">Academic</h3>
                    <InfoCard icon={<Hash className="w-5 h-5 text-primary" />} label="Registration No." value={user?.registrationNo} />
                    <InfoCard icon={<Phone className="w-5 h-5 text-primary" />} label="Phone" value={user?.phoneNumber ? `+91 ${user.phoneNumber}` : null} />
                    <InfoCard icon={<BookOpen className="w-5 h-5 text-primary" />} label="Course & Branch" value={user?.course ? `${user.course} - ${user.branch || 'General'}` : null} />
                    <InfoCard icon={<Calendar className="w-5 h-5 text-primary" />} label="Semester & Batch" value={user?.yearBatch ? `${user.semester || '-'} • Batch ${user.yearBatch}` : null} />
                    
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-6 mb-2 ml-1">Commute Details</h3>
                    <InfoCard icon={<MapPin className="w-5 h-5 text-primary" />} label="Boarding Stop" value={user?.busStop} />
                  </>
                )}
              </div>
            )}

            {/* Edit Mode Fields */}
            {isEditing && (
              <div className="space-y-5">
                <StyledInput label="Full Name" value={fullName} onChange={(e: any) => setFullName(e.target.value)} icon={User} error={errors.fullName} />
                <StyledInput label="Email Address" value={email} disabled icon={Lock} />
                <StyledInput label="Registration Number" value={registrationNo} onChange={(e: any) => setRegNo(e.target.value)} icon={Hash} />
                
                <div className="space-y-1.5">
                  <label className="block text-sm text-muted-foreground ml-1">Phone Number</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      className="w-24 appearance-none bg-muted/30 border border-border/50 rounded-xl py-3 px-3 text-foreground"
                    >
                      {countryCodes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex-1 relative border border-border/50 bg-muted/30 focus-within:border-primary/50 focus-within:bg-muted/50 rounded-xl transition-all">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setPhone(v);
                          if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                        }}
                        className="w-full bg-transparent py-3 pl-10 pr-4 focus:outline-none"
                      />
                    </div>
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 px-1">{errors.phone}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <StyledSelect label="Course" value={course} onChange={handleCourseChange} options={[...courses]} placeholder="Select" icon={BookOpen} />
                  <StyledSelect label="Branch" value={branchSelect} onChange={setBranchSelect} options={currentBranchOptions} placeholder="Select" disabled={!course} icon={Layers} />
                </div>
                
                {branchSelect === "Other" && (
                   <StyledInput label="Specify Branch" value={branchText} onChange={(e: any) => setBranchText(e.target.value)} icon={Layers} />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <StyledSelect label="Semester" value={semester} onChange={setSemester} options={getSemesterOptions(course)} placeholder="Select" disabled={!course} icon={Calendar} />
                  <StyledSelect label="Year Batch" value={yearBatch} onChange={setYearBatch} options={yearOptions} placeholder="Select" icon={Calendar} />
                </div>

                <StyledSelect label="Boarding Bus Stop" value={busStop} onChange={setBusStop} options={busStops} placeholder="Select stop" icon={MapPin} />

                <button
                  onClick={validateAndSave}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold uppercase tracking-wider mt-4 hover:opacity-90 transition-opacity"
                >
                  Save Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </AuthCard>

      {/* Sheets & Modals */}
      <PhotoSheet
        open={showPhotoOptions}
        onClose={() => setShowPhotoOptions(false)}
        onCamera={() => setShowCropOverlay(true)}
        onGallery={() => setShowCropOverlay(true)}
        onAvatar={() => setShowCropOverlay(true)}
        onDelete={handleDeletePhoto}
        hasPhoto={!!profileImage}
      />
      {showCropOverlay && <CropOverlay onSave={handleImageSaved} onClose={() => setShowCropOverlay(false)} />}
    </MobileLayout>
  );
};

export default Profile;

