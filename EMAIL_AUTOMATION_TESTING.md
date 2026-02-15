# Manual Testing Guide: Email Automation

## Prerequisites

✅ **Backend Running**: `http://localhost:8000`  
✅ **Frontend Running**: `http://localhost:5173`  
✅ **SMTP Configured**: Email credentials in backend `.env`  
✅ **User Logged In**: Valid authentication token  
⚠️ **Feature Flag**: `FEATURE_EMAIL_AUTOMATION=true` (default)

---

## Environment Setup

### Required SMTP Configuration

Edit `backend/.env`:

```bash
# Email Settings
EMAIL_ENABLED=true
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USE_SSL=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=AI Job Automation Bot

# Feature Flag
FEATURE_EMAIL_AUTOMATION=true
```

### Gmail App Password Setup

**Important**: Don't use your regular Gmail password!

1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Go to "App passwords"
4. Generate new app password for "Mail"
5. Copy 16-character password
6. Use this in `EMAIL_PASSWORD`

### Verify Configuration

```bash
# Check if email settings are loaded
curl http://localhost:8000/api/v1/email/test \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return: {"message": "Email configuration is valid"}
# or error if misconfigured
```

---

## Test 1: SMTP Configuration Test

### Steps:
1. Login to application
2. Navigate to Dashboard or Email Automation section
3. Look for "Test Email Configuration" button
4. Click the button

### Expected Results:
- ✅ Success toast: "Test email sent successfully!"
- ✅ Test email received in your inbox
- ✅ Email subject: "Test Email from AI Job Automation"
- ✅ Email body contains test message
- ✅ Sender shows as configured `EMAIL_FROM_NAME`

### Verification:
```bash
# Backend logs should show:
# "Sending test email to {EMAIL_USER}"
# "Test email sent successfully"
```

### Common Issues:
- ❌ "SMTP authentication failed" → Check app password
- ❌ "Connection refused" → Check EMAIL_HOST and EMAIL_PORT
- ❌ "SSL error" → Verify EMAIL_USE_SSL=true for port 465

---

## Test 2: Send HR Email with Resume Attachment

### Steps:
1. Navigate to Dashboard or Email Automation page
2. Fill in the HR email form:

   **Recipient Email**: `hr@example.com` (use your test email)
   
   **Subject**: `Application for Senior Software Engineer Position`
   
   **Email Body**:
   ```
   Dear Hiring Manager,

   I am writing to express my interest in the Senior Software Engineer position at your company. With 5+ years of experience in full-stack development, I believe I would be a great fit for your team.

   Please find my resume attached for your review. I look forward to discussing how my skills and experience align with your needs.

   Best regards,
   Test User
   ```

3. **Attach Resume**:
   - Click "Attach Resume" or similar button
   - Select a PDF resume from your computer
   - Verify filename appears

4. Click "Send Email"

### Expected Results:
- ✅ Button shows loading state ("Sending...")
- ✅ Button disabled during sending
- ✅ Success toast: "Email sent successfully!"
- ✅ Email received at recipient address
- ✅ Email contains correct subject
- ✅ Email body formatted correctly
- ✅ Resume PDF attached and downloadable
- ✅ Attachment has correct filename

### Verification:
```javascript
// Check network tab
// POST /api/v1/email/send/hr
// Content-Type: multipart/form-data
// Status: 200 OK
```

### Backend Logs:
```bash
# Should show:
# "Sending HR email to hr@example.com"
# "Email sent successfully with attachment: resume.pdf"
```

### Email Quality Checks:
- ✅ No broken formatting
- ✅ Links work (if any)
- ✅ Attachment opens correctly
- ✅ Sender name correct
- ✅ No spam folder placement

---

## Test 3: Send Email Without Attachment

### Steps:
1. Fill in email form (same as Test 2)
2. **Do NOT attach resume**
3. Click "Send Email"

### Expected Results:
- ✅ Email sends successfully
- ✅ Email received without attachment
- ✅ All other content correct

---

## Test 4: Follow-Up Email

### Steps:
1. Navigate to Jobs page or Follow-up section
2. Select a job application
3. Click "Send Follow-up Email"
4. Review pre-filled template
5. Modify if needed
6. Click "Send"

### Expected Results:
- ✅ Follow-up template loaded
- ✅ Job details pre-filled
- ✅ Email sends successfully
- ✅ Professional follow-up tone

### Sample Follow-up Template:
```
Subject: Following up on [Job Title] Application

Dear Hiring Manager,

I wanted to follow up on my application for the [Job Title] position I submitted on [Date]. I remain very interested in this opportunity and would welcome the chance to discuss how my skills align with your needs.

Please let me know if you need any additional information.

Best regards,
[Your Name]
```

---

## Test 5: Telegram Notification (Optional)

If Telegram is configured:

### Setup:
```bash
# In backend/.env
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### Steps:
1. Send an HR email (Test 2)
2. Check your Telegram

### Expected Results:
- ✅ Telegram notification received
- ✅ Message contains: "Email sent to hr@example.com"
- ✅ Notification includes job title or subject

---

## Test 6: Error Handling - Invalid Email

### Steps:
1. Fill in form with invalid recipient email:
   - `invalid-email` (no @)
   - `test@` (incomplete)
   - `@example.com` (no local part)
2. Try to send

### Expected Results:
- ❌ Validation error: "Please enter a valid email address"
- ✅ Form prevents submission
- ✅ Field highlighted in red

---

## Test 7: Error Handling - Missing SMTP Config

### Steps:
1. Stop backend
2. Remove `EMAIL_USER` or `EMAIL_PASSWORD` from `.env`
3. Restart backend
4. Try to send email

### Expected Results:
- ❌ Error toast: "Email service not configured"
- ❌ HTTP 500 or 503 error
- ✅ User-friendly error message

### Backend Logs:
```bash
# Should show:
# "Email credentials not configured"
# "Skipping email send"
```

---

## Test 8: Error Handling - Network Error

### Steps:
1. Disconnect from internet
2. Try to send email

### Expected Results:
- ❌ Error toast: "Failed to send email. Please check your connection."
- ✅ Button returns to normal state
- ✅ Form data preserved
- ✅ User can retry

---

## Test 9: Large Attachment

### Steps:
1. Try to attach resume > 10MB
2. Attempt to send

### Expected Results:
- ❌ Validation error: "File size exceeds 10MB limit"
- ✅ Upload prevented
- ✅ User prompted to use smaller file

---

## Test 10: Multiple Emails

### Steps:
1. Send email to recipient A
2. Wait for completion
3. Send email to recipient B
4. Send email to recipient C

### Expected Results:
- ✅ All emails send successfully
- ✅ No interference between sends
- ✅ Each email has correct recipient
- ✅ Attachments don't get mixed up

---

## API Testing (Alternative Method)

### Test Email Configuration
```bash
curl -X GET http://localhost:8000/api/v1/email/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send HR Email with Attachment
```bash
curl -X POST http://localhost:8000/api/v1/email/send/hr \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "recipient=hr@example.com" \
  -F "subject=Application for Senior Developer" \
  -F "body=Dear Hiring Manager, Please find my resume attached." \
  -F "resume=@/path/to/resume.pdf"
```

### Expected Response
```json
{
  "message": "Email sent successfully",
  "recipient": "hr@example.com"
}
```

---

## Performance Testing

### Email Send Time

| Scenario | Expected Time | Acceptable Range |
|----------|---------------|------------------|
| Without attachment | 1-3 seconds | 0.5-5 seconds |
| With small PDF (<1MB) | 2-5 seconds | 1-8 seconds |
| With large PDF (5-10MB) | 5-10 seconds | 3-15 seconds |

### Monitor:
```javascript
// Browser console
console.time('email-send');
// Click send
// Wait for completion
console.timeEnd('email-send');
```

---

## Email Deliverability Check

### Spam Folder Check
1. Send test email
2. Check recipient's spam folder
3. If in spam:
   - Add sender to contacts
   - Mark as "Not Spam"
   - Check SPF/DKIM records

### Email Headers Check
View email source and verify:
- ✅ `From:` header correct
- ✅ `Reply-To:` set (if configured)
- ✅ `Content-Type: multipart/mixed` (with attachment)
- ✅ No suspicious headers

---

## SMTP Provider-Specific Notes

### Gmail
- ✅ Use port 465 with SSL
- ✅ Requires app password (not regular password)
- ⚠️ Daily limit: 500 emails
- ⚠️ May require "Less secure app access" (not recommended)

### Outlook/Office 365
```bash
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USE_SSL=false  # Use TLS instead
```

### SendGrid
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Amazon SES
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
```

---

## Troubleshooting

### Issue: "SMTP authentication failed"
**Solutions**:
1. Verify email/password correct
2. Use app password (not regular password)
3. Enable "Less secure apps" (Gmail)
4. Check 2FA settings

### Issue: "Connection timeout"
**Solutions**:
1. Check firewall settings
2. Verify port is correct (465 or 587)
3. Check if ISP blocks SMTP
4. Try different port

### Issue: "SSL/TLS error"
**Solutions**:
1. For port 465: `EMAIL_USE_SSL=true`
2. For port 587: `EMAIL_USE_SSL=false` (uses STARTTLS)
3. Update Python SSL certificates

### Issue: Emails go to spam
**Solutions**:
1. Set up SPF record for domain
2. Set up DKIM signing
3. Use professional email content
4. Avoid spam trigger words
5. Include unsubscribe link

### Issue: Attachment not received
**Solutions**:
1. Check file size < 10MB
2. Verify file is PDF
3. Check multipart/form-data encoding
4. Review backend logs for errors

---

## Testing Checklist

- [ ] SMTP configuration verified
- [ ] Test email endpoint works
- [ ] Can send email without attachment
- [ ] Can send email with PDF attachment
- [ ] Attachment downloads correctly
- [ ] Email formatting correct
- [ ] Subject line correct
- [ ] Sender name correct
- [ ] Recipient receives email
- [ ] Email not in spam folder
- [ ] Follow-up email works
- [ ] Telegram notification works (if enabled)
- [ ] Invalid email validation works
- [ ] Missing SMTP config handled
- [ ] Network error handled
- [ ] Large file rejected
- [ ] Multiple emails work
- [ ] Send time acceptable (<10s)
- [ ] No console errors
- [ ] No backend errors

---

## Success Criteria

✅ Email sends within 5 seconds  
✅ Email received in inbox (not spam)  
✅ Attachment downloads and opens correctly  
✅ Professional formatting maintained  
✅ Error handling is user-friendly  
✅ Multiple emails work without issues  
✅ Telegram notifications work (if enabled)  

---

## Security Considerations

### Best Practices:
1. ✅ Use app passwords, not regular passwords
2. ✅ Store credentials in `.env`, not code
3. ✅ Never commit `.env` to git
4. ✅ Use TLS/SSL for SMTP connection
5. ✅ Validate email addresses
6. ✅ Sanitize email content
7. ✅ Rate limit email sending
8. ✅ Log email activity

### Privacy:
- ✅ Don't log email content
- ✅ Don't store passwords in database
- ✅ Respect email preferences
- ✅ Include unsubscribe option

---

## Production Recommendations

1. **Use Professional Email Service**:
   - SendGrid, Mailgun, Amazon SES
   - Better deliverability
   - Higher sending limits
   - Analytics and tracking

2. **Implement Email Queue**:
   - Use Celery or background tasks
   - Retry failed sends
   - Handle rate limits

3. **Add Email Templates**:
   - HTML templates
   - Variable substitution
   - Consistent branding

4. **Monitor Email Metrics**:
   - Delivery rate
   - Open rate
   - Bounce rate
   - Spam complaints

---

**Test Date**: ___________  
**Tester**: ___________  
**SMTP Provider**: ___________  
**Result**: ⬜ PASS / ⬜ FAIL  
**Emails Sent**: ___________  
**Delivery Rate**: ___________  
**Notes**: ___________
