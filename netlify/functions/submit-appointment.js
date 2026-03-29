const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    // Only accept POST requests
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Method not allowed' }) 
        };
    }

    try {
        // Parse the appointment data from the form
        const data = JSON.parse(event.body);
        const { firstName, lastName, email, phone, department, date, time, notes } = data;
        
        // Generate a unique ID for this appointment
        const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        
        // Get the site URL from environment or use default
        const SITE_URL = process.env.URL || 'https://superb-daifuku-d7ba2a.netlify.app';
        
        // Create email transporter using Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_EMAIL,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
        
        // Format the date nicely
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Create the button URLs
        const acceptUrl = `${SITE_URL}/.netlify/functions/process-appointment?action=accept&id=${appointmentId}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(firstName + ' ' + lastName)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&department=${encodeURIComponent(department)}&phone=${encodeURIComponent(phone)}`;
        
        const rescheduleUrl = `${SITE_URL}/.netlify/functions/process-appointment?action=reschedule&id=${appointmentId}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(firstName + ' ' + lastName)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&department=${encodeURIComponent(department)}`;
        
        const declineUrl = `${SITE_URL}/.netlify/functions/process-appointment?action=decline&id=${appointmentId}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(firstName + ' ' + lastName)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`;
        
        // Email to ADMIN (with buttons)
        const adminEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #0B1F3A; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
                    .appointment-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1155A4; }
                    .button-group { text-align: center; margin: 30px 0; }
                    .button { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; cursor: pointer; }
                    .button-accept { background: #4CAF50; color: white; }
                    .button-reschedule { background: #FF9800; color: white; }
                    .button-decline { background: #f44336; color: white; }
                    .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
                    hr { margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🏥 St. Josephine Mara Hospital</h2>
                        <p>New Appointment Request</p>
                    </div>
                    <div class="content">
                        <h3>Patient Information</h3>
                        <div class="appointment-details">
                            <p><strong>📋 Appointment ID:</strong> ${appointmentId}</p>
                            <p><strong>👤 Patient Name:</strong> ${firstName} ${lastName}</p>
                            <p><strong>📧 Email:</strong> ${email}</p>
                            <p><strong>📞 Phone:</strong> ${phone}</p>
                            <p><strong>🏥 Department:</strong> ${department}</p>
                            <p><strong>📅 Date:</strong> ${formattedDate}</p>
                            <p><strong>⏰ Time:</strong> ${time}</p>
                            ${notes ? `<p><strong>📝 Notes:</strong> ${notes}</p>` : ''}
                        </div>
                        
                        <div class="button-group">
                            <a href="${acceptUrl}" class="button button-accept">✅ ACCEPT APPOINTMENT</a>
                            <a href="${rescheduleUrl}" class="button button-reschedule">🔄 RESCHEDULE</a>
                            <a href="${declineUrl}" class="button button-decline">❌ DECLINE</a>
                        </div>
                        
                        <hr>
                        
                        <p><strong>How it works:</strong></p>
                        <ol>
                            <li>Click one of the buttons above to process this appointment</li>
                            <li>Patient will receive an email confirmation automatically</li>
                            <li>If rescheduling, you'll be prompted to select a new date/time</li>
                        </ol>
                        
                        <div class="footer">
                            <p>This is an automated message from St. Josephine Mara Hospital Appointment System.</p>
                            <p>Do not reply to this email. Use the buttons above to respond.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Confirmation email to PATIENT
        const patientEmailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #0B1F3A; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
                    .appointment-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1155A4; }
                    .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🏥 St. Josephine Mara Hospital</h2>
                        <p>Appointment Request Received</p>
                    </div>
                    <div class="content">
                        <h3>Thank you, ${firstName}!</h3>
                        <p>Your appointment request has been received and is pending confirmation.</p>
                        
                        <h4>📋 Appointment Details:</h4>
                        <div class="appointment-details">
                            <p><strong>Reference:</strong> ${appointmentId}</p>
                            <p><strong>Department:</strong> ${department}</p>
                            <p><strong>Date:</strong> ${formattedDate}</p>
                            <p><strong>Time:</strong> ${time}</p>
                            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
                        </div>
                        
                        <p><strong>What happens next?</strong></p>
                        <ol>
                            <li>Our admin will review your request</li>
                            <li>You'll receive a confirmation email once approved</li>
                            <li>If any changes are needed, we'll contact you</li>
                        </ol>
                        
                        <p>Please bring your ID and any relevant medical records on the appointment day.</p>
                        
                        <div class="footer">
                            <p>St. Josephine Mara Hospital<br>
                            Serving the community with compassion and excellence.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        // Send email to ADMIN
        await transporter.sendMail({
            from: `"St. Josephine Mara Hospital" <${process.env.GMAIL_EMAIL}>`,
            to: process.env.GMAIL_EMAIL,
            subject: `📅 NEW APPOINTMENT: ${firstName} ${lastName} (${department})`,
            html: adminEmailHtml
        });
        
        // Send confirmation to PATIENT
        await transporter.sendMail({
            from: `"St. Josephine Mara Hospital" <${process.env.GMAIL_EMAIL}>`,
            to: email,
            subject: `Appointment Request Received - ${firstName} ${lastName}`,
            html: patientEmailHtml
        });
        
        // Return success response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'Appointment submitted successfully! Check your email for confirmation.',
                appointmentId: appointmentId
            })
        };
        
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false, 
                error: 'Failed to send appointment. Please try again.',
                details: error.message 
            })
        };
    }
};