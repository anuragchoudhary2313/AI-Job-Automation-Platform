# Manual Testing Guide: AI Resume Generation (PDF)

## Prerequisites

✅ **Backend Running**: `http://localhost:8000`  
✅ **Frontend Running**: `http://localhost:5173`  
✅ **OpenAI API Key**: Set in backend `.env`  
✅ **User Logged In**: Valid authentication token  
⚠️ **Feature Flag**: `FEATURE_AI_RESUME=true` in backend config

---

## Environment Setup Verification

### Check OpenAI API Key

```bash
# In backend directory
grep OPENAI_API_KEY .env
# Should show: OPENAI_API_KEY=sk-...
```

### Check Feature Flag

```bash
# In backend directory
grep FEATURE_AI_RESUME .env
# Should show: FEATURE_AI_RESUME=true (or not present, defaults to true)
```

### Verify Backend Endpoint

```bash
curl http://localhost:8000/api/v1/features/ai_resume
# Should return: {"enabled": true, "feature": "ai_resume"}
```

---

## Test 1: Access Resume Generator

### Steps:
1. Login to application at `http://localhost:5173/login`
2. Navigate to `/resumes` page
3. Look for "Resume Generator" section or tab
4. Verify the form is visible

### Expected Results:
- ✅ Resume Generator component loads
- ✅ Form fields are visible:
  - Job Title
  - Company
  - Responsibilities (textarea)
  - Achievements (textarea)
  - Skills (textarea)
- ✅ "Generate Resume" button is enabled
- ✅ No errors in console

### Verification:
```javascript
// Browser console
// Check if component mounted
document.querySelector('[class*="ResumeGenerator"]') !== null
```

---

## Test 2: Generate Resume with Valid Data

### Steps:
1. Fill in the form with sample data:

   **Job Title**: `Senior Software Engineer`
   
   **Company**: `Tech Corp`
   
   **Responsibilities**:
   ```
   - Led development of microservices architecture
   - Managed team of 5 developers
   - Implemented CI/CD pipelines
   - Conducted code reviews and mentoring
   ```
   
   **Achievements**:
   ```
   - Reduced deployment time by 60%
   - Improved system performance by 40%
   - Successfully delivered 3 major projects on time
   - Received Employee of the Year award
   ```
   
   **Skills**:
   ```
   Python, JavaScript, React, Node.js, Docker, Kubernetes, AWS, PostgreSQL, Redis, Git
   ```

2. Click "Generate Resume" button

### Expected Results:
- ✅ Button shows loading state ("Generating...")
- ✅ Button is disabled during generation
- ✅ Loading spinner appears
- ✅ Generation takes 10-30 seconds
- ✅ Success toast appears: "Resume generated successfully!"
- ✅ PDF file downloads automatically OR
- ✅ New resume appears in resume list

### Verification:
```javascript
// Check network tab in browser DevTools
// POST /api/v1/ai/resume/bullets
// Status: 200 OK
// Response: { "file_path": "...", "resume_id": ... }
```

### Backend Logs:
```bash
# Should see:
# "Generating resume for job: Senior Software Engineer"
# "Resume generated successfully: {file_path}"
```

---

## Test 3: Verify Generated PDF

### Steps:
1. Locate the downloaded/generated PDF
2. Open the PDF file

### Expected Results:
- ✅ PDF opens without errors
- ✅ PDF contains formatted resume content
- ✅ Job title is prominent
- ✅ Company name is visible
- ✅ Responsibilities are bullet-pointed
- ✅ Achievements are highlighted
- ✅ Skills are listed
- ✅ Professional formatting (not plain text)
- ✅ LaTeX-style formatting (if using LaTeX backend)

### Quality Checks:
- ✅ No spelling errors
- ✅ Proper grammar
- ✅ Professional language
- ✅ Logical structure
- ✅ Readable fonts
- ✅ Appropriate spacing

---

## Test 4: Error Handling - Missing OpenAI Key

### Steps:
1. Stop backend
2. Remove or comment out `OPENAI_API_KEY` in `.env`
3. Restart backend
4. Try to generate resume

### Expected Results:
- ❌ Error toast: "AI service unavailable" or similar
- ❌ HTTP 500 or 503 error
- ✅ User-friendly error message
- ✅ No application crash

### Verification:
```bash
# Backend logs should show:
# "OpenAI API key not configured"
# or similar error message
```

---

## Test 5: Error Handling - Invalid Input

### Test 5A: Empty Fields
1. Leave all fields empty
2. Click "Generate Resume"

**Expected**: ❌ Validation error: "Please fill in all required fields"

### Test 5B: Very Short Input
1. Enter minimal data:
   - Job Title: `Dev`
   - Company: `Co`
   - Responsibilities: `Code`
   - Achievements: `Good`
   - Skills: `JS`
2. Click "Generate Resume"

**Expected**: ⚠️ May generate, but warn about quality OR reject with validation error

### Test 5C: Very Long Input
1. Enter extremely long text (>5000 characters) in each field
2. Click "Generate Resume"

**Expected**: ⚠️ May truncate or show warning about token limits

---

## Test 6: Network Error Handling

### Steps:
1. Fill in valid data
2. Disconnect from internet OR stop backend
3. Click "Generate Resume"

### Expected Results:
- ❌ Error toast: "Network error. Please try again."
- ✅ Button returns to normal state
- ✅ Form data is preserved
- ✅ User can retry

---

## Test 7: Concurrent Generation

### Steps:
1. Fill in form data
2. Click "Generate Resume"
3. Immediately click again (before first completes)

### Expected Results:
- ✅ Button disabled after first click
- ✅ Second click ignored
- ✅ Only one generation request sent
- ✅ No duplicate PDFs created

---

## Test 8: Multiple Generations

### Steps:
1. Generate resume with data set A
2. Wait for completion
3. Change form data to set B
4. Generate again
5. Repeat 2-3 times

### Expected Results:
- ✅ Each generation completes successfully
- ✅ Multiple PDFs created
- ✅ Each PDF has unique content
- ✅ No interference between generations

---

## Test 9: Resume Appears in List

### Steps:
1. Generate a resume
2. Navigate to resume list (if not already there)
3. Refresh page

### Expected Results:
- ✅ Generated resume appears in list
- ✅ Correct filename shown
- ✅ Recent timestamp ("just now" or "1 minute ago")
- ✅ Can download generated resume
- ✅ Can delete generated resume

---

## Test 10: AI Quality Verification

### Steps:
1. Generate resume with realistic data
2. Review AI-generated content

### Quality Metrics:
- ✅ **Relevance**: Content matches input
- ✅ **Enhancement**: AI improves wording
- ✅ **Professionalism**: Business-appropriate language
- ✅ **Accuracy**: No hallucinated information
- ✅ **Formatting**: Proper structure
- ✅ **Completeness**: All sections included

### Red Flags:
- ❌ Completely unrelated content
- ❌ Inappropriate language
- ❌ Fabricated details not in input
- ❌ Broken formatting
- ❌ Missing sections

---

## API Testing (Alternative Method)

If UI testing is blocked, test API directly:

### Get Access Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=TestPassword123!"
```

### Generate Resume
```bash
curl -X POST http://localhost:8000/api/v1/ai/resume/bullets \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Senior Software Engineer",
    "company": "Tech Corp",
    "responsibilities": "Led development of microservices\nManaged team of 5 developers",
    "achievements": "Reduced deployment time by 60%\nImproved performance by 40%",
    "skills": "Python, JavaScript, React, Docker, AWS"
  }'
```

### Expected Response
```json
{
  "file_path": "uploads/team_1/resumes/resume_123.pdf",
  "resume_id": 123
}
```

### Download Generated PDF
```bash
curl -X GET http://localhost:8000/api/v1/resumes/123/download \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  --output generated_resume.pdf
```

---

## Performance Testing

### Test Generation Time

| Input Size | Expected Time | Acceptable Range |
|------------|---------------|------------------|
| Minimal (50 words) | 10-15 seconds | 5-20 seconds |
| Medium (200 words) | 15-25 seconds | 10-30 seconds |
| Large (500 words) | 20-30 seconds | 15-40 seconds |

### Monitor:
```javascript
// Browser console
console.time('resume-generation');
// Click generate
// Wait for completion
console.timeEnd('resume-generation');
```

---

## Backend Configuration Check

### Verify AI Service Configuration

```python
# In backend, check config
from app.core.config import settings

print(f"OpenAI Key Set: {bool(settings.OPENAI_API_KEY)}")
print(f"Use Local AI: {settings.USE_LOCAL_AI}")
print(f"Feature Enabled: {settings.FEATURE_AI_RESUME}")
```

### Check LaTeX Installation (if using LaTeX)

```bash
# Check if pdflatex is available
which pdflatex
# or on Windows
where pdflatex

# Test LaTeX compilation
echo '\documentclass{article}\begin{document}Hello\end{document}' > test.tex
pdflatex test.tex
# Should create test.pdf
```

---

## Troubleshooting

### Issue: "AI service unavailable"
**Solution**: 
1. Check `OPENAI_API_KEY` is set
2. Verify API key is valid
3. Check OpenAI API status
4. Review backend logs for specific error

### Issue: Generation takes too long (>60s)
**Solution**:
1. Check internet connection
2. Verify OpenAI API is responsive
3. Check backend server resources
4. Review input size (may be too large)

### Issue: PDF is corrupted or won't open
**Solution**:
1. Check LaTeX installation (if using LaTeX)
2. Verify file permissions on uploads directory
3. Check disk space
4. Review backend logs for generation errors

### Issue: Generated content is poor quality
**Solution**:
1. Improve input data quality
2. Add more specific details
3. Use professional language in input
4. Check OpenAI model version/settings

### Issue: "Feature disabled" error
**Solution**:
```bash
# Set in backend/.env
FEATURE_AI_RESUME=true
# Restart backend
```

---

## Testing Checklist

- [ ] OpenAI API key configured
- [ ] Feature flag enabled
- [ ] Resume generator form loads
- [ ] Can fill in all fields
- [ ] Generate button works
- [ ] Loading state shows during generation
- [ ] PDF generates successfully
- [ ] PDF opens and is readable
- [ ] Content matches input
- [ ] AI enhances content appropriately
- [ ] Generated resume appears in list
- [ ] Can download generated resume
- [ ] Can delete generated resume
- [ ] Empty field validation works
- [ ] Network error handled gracefully
- [ ] Concurrent clicks prevented
- [ ] Multiple generations work
- [ ] Generation time acceptable (<40s)
- [ ] No console errors
- [ ] No backend errors

---

## Success Criteria

✅ PDF generates within 30 seconds  
✅ PDF is well-formatted and professional  
✅ AI content is relevant and enhanced  
✅ No errors during normal operation  
✅ Error handling is user-friendly  
✅ Generated resumes appear in list  
✅ Can download and delete generated resumes  

---

## Known Limitations

1. **Requires OpenAI API Key**: Won't work without valid key
2. **Generation Time**: 10-30 seconds depending on input size
3. **Token Limits**: Very large inputs may be truncated
4. **Cost**: Each generation uses OpenAI API credits
5. **Quality**: Depends on input quality and AI model

---

## Alternative: Local AI Testing

If you want to test without OpenAI API costs:

```bash
# In backend/.env
USE_LOCAL_AI=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3

# Install Ollama
# Download from https://ollama.ai
# Run: ollama pull llama3
```

**Note**: Local AI may produce different quality results than OpenAI.

---

**Test Date**: ___________  
**Tester**: ___________  
**OpenAI Model**: ___________  
**Result**: ⬜ PASS / ⬜ FAIL  
**Generation Time**: ___________  
**PDF Quality**: ⬜ Excellent / ⬜ Good / ⬜ Fair / ⬜ Poor  
**Notes**: ___________
