import { useState } from "react";
import { User, Edit2 } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import FormInput from "@/components/FormInput";
import GradientButton from "@/components/GradientButton";
import BackButton from "@/components/BackButton";
import ImageUploadWithCrop from "@/components/ImageUploadWithCrop";
import PhotoViewer from "@/components/PhotoViewer";
import PhotoOptionsSheet from "@/components/PhotoOptionsSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import busRoutes from "@/data/busRoutes";

const phoneSchema = z.string().regex(/^\d{10}$/, "Phone number must be 10 digits");
const licenseSchema = z.string().min(1, "License ID is required");
const busSchema = z.string().min(1, "Bus number is required");

const DriverProfile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [busNumber, setBusNumber] = useState(user?.busNumber || "");
  const [selectedRouteNumber, setSelectedRouteNumber] = useState(user?.selectedRoute || ""); // This will store busNumber
  const [timing, setTiming] = useState(user?.timing || "");
  const [licenseId, setLicenseId] = useState(user?.licenseId || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [conductorName, setConductorName] = useState(user?.conductorName || "");
  const [conductorPhone, setConductorPhone] = useState(user?.conductorPhone || "");
  const [errors, setErrors] = useState<{
    phone?: string;
    busNumber?: string;
    licenseId?: string;
    conductorPhone?: string;
  }>({});

  const currentAssignedRoute = busRoutes.find(route => route.busNumber === selectedRouteNumber);

  const handleSave = () => {
    const newErrors: { phone?: string; busNumber?: string; licenseId?: string, conductorPhone?: string } = {};

    if (phone) {
      try {
        phoneSchema.parse(phone.replace(/\D/g, ""));
      } catch (err) {
        if (err instanceof z.ZodError) {
          newErrors.phone = err.errors[0]?.message;
        }
      }
    }
    
    if (conductorPhone) {
      try {
        phoneSchema.parse(conductorPhone.replace(/\D/g, ""));
      } catch (err) {
        if (err instanceof z.ZodError) {
          newErrors.conductorPhone = err.errors[0]?.message;
        }
      }
    }

    try {
      busSchema.parse(busNumber);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.busNumber = err.errors[0]?.message;
      }
    }

    try {
      licenseSchema.parse(licenseId);
    } catch (err) {
      if (err instanceof z.ZodError) {
        newErrors.licenseId = err.errors[0]?.message;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateUser({
      phoneNumber: phone,
      busNumber,
      selectedRoute: selectedRouteNumber, // Save the busNumber as selectedRoute
      timing: currentAssignedRoute?.classTime, // Save the timing from the selected route
      licenseId,
      profileImage,
      conductorName,
      conductorPhone,
    });
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated",
    });
  };

  const handleImageSelected = (imageData: string) => {
    setProfileImage(imageData);
    setShowImageUpload(false);
    toast({
      title: "Picture Updated",
      description: "Your profile picture has been updated",
    });
  };

  const handleDeletePhoto = () => {
    setProfileImage("");
    updateUser({ profileImage: "" });
    toast({
      title: "Photo Deleted",
      description: "Your profile picture has been removed",
    });
  };

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-screen px-8 py-6">
        <BackButton to="/driver-home" />

        <div className="flex-1 pt-8">
          <h1 className="text-2xl font-bold text-foreground text-center mb-8">
            Profile
          </h1>

          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <button 
                onClick={() => profileImage && setShowPhotoViewer(true)}
                className={`w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden ${profileImage ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={() => setShowPhotoOptions(true)}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
              >
                <Edit2 className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4 pb-6">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Full Name (Non-editable)
                </label>
                <div className="bg-muted rounded-2xl p-4 text-foreground opacity-60">
                  {fullName}
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Email (Non-editable)
                </label>
                <div className="bg-muted rounded-2xl p-4 text-foreground opacity-60">
                  {email}
                </div>
              </div>

              <FormInput
                label="Phone Number"
                placeholder="10-digit phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                error={errors.phone}
              />

              <FormInput
                label="Bus Number"
                placeholder="e.g., TN 01 AB 1234"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                error={errors.busNumber}
              />

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Route Number
                </label>
                <select
                  value={selectedRouteNumber}
                  onChange={(e) => setSelectedRouteNumber(e.target.value)}
                  className="w-full bg-background border-2 border-muted rounded-2xl p-3 text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Select Route</option>
                  {busRoutes.map((route) => (
                    <option key={route.busNumber} value={route.busNumber}>
                      {route.routeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Timing (From Route)
                </label>
                <div className="w-full bg-muted rounded-2xl p-3 text-foreground opacity-60">
                  {currentAssignedRoute?.classTime || "N/A"}
                </div>
              </div>

              <FormInput
                label="Driver License ID"
                placeholder="e.g., DL0020050000123456"
                value={licenseId}
                onChange={(e) => setLicenseId(e.target.value)}
                error={errors.licenseId}
              />
              
              <FormInput
                label="Conductor Name"
                placeholder="Enter conductor's name"
                value={conductorName}
                onChange={(e) => setConductorName(e.target.value)}
              />

              <FormInput
                label="Conductor Phone Number"
                placeholder="10-digit phone number"
                value={conductorPhone}
                onChange={(e) => setConductorPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                error={errors.conductorPhone}
              />

              <div className="pt-4">
                <GradientButton onClick={handleSave}>Save Changes</GradientButton>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              <div className="bg-muted rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                <p className="text-foreground font-medium">{user?.fullName}</p>
              </div>
              <div className="bg-muted rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="text-foreground font-medium">{user?.email}</p>
              </div>
              {phone && (
                <div className="bg-muted rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                  <p className="text-foreground font-medium">{phone}</p>
                </div>
              )}
              {busNumber && (
                <div className="bg-muted rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Bus Number</p>
                  <p className="text-foreground font-medium">{busNumber}</p>
                </div>
              )}
              {currentAssignedRoute && (
                <div className="bg-muted rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Route</p>
                  <p className="text-foreground font-medium">
                    {currentAssignedRoute.routeName}
                  </p>
                </div>
              )}
              {currentAssignedRoute?.classTime && (
                <div className="bg-muted rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Timing</p>
                  <p className="text-foreground font-medium">{currentAssignedRoute.classTime}</p>
                </div>
              )}
              {licenseId && (
                <div className="bg-muted rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">License ID</p>
                  <p className="text-foreground font-medium">{licenseId}</p>
                </div>
              )}
              {conductorName && (
                <div className="bg-muted rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Conductor Name</p>
                  <p className="text-foreground font-medium">{conductorName}</p>
                </div>
              )}
              {conductorPhone && (
                <div className="bg-muted rounded-2xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Conductor Phone</p>
                  <p className="text-foreground font-medium">{conductorPhone}</p>
                </div>
              )}
              <div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-4 px-8 rounded-full font-medium text-lg border-2 border-primary text-primary hover:bg-primary/10 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Viewer Modal */}
      <PhotoViewer imageUrl={profileImage} open={showPhotoViewer} onClose={() => setShowPhotoViewer(false)} />

      {/* Photo Options Sheet */}
      <PhotoOptionsSheet
        open={showPhotoOptions}
        onClose={() => setShowPhotoOptions(false)}
        onCamera={() => setShowImageUpload(true)}
        onGallery={() => setShowImageUpload(true)}
        onAvatar={() => setShowImageUpload(true)}
        onDelete={handleDeletePhoto}
        hasPhoto={!!profileImage}
      />

      {showImageUpload && (
        <ImageUploadWithCrop
          onImageSave={handleImageSelected}
          onClose={() => setShowImageUpload(false)}
        />
      )}
    </MobileLayout>
  );
};

export default DriverProfile;
