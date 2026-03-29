/**
 * St. Josephine Mara Hospital - Admin Dashboard
 * Version: 3.0 - Gmail API Integration
 */

// ==============================
// DOM Elements
// ==============================
const DOM = {
  appointmentsGrid: document.getElementById('appointmentsGrid'),
  appointmentSearch: document.getElementById('appointmentSearch'),
  statusFilter: document.getElementById('statusFilter'),
  pendingBadge: document.getElementById('pendingBadge'),
  pendingCountDisplay: document.getElementById('pendingCountDisplay'),
  pageTitle: document.getElementById('pageTitle'),
  currentTime: document.getElementById('currentTime'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  clearCardsBtn: document.getElementById('clearCardsBtn'),
  generateDailyPDFBtn: document.getElementById('generateDailyPDFBtn'),
  exportBackupBtn: document.getElementById('exportBackupBtn'),
  reportsList: document.getElementById('reportsList'),
  soundEnabled: document.getElementById('soundEnabled'),
  notificationsEnabled: document.getElementById('notificationsEnabled'),
  autoPDFEnabled: document.getElementById('autoPDFEnabled'),
  logoutBtn: document.getElementById('logoutBtn'),
  toast: document.getElementById('toast')
};

// Global appointments array
let appointments = [];

// ==============================
// Utility Functions
// ==============================
function formatDate(dateStr) {
  if (!dateStr || dateStr === 'pending') return 'Pending';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Unknown';
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return formatDate(timestamp);
}

function statusChip(status) {
  const statusMap = {
    pending: 'chip-pending',
    confirmed: 'chip-confirmed',
    rescheduled: 'chip-rescheduled'
  };
  const statusText = {
    pending: '⏳ Pending',
    confirmed: '✓ Confirmed',
    rescheduled: '🔄 Rescheduled'
  };
  return `<span class="status-chip ${statusMap[status] || 'chip-pending'}">${statusText[status] || status}</span>`;
}

function getInitials(name) {
  if (!name || name === 'Unknown') return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function showToast(message, type = 'info') {
  if (!DOM.toast) return;
  DOM.toast.textContent = message;
  DOM.toast.className = `toast show ${type}`;
  setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, 3000);
}

function updateClock() {
  if (DOM.currentTime) {
    DOM.currentTime.textContent = new Date().toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
setInterval(updateClock, 1000);
updateClock();

function updateStats() {
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const totalCount = appointments.length;
  
  if (DOM.pendingBadge) DOM.pendingBadge.textContent = pendingCount;
  if (DOM.pendingCountDisplay) DOM.pendingCountDisplay.textContent = `${pendingCount} Pending`;
  
  return { pending: pendingCount, confirmed: confirmedCount, total: totalCount };
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ==============================
// Load Appointments from Gmail API
// ==============================
async function loadAppointmentsFromGmail() {
  showToast('Loading appointments...', 'info');
  
  try {
    const response = await fetch('/.netlify/functions/get-appointments');
    const result = await response.json();
    
    if (result.success) {
      appointments = result.appointments;
      console.log(`✅ Loaded ${appointments.length} appointments from Gmail`);
      renderAppointments();
      updateStats();
      
      if (appointments.length === 0) {
        showToast('No appointments found. Submit a test appointment!', 'info');
      } else {
        showToast(`Loaded ${appointments.length} appointments`, 'success');
      }
    } else {
      throw new Error(result.error || 'Failed to load');
    }
  } catch (error) {
    console.error('Load error:', error);
    showToast('Failed to load appointments. Check connection.', 'error');
    renderAppointments();
  }
}

// ==============================
// Render Appointments
// ==============================
function renderAppointments() {
  if (!DOM.appointmentsGrid) return;

  let filtered = [...appointments];
  const searchTerm = DOM.appointmentSearch?.value.toLowerCase() || '';
  const statusFilter = DOM.statusFilter?.value || 'all';

  if (searchTerm) {
    filtered = filtered.filter(a => 
      a.patient.firstName.toLowerCase().includes(searchTerm) ||
      a.patient.lastName.toLowerCase().includes(searchTerm) ||
      `${a.patient.firstName} ${a.patient.lastName}`.toLowerCase().includes(searchTerm)
    );
  }
  if (statusFilter !== 'all') {
    filtered = filtered.filter(a => a.status === statusFilter);
  }

  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  updateStats();

  if (filtered.length === 0) {
    DOM.appointmentsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📧</div>
        <p>No appointments found</p>
        <small>Check your Gmail inbox at st.josephine.appointments@gmail.com</small>
        <button class="btn btn-outline" onclick="loadAppointmentsFromGmail()" style="margin-top: 1rem;">🔄 Refresh</button>
      </div>
    `;
    return;
  }

  const pending = filtered.filter(a => a.status === 'pending');
  const confirmed = filtered.filter(a => a.status === 'confirmed');
  const rescheduled = filtered.filter(a => a.status === 'rescheduled');

  let html = '';

  if (pending.length > 0) {
    html += `<div class="section-group"><h2>⏳ Pending (${pending.length})</h2><div class="cards-grid">`;
    html += pending.map(apt => renderCard(apt)).join('');
    html += `</div></div>`;
  }

  if (confirmed.length > 0) {
    html += `<div class="section-group"><h2>✅ Confirmed (${confirmed.length})</h2><div class="cards-grid">`;
    html += confirmed.map(apt => renderCard(apt)).join('');
    html += `</div></div>`;
  }

  if (rescheduled.length > 0) {
    html += `<div class="section-group"><h2>🔄 Rescheduled (${rescheduled.length})</h2><div class="cards-grid">`;
    html += rescheduled.map(apt => renderCard(apt)).join('');
    html += `</div></div>`;
  }

  DOM.appointmentsGrid.innerHTML = html;
}

function renderCard(apt) {
  const fullName = `${apt.patient.firstName} ${apt.patient.lastName}`;
  const displayDate = apt.appointment.preferredDate !== 'pending' ? apt.appointment.preferredDate : 'Check email';
  const displayTime = apt.appointment.preferredTime !== 'pending' ? apt.appointment.preferredTime : '';
  const displayDept = apt.appointment.department !== 'pending' ? apt.appointment.department : 'Check email';
  
  return `
    <div class="appointment-card ${apt.status}" data-id="${apt.id}">
      <div class="card-header">
        <div class="patient-avatar">${getInitials(fullName)}</div>
        <div class="patient-info">
          <div class="patient-name">${escapeHtml(fullName)}</div>
          <div class="patient-contact">${apt.patient.phone !== 'pending' ? apt.patient.phone : apt.patient.email}</div>
        </div>
        ${statusChip(apt.status)}
      </div>
      <div class="card-body">
        <div class="detail-row">
          <span class="detail-icon">🏥</span>
          <span>${escapeHtml(displayDept)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <span>${displayDate} ${displayTime ? `at ${displayTime}` : ''}</span>
        </div>
        <div class="detail-row time-ago">
          <span class="detail-icon">⏱️</span>
          <span>Requested ${formatRelativeTime(apt.createdAt)}</span>
        </div>
      </div>
      <div class="card-actions">
        ${apt.status === 'pending' ? `
          <button class="btn-accept" onclick="acceptAppointment('${apt.id}')">✓ Accept</button>
          <button class="btn-reschedule" onclick="openRescheduleModal('${apt.id}')">📅 Reschedule</button>
        ` : apt.status === 'confirmed' ? `
          <button class="btn-reschedule" onclick="openRescheduleModal('${apt.id}')">📅 Reschedule</button>
          <button class="btn-view" onclick="viewAppointmentDetails('${apt.id}')">View Details</button>
        ` : `
          <button class="btn-view" onclick="viewAppointmentDetails('${apt.id}')">View Details</button>
        `}
      </div>
    </div>
  `;
}

// ==============================
// Accept Appointment
// ==============================
async function acceptAppointment(appointmentId) {
  const appointment = appointments.find(a => a.id === appointmentId);
  if (!appointment) {
    showToast('Appointment not found', 'error');
    return;
  }

  showToast('Sending confirmation email...', 'info');

  try {
    const response = await fetch('/.netlify/functions/process-appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        appointmentId: appointment.id,
        patientEmail: appointment.patient.email,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        department: appointment.appointment.department,
        date: appointment.appointment.preferredDate,
        time: appointment.appointment.preferredTime,
        notes: appointment.appointment.notes
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      appointment.status = 'confirmed';
      renderAppointments();
      showToast(`✓ Appointment confirmed for ${appointment.patient.firstName}`, 'success');
      
      if (DOM.soundEnabled?.checked) {
        new Audio('/notification.mp3').play().catch(e => console.log('Sound error:', e));
      }
    } else {
      throw new Error(result.error || 'Failed to process');
    }
  } catch (error) {
    console.error('Accept error:', error);
    showToast('Failed to send confirmation. Please try again.', 'error');
  }
}

// ==============================
// Reschedule Appointment
// ==============================
let currentRescheduleAppointment = null;

function openRescheduleModal(appointmentId) {
  const appointment = appointments.find(a => a.id === appointmentId);
  if (!appointment) return;

  currentRescheduleAppointment = appointment;

  const patientNameEl = document.getElementById('reschedulePatientName');
  const currentDateTimeEl = document.getElementById('currentDateTime');
  const newDateEl = document.getElementById('newApptDate');
  const newTimeEl = document.getElementById('newApptTime');

  if (patientNameEl) patientNameEl.textContent = `Patient: ${appointment.patient.firstName} ${appointment.patient.lastName}`;
  if (currentDateTimeEl) currentDateTimeEl.value = `${appointment.appointment.preferredDate} at ${appointment.appointment.preferredTime}`;
  if (newDateEl) newDateEl.min = new Date().toISOString().split('T')[0];
  if (newTimeEl) newTimeEl.value = appointment.appointment.preferredTime !== 'pending' ? appointment.appointment.preferredTime : '10:00 AM';

  document.getElementById('rescheduleModal')?.classList.add('open');
}

async function confirmReschedule() {
  if (!currentRescheduleAppointment) return;

  const newDate = document.getElementById('newApptDate')?.value;
  const newTime = document.getElementById('newApptTime')?.value;
  const reason = document.getElementById('rescheduleReason')?.value;

  if (!newDate || !newTime) {
    showToast('Please select a new date and time', 'error');
    return;
  }

  showToast('Sending reschedule email...', 'info');

  try {
    const response = await fetch('/.netlify/functions/process-appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reschedule',
        appointmentId: currentRescheduleAppointment.id,
        patientEmail: currentRescheduleAppointment.patient.email,
        patientName: `${currentRescheduleAppointment.patient.firstName} ${currentRescheduleAppointment.patient.lastName}`,
        department: currentRescheduleAppointment.appointment.department,
        date: newDate,
        time: newTime,
        notes: reason || 'Schedule adjustment'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      currentRescheduleAppointment.status = 'rescheduled';
      currentRescheduleAppointment.appointment.preferredDate = newDate;
      currentRescheduleAppointment.appointment.preferredTime = newTime;
      renderAppointments();
      closeRescheduleModal();
      showToast(`✓ Reschedule email sent to ${currentRescheduleAppointment.patient.firstName}`, 'success');
    } else {
      throw new Error(result.error || 'Failed to process');
    }
  } catch (error) {
    console.error('Reschedule error:', error);
    showToast('Failed to send reschedule. Please try again.', 'error');
  }
}

function closeRescheduleModal() {
  document.getElementById('rescheduleModal')?.classList.remove('open');
  currentRescheduleAppointment = null;
  const reasonEl = document.getElementById('rescheduleReason');
  if (reasonEl) reasonEl.value = '';
}

function viewAppointmentDetails(appointmentId) {
  const appointment = appointments.find(a => a.id === appointmentId);
  if (!appointment) return;
  
  showToast(`${appointment.patient.firstName} ${appointment.patient.lastName}: ${appointment.appointment.department}`, 'info');
}

// ==============================
// Clear All Cards (Display Only)
// ==============================
function clearAllCards() {
  if (confirm('⚠️ This only clears the display. Appointments remain in Gmail. Continue?')) {
    appointments = [];
    renderAppointments();
    showToast('Display cleared. Refresh to reload from Gmail.', 'info');
  }
}

// ==============================
// PDF Reports
// ==============================
function generateDailyPDF() {
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.appointment.preferredDate === today);

  if (todayAppointments.length === 0) {
    showToast('No appointments for today', 'info');
    return;
  }

  const html = generatePDFHTML(todayAppointments, 'Daily Report');
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    showToast('PDF generated successfully', 'success');
  } else {
    showToast('Please allow popups to generate PDF', 'error');
  }
}

function generatePDFHTML(appointmentsList, title) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title} - St. Josephine Mara Hospital</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #1155A4; padding-bottom: 20px; }
        .hospital-name { font-size: 24px; font-weight: bold; color: #1155A4; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="hospital-name">St. Josephine Mara Hospital</div>
        <div>Nairobi Naivasha Junction, Opposite KWS, Naivasha, Kenya</div>
      </div>
      <h2>${title}</h2>
      <div>Generated on ${formattedDate}</div>
      <div>Total Appointments: ${appointmentsList.length}</div>
       <table>
        <thead>
          <tr><th>Patient</th><th>Department</th><th>Date</th><th>Time</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${appointmentsList.map(a => `
            <tr>
              <td>${a.patient.firstName} ${a.patient.lastName}</td>
              <td>${a.appointment.department}</td>
              <td>${a.appointment.preferredDate}</td>
              <td>${a.appointment.preferredTime}</td>
              <td>${a.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">St. Josephine Mara Hospital - Quality Healthcare for All</div>
    </body>
    </html>
  `;
}

function exportBackup() {
  const backupData = {
    exportDate: new Date().toISOString(),
    appointments: appointments
  };
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `sjmh_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('Backup exported successfully', 'success');
}

// ==============================
// Settings
// ==============================
function saveSettings() {
  const settings = {
    soundEnabled: DOM.soundEnabled?.checked || false,
    notificationsEnabled: DOM.notificationsEnabled?.checked || false,
    autoPDFEnabled: DOM.autoPDFEnabled?.checked || false
  };
  localStorage.setItem('sjmh_admin_settings', JSON.stringify(settings));
  showToast('Settings saved', 'success');
}

function loadSettings() {
  const saved = localStorage.getItem('sjmh_admin_settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (DOM.soundEnabled) DOM.soundEnabled.checked = parsed.soundEnabled;
      if (DOM.notificationsEnabled) DOM.notificationsEnabled.checked = parsed.notificationsEnabled;
      if (DOM.autoPDFEnabled) DOM.autoPDFEnabled.checked = parsed.autoPDFEnabled;
    } catch(e) {}
  }
}

function logout() {
  showToast('Signed out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// ==============================
// Navigation
// ==============================
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.admin-section');
  const pageTitle = document.getElementById('pageTitle');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sectionId = btn.getAttribute('data-section');
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sections.forEach(section => section.classList.remove('active'));
      const activeSection = document.getElementById(`section-${sectionId}`);
      if (activeSection) activeSection.classList.add('active');
      const titleMap = {
        appointments: 'Appointments',
        pdfreports: 'PDF Reports',
        emailsettings: 'Email Settings',
        settings: 'Settings'
      };
      if (pageTitle) pageTitle.textContent = titleMap[sectionId] || 'Dashboard';
    });
  });
}

function toggleSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('open');
}

function closeSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
}

// ==============================
// Initialize
// ==============================
async function init() {
  console.log('🚀 Admin Dashboard v3.0 Initializing...');
  
  loadSettings();
  await loadAppointmentsFromGmail();
  initNavigation();
  
  if (DOM.appointmentSearch) {
    DOM.appointmentSearch.addEventListener('input', () => renderAppointments());
  }
  if (DOM.statusFilter) {
    DOM.statusFilter.addEventListener('change', () => renderAppointments());
  }
  if (DOM.clearCardsBtn) {
    DOM.clearCardsBtn.addEventListener('click', clearAllCards);
  }
  if (DOM.generateDailyPDFBtn) {
    DOM.generateDailyPDFBtn.addEventListener('click', generateDailyPDF);
  }
  if (DOM.exportBackupBtn) {
    DOM.exportBackupBtn.addEventListener('click', exportBackup);
  }
  if (DOM.soundEnabled) {
    DOM.soundEnabled.addEventListener('change', saveSettings);
  }
  if (DOM.notificationsEnabled) {
    DOM.notificationsEnabled.addEventListener('change', saveSettings);
  }
  if (DOM.autoPDFEnabled) {
    DOM.autoPDFEnabled.addEventListener('change', saveSettings);
  }
  if (DOM.logoutBtn) {
    DOM.logoutBtn.addEventListener('click', logout);
  }
  
  window.acceptAppointment = acceptAppointment;
  window.openRescheduleModal = openRescheduleModal;
  window.confirmReschedule = confirmReschedule;
  window.closeRescheduleModal = closeRescheduleModal;
  window.viewAppointmentDetails = viewAppointmentDetails;
  window.toggleSidebar = toggleSidebar;
  window.closeSidebar = closeSidebar;
  window.loadAppointmentsFromGmail = loadAppointmentsFromGmail;
  
  console.log('✅ Admin Dashboard v3.0 Ready');
}

document.addEventListener('DOMContentLoaded', init);