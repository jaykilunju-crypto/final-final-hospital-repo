**Yes! Let's update the README to match the new email-based system.**

Here's the updated README that reflects our **Email + SMTP** architecture (no Gmail API, no OAuth, just simple email with buttons):

---

## README.md - Updated for Email + SMTP System

```markdown
# 🏥 St. Josephine Mara Hospital - Appointment System

## Email-Based Architecture | Zero Database | SMTP with Gmail

---

## 📌 Project Overview

This is a **zero-database, email-based hospital appointment system** that runs entirely on free tiers. When a patient submits an appointment form, the admin receives an email with **ACCEPT / RESCHEDULE / DECLINE buttons**. Clicking a button automatically sends confirmation emails to the patient.

**No Gmail API, no OAuth, no complex setup.** Just simple email sending via SMTP with Gmail App Password.

---

## ✨ Features

| Feature | How It Works |
|---------|--------------|
| **Public Website** | Responsive hospital website with services, gallery, testimonials |
| **Appointment Form** | 7 fields: name, email, phone, department, date, time, notes |
| **Admin Email** | Gets email with patient details + action buttons |
| **Accept Appointment** | Click button → Patient gets confirmation email |
| **Reschedule** | Click button → Form appears to pick new date/time |
| **Decline** | Click button → Patient gets polite decline notice |
| **No Database** | Gmail inbox is the "database" |
| **Free Forever** | Netlify free tier + Gmail SMTP = $0 |

---

## 🔄 How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                      SYSTEM FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   PATIENT                    NETLIFY                     ADMIN   │
│                                                                  │
│   1. Fills form ──────► submit-appointment.js                   │
│                              │                                   │
│                              ▼                                   │
│                      Sends email via SMTP                        │
│                      (Gmail App Password)                        │
│                              │                                   │
│                              ▼                                   │
│                         Admin Inbox                              │
│                    ┌─────────────────────┐                       │
│                    │ 📧 NEW APPOINTMENT  │                       │
│                    │ John Doe - Dental   │                       │
│                    │ [✅ ACCEPT]         │                       │
│                    │ [🔄 RESCHEDULE]     │                       │
│                    │ [❌ DECLINE]        │                       │
│                    └─────────────────────┘                       │
│                              │                                   │
│                              ▼                                   │
│                   Admin clicks ACCEPT                            │
│                              │                                   │
│                              ▼                                   │
│                   process-appointment.js                         │
│                              │                                   │
│                              ▼                                   │
│              Patient gets confirmation email                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Hosting** | Netlify (free tier) |
| **Frontend** | Vanilla HTML/CSS/JS |
| **Email** | Nodemailer + Gmail SMTP |
| **Authentication** | Gmail App Password (no OAuth!) |
| **Functions** | Netlify Serverless Functions |

---

## 📁 File Structure

```
St.-Josephine-Mara-Hospital-website/
│
├── index.html                    # Public hospital website
├── admin-index.html              # Admin dashboard (optional)
├── styles.css                    # Shared styles
├── app.js                        # Form handler
├── admin-app.js                  # Dashboard (optional)
├── package.json                  # Dependencies (nodemailer)
├── netlify.toml                  # Netlify config
│
├── images/                       # Hospital images
│
└── netlify/
    └── functions/
        ├── submit-appointment.js    # Sends email to admin with buttons
        └── process-appointment.js   # Handles button clicks
```

---

## 🔧 Setup Guide

### Step 1: Prerequisites

- GitHub account
- Netlify account (free)
- Gmail account for admin (e.g., `hospital.appointments@gmail.com`)

### Step 2: Get Gmail App Password

1. Enable **2-Step Verification** on your Gmail account
2. Go to: https://myaccount.google.com/apppasswords
3. Select **Mail** → **Other** → Name it "Hospital System"
4. Click **Generate**
5. Copy the 16-character password

### Step 3: Add Environment Variables in Netlify

Go to Netlify Dashboard → Site Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `GMAIL_EMAIL` | `your-hospital-email@gmail.com` |
| `GMAIL_APP_PASSWORD` | `xxxx xxxx xxxx xxxx` (16 chars) |

### Step 4: Deploy to Netlify

```bash
# Push to GitHub
git add .
git commit -m "Deploy appointment system"
git push origin main

# Netlify auto-deploys
```

### Step 5: Test

1. Visit your site: `https://your-site.netlify.app`
2. Submit a test appointment
3. Check admin Gmail inbox
4. Click **ACCEPT** button
5. Patient receives confirmation email

---

## 📧 Email Templates

### Admin Email (with buttons)

```
Subject: 📅 NEW APPOINTMENT: John Doe (Dental)

Patient: John Doe
Email: john@example.com
Phone: 0712345678
Department: Dental
Date: April 15, 2026
Time: 10:00 AM

[✅ ACCEPT]  [🔄 RESCHEDULE]  [❌ DECLINE]
```

### Patient Confirmation Email

```
Subject: ✅ Appointment Confirmed - St. Josephine Mara Hospital

Dear John Doe,

Your appointment has been CONFIRMED.

📅 Date: April 15, 2026
⏰ Time: 10:00 AM
🏥 Department: Dental

Please arrive 15 minutes early.
```

---

## 🚀 API Reference

### POST /.netlify/functions/submit-appointment

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "0712345678",
  "department": "Dental",
  "date": "2026-04-15",
  "time": "10:00 AM",
  "notes": ""
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment submitted successfully!"
}
```

### GET /.netlify/functions/process-appointment

**Parameters:**
- `action` = `accept` | `reschedule` | `decline` | `confirm-reschedule`
- `email` = patient email
- `name` = patient name
- `date` = appointment date
- `time` = appointment time
- `department` = department name
- `newDate` = (for reschedule)
- `newTime` = (for reschedule)

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Email not sending | Check Gmail App Password is correct |
| "Method not allowed" | Function not deployed; check Netlify logs |
| Buttons don't work | Ensure `process-appointment.js` is deployed |
| 502 Bad Gateway | Function timeout; check function logs in Netlify |

### Check Function Logs

1. Netlify Dashboard → Functions
2. Click function name
3. View logs

---

## 📊 Free Tier Limits

| Service | Limit | Your Usage (est.) |
|---------|-------|-------------------|
| Netlify Functions | 125k calls/month | ~300 calls |
| Gmail SMTP | 500 emails/day | ~10 emails/day |
| Bandwidth | 100GB/month | Minimal |

**You'll never hit these limits with normal hospital usage.**

---

## 🔒 Security

- **No database** = No data breach risk
- **HTTPS** enforced by Netlify
- **Gmail App Password** instead of real password
- **No OAuth** = No token management

---

## 📈 Future Enhancements

- [ ] Add SMS notifications
- [ ] Calendar integration (Google Calendar)
- [ ] Weekly email summary to admin
- [ ] Export appointments to Excel

---

## 📝 License

MIT License - Free for all uses.

---

## 🙏 Acknowledgments

Built for **St. Josephine Mara Hospital, Naivasha, Kenya**

---

**Made with ❤️ for healthcare**
```

---

## What Changed in README

| Old (Gmail API) | New (SMTP) |
|-----------------|------------|
| Gmail API + OAuth | Gmail SMTP + App Password |
| 4 environment variables | 2 environment variables |
| Refresh tokens needed | No tokens needed |
| OAuth consent screen | No Google Cloud setup |
| `get-appointments.js` | Removed (not needed) |
| `oauth-callback.js` | Removed |

---

## Save and Push

```bash
# Save the README
nano README.md
# Paste the content above, Ctrl+O, Ctrl+X

# Push to GitHub
git add README.md
git commit -m "Update README for simple SMTP email system"
git push origin main
```

---

**Now your documentation matches the actual working system!** 🎉