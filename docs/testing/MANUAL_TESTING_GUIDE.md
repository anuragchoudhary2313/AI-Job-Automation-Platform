# Manual Testing Guide: Resume Upload/Download/Delete

## Prerequisites

✅ **Backend Running**: `http://localhost:8000`  
✅ **Frontend Running**: `http://localhost:5173`  
✅ **Database**: PostgreSQL running  
✅ **Test File**: PDF resume ready (max 10MB)

---

## Test 1: User Registration & Login

### Steps:
1. Open browser to `http://localhost:5173`
2. Click "Create account" or navigate to `/register`
3. Fill in registration form:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
4. Click "Create Account"

### Expected Results:
- ✅ Success toast: "Account created successfully! Please log in."
- ✅ Redirected to `/login`
- ✅ Backend creates user in database

### Verification:
```bash
# Check backend logs for:
# "User {id} registered successfully"
```

---

## Test 2: Login

### Steps:
1. On login page, enter:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
2. Click "Sign In"

### Expected Results:
- ✅ Success toast: "Welcome back! Logged in successfully."
- ✅ Redirected to `/dashboard`
- ✅ Tokens stored in localStorage
- ✅ User data loaded in auth context

### Verification:
```javascript
// Open browser console (F12)
console.log('Access Token:', localStorage.getItem('access_token'));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
// Should see JWT tokens
```

---

## Test 3: Resume Upload

### Steps:
1. Navigate to `/resumes` (click "Resumes" in sidebar)
2. Prepare a test PDF file (any PDF, max 10MB)
3. **Method A - Drag & Drop**:
   - Drag PDF file onto upload area
   - Drop file
4. **Method B - Click Upload**:
   - Click "Upload Resume" button
   - Select PDF file from file picker
   - Click "Open"

### Expected Results:
- ✅ Upload progress indicator appears
- ✅ Progress bar animates (0% → 100%)
- ✅ Success toast: "Resume uploaded successfully"
- ✅ New resume card appears in grid
- ✅ Resume shows filename and upload date

### Verification:
```bash
# Check backend logs for:
# "Resume uploaded: {filename}"

# Check file system:
# uploads/team_{team_id}/resumes/{filename}.pdf should exist

# Check database:
# SELECT * FROM resumes WHERE user_id = {your_user_id};
```

### Common Issues:
- ❌ "File type not supported" → Only PDF files allowed
- ❌ "File too large" → Max 10MB limit
- ❌ 401 Unauthorized → Token expired, refresh page

---

## Test 4: Resume List/Display

### Steps:
1. Stay on `/resumes` page
2. Observe resume cards

### Expected Results:
- ✅ All uploaded resumes displayed as cards
- ✅ Each card shows:
  - PDF icon
  - Filename
  - Upload date (e.g., "2 minutes ago")
- ✅ Hover over card shows action buttons

### Verification:
```javascript
// Open browser console
// Check network tab for:
// GET /api/v1/resumes → 200 OK
// Response should be array of resume objects
```

---

## Test 5: Resume Download

### Steps:
1. Hover over a resume card
2. Click the **Download** button (download icon)

### Expected Results:
- ✅ Browser download starts immediately
- ✅ File downloads with correct filename
- ✅ Downloaded file is valid PDF
- ✅ Can open downloaded PDF

### Verification:
```javascript
// Check network tab:
// GET /api/v1/resumes/{id}/download → 200 OK
// Response type: application/pdf
// Content-Disposition: attachment; filename="..."
```

### Common Issues:
- ❌ Download fails → Check file exists on server
- ❌ Corrupted PDF → Check file storage integrity

---

## Test 6: Resume Delete

### Steps:
1. Hover over a resume card
2. Click the **Delete** button (trash icon)
3. Confirm deletion (if confirmation dialog appears)

### Expected Results:
- ✅ Resume card disappears from grid
- ✅ Success toast: "Resume deleted successfully"
- ✅ File removed from server
- ✅ Database record deleted

### Verification:
```bash
# Check backend logs for:
# "Resume deleted: {id}"

# Check file system:
# File should be deleted from uploads/team_{team_id}/resumes/

# Check database:
# SELECT * FROM resumes WHERE id = {deleted_id};
# Should return no results
```

---

## Test 7: Multiple File Upload

### Steps:
1. Upload 3-5 different PDF files
2. Observe behavior

### Expected Results:
- ✅ Each upload completes successfully
- ✅ All files appear in grid
- ✅ No duplicate uploads
- ✅ Files stored with unique names

---

## Test 8: Error Handling

### Test 8A: Upload Non-PDF File
1. Try to upload `.docx`, `.txt`, or image file

**Expected**: ❌ Error toast: "Only PDF files are allowed"

### Test 8B: Upload Large File
1. Try to upload PDF > 10MB

**Expected**: ❌ Error toast: "File size exceeds 10MB limit"

### Test 8C: Network Error
1. Stop backend server
2. Try to upload file

**Expected**: ❌ Error toast: "Network error. Please try again."

### Test 8D: Unauthorized Access
1. Clear localStorage tokens:
   ```javascript
   localStorage.clear();
   ```
2. Try to upload file

**Expected**: ✅ Redirected to `/login`

---

## Test 9: Authentication Flow

### Test Token Refresh
1. Login successfully
2. Wait 30+ minutes (or manually expire token)
3. Try to download a resume

**Expected**:
- ✅ First request fails with 401
- ✅ Token refresh happens automatically
- ✅ Download retries and succeeds
- ✅ No visible error to user

### Test Logout
1. Click user menu → Logout
2. Try to access `/resumes`

**Expected**:
- ✅ Redirected to `/login`
- ✅ Tokens cleared from localStorage

---

## Test 10: UI/UX Verification

### Visual Checks:
- ✅ Upload area has drag-and-drop styling
- ✅ Progress bar animates smoothly
- ✅ Resume cards have hover effects
- ✅ Action buttons appear on hover
- ✅ Loading states show during operations
- ✅ Toast notifications appear and dismiss

### Responsive Design:
1. Resize browser window
2. Test on mobile viewport (DevTools)

**Expected**:
- ✅ Grid adjusts to screen size
- ✅ Upload area remains usable
- ✅ Buttons remain accessible

---

## API Endpoint Testing (Alternative)

If UI testing is blocked, test APIs directly:

### Upload Resume
```bash
# Get access token first
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=TestPassword123!"

# Use token to upload
curl -X POST http://localhost:8000/api/v1/resumes/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/resume.pdf"
```

### List Resumes
```bash
curl -X GET http://localhost:8000/api/v1/resumes \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Download Resume
```bash
curl -X GET http://localhost:8000/api/v1/resumes/1/download \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  --output downloaded_resume.pdf
```

### Delete Resume
```bash
curl -X DELETE http://localhost:8000/api/v1/resumes/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Tokens stored in localStorage
- [ ] Resume upload (drag & drop)
- [ ] Resume upload (file picker)
- [ ] Upload progress indicator
- [ ] Resume list displays correctly
- [ ] Resume download works
- [ ] Downloaded PDF is valid
- [ ] Resume delete works
- [ ] File removed from server
- [ ] Multiple uploads work
- [ ] Non-PDF file rejected
- [ ] Large file rejected
- [ ] Network error handled
- [ ] Unauthorized access redirects
- [ ] Token refresh works
- [ ] Logout clears tokens
- [ ] UI animations smooth
- [ ] Responsive design works

---

## Known Issues

1. **Browser Environment Issue**: Automated Playwright tests blocked by `$HOME` environment variable not set
2. **Workaround**: Manual testing required

---

## Success Criteria

✅ All checklist items pass  
✅ No console errors  
✅ No network errors (except intentional tests)  
✅ Files stored correctly on server  
✅ Database records accurate  
✅ Authentication flow seamless  

---

## Next Steps After Testing

1. Document any bugs found
2. Fix critical issues
3. Create automated tests when Playwright env fixed
4. Add integration tests for file operations
5. Consider adding file preview feature

---

**Test Date**: ___________  
**Tester**: ___________  
**Result**: ⬜ PASS / ⬜ FAIL  
**Notes**: ___________
