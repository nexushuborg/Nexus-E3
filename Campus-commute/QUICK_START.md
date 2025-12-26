# 🚀 Campus Commute - Quick Start Reference

## ⚡ Start Development Server
```bash
cd /workspaces/campus-commute-connect-85
npm run dev
```
**Access at**: http://localhost:8080

## 📱 Test Account Creation

### Student Account
1. Navigate to `/student-role`
2. Click "Sign Up"
3. Enter details:
   - Name: John Doe
   - Batch: 2026
   - Email: student@gmail.com
4. Set password: `password123`
5. Verify OTP (auto-passes)
6. Select route
7. **Done!** Login with same credentials

### Driver Account
1. Navigate to `/driver-role`
2. Click "Sign Up"
3. Enter details:
   - Name: Mr. Kumar
   - Route: Route 1
   - Timing: 06:00 AM
   - Email: driver@gmail.com
4. Set password: `password456`
5. Verify OTP
6. **Done!** Login available

---

## 🎯 Key Features to Try

### Student Features
- ✨ Upload profile picture with crop tool
- 📍 View tracking map with route visualization
- 📋 Edit profile (branch, course, semester, etc.)
- 🚌 Call driver or conductor
- 🎨 Toggle dark mode
- 🔐 Change password

### Driver Features
- 📸 Upload profile picture
- 🚗 Enter bus number & license
- 🛣️ Select assigned route
- ⏰ Set timing
- 📞 View student info
- 🎨 Toggle dark mode

### Admin Features
- ➕ Add new routes
- ✏️ Edit existing routes
- 🗑️ Delete routes
- 🚌 Assign buses
- 👤 Assign drivers

---

## 📁 Important Files

### Core Pages
```
src/pages/
├── Login.tsx (Google/Apple login)
├── StudentRole.tsx (Home for students)
├── DriverRole.tsx (Home for drivers)
├── Profile.tsx (Student profile editor)
├── DriverProfile.tsx (Driver profile editor)
├── AdminPanel.tsx (Route management)
├── Settings.tsx (Dark mode & preferences)
└── Home.tsx (Student tracking map)
```

### New Components
```
src/components/
├── ImageUploadWithCrop.tsx (Profile pic crop tool)
└── AppSidebar.tsx (Role-based navigation)
```

### Contexts
```
src/contexts/
├── AuthContext.tsx (User & auth state)
└── ThemeContext.tsx (Dark mode support)
```

---

## 🔧 Useful Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📊 Data Storage

All data stored in browser localStorage:

```javascript
// View accounts
JSON.parse(localStorage.getItem('campus-commute-accounts'))

// View routes
JSON.parse(localStorage.getItem('adminRoutes'))

// View theme
localStorage.getItem('campus-commute-theme')
```

### Clear All Data
```javascript
localStorage.clear()
```

---

## 🎨 Customize Theme

Dark mode color scheme:
```css
/* Light mode colors */
@apply bg-white text-black

/* Dark mode colors */
@apply dark:bg-slate-950 dark:text-white
```

Located in: `tailwind.config.ts`

---

## 🐛 Troubleshooting

### Port 8080 already in use?
```bash
# Kill process on port 8080
lsof -i :8080
kill -9 <PID>
```

### Clear browser cache
1. Open DevTools (F12)
2. Application → Local Storage
3. Select domain → Delete all entries
4. Reload page

### Reset to defaults
```javascript
localStorage.clear()
location.reload()
```

---

## 📋 Component Usage

### ImageUploadWithCrop
```tsx
import ImageUploadWithCrop from "@/components/ImageUploadWithCrop";

<ImageUploadWithCrop
  onImageSave={(imageData) => console.log(imageData)}
  onClose={() => setShowUpload(false)}
  title="Upload Profile Picture"
/>
```

### Dark Mode Toggle
```tsx
import { useTheme } from "@/contexts/ThemeContext";

const { theme, toggleTheme } = useTheme();

<button onClick={toggleTheme}>
  Toggle {theme === "light" ? "Dark" : "Light"} Mode
</button>
```

### User Data Access
```tsx
import { useAuth } from "@/contexts/AuthContext";

const { user, updateUser } = useAuth();

// Access user data
console.log(user?.email, user?.role);

// Update user data
updateUser({ phoneNumber: "9876543210" });
```

---

## 🔐 Default Test Credentials

After creating accounts:

```
Student Email: student@gmail.com
Student Password: password123

Driver Email: driver@gmail.com
Driver Password: password456
```

---

## 📱 Mobile Testing

### Chrome DevTools
1. Press F12
2. Click device icon (⌘⇧M)
3. Select "iPhone 12 Pro" (375px)
4. Test touch interactions

### Responsive Sizes
- Mobile: 375px - 500px
- Tablet: 500px - 1200px
- Desktop: 1200px+

---

## 🚀 Deploy to Production

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Build First
```bash
npm run build
# Creates 'dist' folder
```

---

## 📚 Documentation Files

1. **ENHANCEMENT_SUMMARY.md** - All features overview
2. **SETUP_GUIDE.md** - Detailed setup instructions
3. **DATA_SCHEMA.md** - Data structure & validation
4. **COMPLETION_CHECKLIST.md** - Feature checklist
5. **README.md** - Project overview

---

## ✅ Pre-Deployment Checklist

- [ ] Test all authentication flows
- [ ] Test student profile editing
- [ ] Test driver profile editing
- [ ] Test admin route management
- [ ] Test dark mode toggle
- [ ] Test image crop feature
- [ ] Test all navigation links
- [ ] Check console for errors
- [ ] Test on mobile device
- [ ] Clear localStorage and test fresh

---

## 🎯 Common Tasks

### Add New Route (Admin)
1. Open `/admin-panel`
2. Click "Add New Route"
3. Enter route details
4. Click "Add Route"
5. Route appears in student selection

### Edit Student Profile
1. Login as student
2. Click Profile in sidebar
3. Click "Edit Profile"
4. Update fields
5. Upload photo if desired
6. Click "Save Changes"

### Change Password
1. Open Settings
2. Click "Change Password"
3. Enter old and new password
4. Confirm changes

### Enable Dark Mode
1. Open Settings
2. Toggle "Dark Mode"
3. Entire app switches theme
4. Preference saved automatically

---

## 🆘 Need Help?

Check these files in order:
1. SETUP_GUIDE.md - Setup & installation
2. DATA_SCHEMA.md - Data structure
3. ENHANCEMENT_SUMMARY.md - Features list
4. COMPLETION_CHECKLIST.md - What's implemented

---

**Version**: 1.0.0  
**Last Updated**: December 24, 2025  
**Status**: ✅ Production Ready
