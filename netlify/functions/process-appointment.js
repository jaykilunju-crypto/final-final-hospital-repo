const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    // Get the action and parameters from the URL
    const { action, id, email, name, date, time, department, phone, newDate, newTime } = event.queryStringParameters || {};

    // Create email transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    // Handle ACCEPT action
    if (action === 'accept') {
        // Send confirmation email to patient
        await transporter.sendMail({
            from: `"St. Josephine Mara Hospital" <${process.env.GMAIL_EMAIL}>`,
            to: email,
            subject: `✅ Appointment Confirmed - ${name}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #0B1F3A; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; }
                        .details { background: #f0f0f0; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🏥 St. Josephine Mara Hospital</h2>
                            <h3>Appointment Confirmed!</h3>
                        </div>
                        <div class="content">
                            <p>Dear ${name},</p>
                            <p>Your appointment has been <strong>CONFIRMED</strong>.</p>
                            <div class="details">
                                <p><strong>📅 Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                                <p><strong>⏰ Time:</strong> ${time}</p>
                                <p><strong>🏥 Department:</strong> ${department}</p>
                                <p><strong>📞 Contact:</strong> ${phone}</p>
                            </div>
                            <p>Please arrive 15 minutes before your scheduled time.</p>
                            <p>Thank you for choosing St. Josephine Mara Hospital.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        // Return success page
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { background: #0B1F3A; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial; margin: 0; }
                        .card { background: white; border-radius: 20px; padding: 40px; text-align: center; max-width: 500px; }
                        .button { background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>✅ Appointment Accepted!</h1>
                        <p>Confirmation email sent to ${email}</p>
                        <a href="https://mail.google.com" class="button">Back to Gmail</a>
                    </div>
                </body>
                </html>
            `
        };
    }

    // Handle RESCHEDULE action - show form
    if (action === 'reschedule') {
        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { background: #0B1F3A; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial; margin: 0; padding: 20px; }
                        .card { background: white; border-radius: 20px; padding: 30px; max-width: 500px; width: 100%; }
                        input, select { padding: 10px; margin: 10px 0; width: 100%; border: 1px solid #ddd; border-radius: 5px; }
                        button { background: #FF9800; color: white; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; width: 100%; }
                        .current { background: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>🔄 Reschedule Appointment</h1>
                        <div class="current">
                            <p><strong>Patient:</strong> ${name}</p>
                            <p><strong>Current Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                            <p><strong>Current Time:</strong> ${time}</p>
                        </div>
                        <form action="/.netlify/functions/process-appointment" method="GET">
                            <input type="hidden" name="action" value="confirm-reschedule">
                            <input type="hidden" name="id" value="${id}">
                            <input type="hidden" name="email" value="${email}">
                            <input type="hidden" name="name" value="${name}">
                            <input type="hidden" name="department" value="${department}">
                            <input type="hidden" name="phone" value="${phone}">
                            <label>New Date:</label>
                            <input type="date" name="newDate" required min="${new Date().toISOString().split('T')[0]}">
                            <label>New Time:</label>
                            <select name="newTime" required>
                                <option value="">Select time</option>
                                <option value="09:00 AM">09:00 AM</option>
                                <option value="10:00 AM">10:00 AM</option>
                                <option value="11:00 AM">11:00 AM</option>
                                <option value="02:00 PM">02:00 PM</option>
                                <option value="03:00 PM">03:00 PM</option>
                                <option value="04:00 PM">04:00 PM</option>
                            </select>
                            <button type="submit">Confirm Reschedule</button>
                        </form>
                    </div>
                </body>
                </html>
            `
        };
    }

    // Handle CONFIRM-RESCHEDULE action
    if (action === 'confirm-reschedule') {
        // Send reschedule notification to patient
        await transporter.sendMail({
            from: `"St. Josephine Mara Hospital" <${process.env.GMAIL_EMAIL}>`,
            to: email,
            subject: `🔄 Appointment Rescheduled - ${name}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #0B1F3A; color: white; padding: 20px; text-align: center; }
                        .details { background: #f0f0f0; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🏥 St. Josephine Mara Hospital</h2>
                            <h3>Appointment Rescheduled</h3>
                        </div>
                        <div class="content">
                            <p>Dear ${name},</p>
                            <p>Your appointment has been <strong>RESCHEDULED</strong> to:</p>
                            <div class="details">
                                <p><strong>📅 New Date:</strong> ${new Date(newDate).toLocaleDateString()}</p>
                                <p><strong>⏰ New Time:</strong> ${newTime}</p>
                                <p><strong>🏥 Department:</strong> ${department}</p>
                            </div>
                            <p>We apologize for any inconvenience.</p>
                            <p>Thank you for choosing St. Josephine Mara Hospital.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { background: #0B1F3A; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial; margin: 0; }
                        .card { background: white; border-radius: 20px; padding: 40px; text-align: center; max-width: 500px; }
                        .button { background: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>✅ Appointment Rescheduled!</h1>
                        <p>Reschedule confirmation sent to ${email}</p>
                        <a href="https://mail.google.com" class="button">Back to Gmail</a>
                    </div>
                </body>
                </html>
            `
        };
    }

    // Handle DECLINE action
    if (action === 'decline') {
        await transporter.sendMail({
            from: `"St. Josephine Mara Hospital" <${process.env.GMAIL_EMAIL}>`,
            to: email,
            subject: `❌ Appointment Update - ${name}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #0B1F3A; color: white; padding: 20px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>🏥 St. Josephine Mara Hospital</h2>
                            <h3>Appointment Status Update</h3>
                        </div>
                        <div class="content">
                            <p>Dear ${name},</p>
                            <p>Unfortunately, your appointment request for ${new Date(date).toLocaleDateString()} at ${time} could not be accommodated.</p>
                            <p>Please call us at (XXX) XXX-XXXX to schedule a new appointment.</p>
                            <p>We apologize for any inconvenience.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { background: #0B1F3A; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial; margin: 0; }
                        .card { background: white; border-radius: 20px; padding: 40px; text-align: center; max-width: 500px; }
                        .button { background: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>❌ Appointment Declined</h1>
                        <p>Notification sent to ${email}</p>
                        <a href="https://mail.google.com" class="button">Back to Gmail</a>
                    </div>
                </body>
                </html>
            `
        };
    }

    // If no valid action
    return {
        statusCode: 400,
        body: "Invalid action"
    };
};