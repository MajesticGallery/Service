# PWA Order Token System using GitHub Pages and Google Sheets

## Project Overview

This project is a **Progressive Web App (PWA)** that allows users to submit simple service requests (like document processing, service booking, etc.).

The system generates a **unique Order ID** and stores the request data in **Google Sheets**.

Users can later receive **WhatsApp notifications** when their order is ready.

The entire system can run **without a traditional backend server** using:

* GitHub Pages (Frontend Hosting)
* Google Sheets (Database)
* Google Apps Script (API Layer)

---

# System Architecture

```
User (Mobile PWA)
        │
        │  Submit Form
        ▼
GitHub Pages PWA
        │
        │  API Request
        ▼
Google Apps Script Web API
        │
        ▼
Google Sheets (Database)
```

---

# Core Features

### User Side

* Mobile friendly PWA
* Installable on phone
* Submit request form
* Receive generated Order ID
* View order status (Processing / Ready)

### Admin Side

* Orders stored in Google Sheets
* Change status manually
* Send WhatsApp notification when order is ready

---

# Example Workflow

### Step 1 – User submits form

Input fields:

* Name
* Purpose
* Mobile Number

Example:

```
Name: Ahmed
Purpose: Passport Renewal
Mobile: 9876543210
```

---

### Step 2 – App generates Order ID

Response shown to user:

```
ORDER ID: 1025
Purpose: Passport Renewal
Status: Processing
```

---

### Step 3 – Data stored in Google Sheets

Example Sheet Structure:

| OrderID | Name  | Purpose          | Mobile     | Status     | Date       |
| ------- | ----- | ---------------- | ---------- | ---------- | ---------- |
| 1025    | Ahmed | Passport Renewal | 9876543210 | Processing | 09-03-2026 |

---

### Step 4 – Admin updates status

Admin changes:

```
Status → Ready
```

---

### Step 5 – User receives WhatsApp notification

Example message:

```
Your Order ID 1025 is ready.

Please come and collect your documents.
```

---

# Frontend (PWA)

## Technologies

* HTML
* CSS
* JavaScript
* Web Manifest
* Service Worker

Hosted on:

```
GitHub Pages
```

---

# Form UI Example

```
---------------------------
Service Request
---------------------------

Name
[____________]

Purpose
[____________]

Mobile Number
[____________]

[ Submit ]

---------------------------
ORDER ID: 1025
Status: Processing
---------------------------
```

---

# Example Frontend Code

## HTML

```html
<form id="orderForm">
<input type="text" id="name" placeholder="Name" required>

<input type="text" id="purpose" placeholder="Purpose" required>

<input type="tel" id="mobile" placeholder="Mobile Number" required>

<button type="submit">Submit</button>
</form>

<div id="result"></div>
```

---

## JavaScript

```javascript
document.getElementById("orderForm").addEventListener("submit", function(e){

e.preventDefault();

let data = {
name: document.getElementById("name").value,
purpose: document.getElementById("purpose").value,
mobile: document.getElementById("mobile").value
};

fetch("GOOGLE_SCRIPT_API_URL",{
method:"POST",
body: JSON.stringify(data)
})
.then(res=>res.json())
.then(res=>{

document.getElementById("result").innerHTML =
`ORDER ID : ${res.orderId}<br>
Purpose : ${res.purpose}<br>
Status : Processing`;

});

});
```

---

# Backend (Google Apps Script)

Google Apps Script acts as a **simple backend API**.

Responsibilities:

* Receive POST requests
* Generate Order ID
* Store data in Google Sheets
* Return response to PWA

---

## Example Apps Script

```javascript
function doPost(e){

var sheet = SpreadsheetApp.openById("SHEET_ID").getSheetByName("Sheet1");

var data = JSON.parse(e.postData.contents);

var lastRow = sheet.getLastRow();

var orderId = 1000 + lastRow;

sheet.appendRow([
orderId,
data.name,
data.purpose,
data.mobile,
"Processing",
new Date()
]);

return ContentService
.createTextOutput(JSON.stringify({
orderId:orderId,
purpose:data.purpose
}))
.setMimeType(ContentService.MimeType.JSON);

}
```

---

# WhatsApp Notification Options

## Option 1 (Manual Link)

```
https://wa.me/919876543210?text=Your%20order%20ID%201025%20is%20ready
```

---

## Option 2 (Automated API)

Possible services:

* Twilio WhatsApp API
* Meta WhatsApp Cloud API
* WATI
* UltraMsg

Apps Script can trigger message when **status changes to Ready**.

---

# PWA Features

* Installable on mobile
* Works like a native app
* Offline support
* Fast loading
* Push notifications (future upgrade)

---

# Future Improvements

Possible upgrades:

* Admin dashboard
* Live queue display
* QR code for Order ID
* Order tracking page
* SMS notifications
* Push notifications
* Automatic WhatsApp integration

---

# Cost

| Service      | Platform           | Cost        |
| ------------ | ------------------ | ----------- |
| Hosting      | GitHub Pages       | Free        |
| Database     | Google Sheets      | Free        |
| Backend      | Google Apps Script | Free        |
| WhatsApp API | Optional           | Free / Paid |

Total basic system cost:

```
₹0
```

---

# Ideal Use Cases

* Document service centers
* Government service offices
* Repair centers
* Order pickup systems
* Queue/token systems
* Small business service tracking

---

# Project Goal

Create a **simple serverless order tracking system** using only free tools that can be deployed quickly and maintained easily.

---

# End of Document
