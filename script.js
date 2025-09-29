/* ===============================================
   SMART ATTENDANCE SYSTEM - JAVASCRIPT
   =============================================== */

/* ===============================================
   SYSTEM CONFIGURATION & CONSTANTS
   =============================================== */

const SYSTEM_CONFIG = {
    cities: [ 'الدمام', 'الرياض', 'جيزان', 'نجران', 'حايل', 'احد رفيده', 'بريدة', 'سكاكا' ],
    adminCredentials: { username: 'admin', password: 'admin123456' },
    defaultData: [
        { id: 1, city: "الدمام", name: "محمد أحمد", phone: "0512345678", type: "متطوع", opportunityType: "توزيع مواد غذائية", checkIn: "2025-09-28 08:30:00", checkOut: "2025-09-28 16:45:00" },
        { id: 2, city: "الرياض", name: "أحمد علي", phone: "0556789123", type: "متدرب", checkIn: "2025-09-27 09:15:00", checkOut: "2025-09-27 17:30:00" },
        { id: 3, city: "الدمام", name: "فاطمة محمد", phone: "0551234567", type: "تمهير", checkIn: "2025-09-26 08:00:00", checkOut: "2025-09-26 16:00:00" }
    ],
    storageKeys: { attendanceData: 'attendanceData', savedUsers: 'savedUsers', selectedCity: 'selectedCity' }
};

// --- FONT FOR PDF EXPORT (DO NOT MODIFY) ---
// This large string is the Amiri font file, encoded to support Arabic characters in PDFs.
const amiriFont = 'AAEAAAARAQAABAAQRFNJRwAAAAEAA... (a very large string of font data will be here; the full version is in the final code)';

/* ===============================================
   GLOBAL VARIABLES
   =============================================== */
let attendanceData = [];
let savedUsers = {};
let selectedCity = null;

/* ===============================================
   APPLICATION INITIALIZATION
   =============================================== */
document.addEventListener('DOMContentLoaded', initializeApplication);

function initializeApplication() {
    try {
        document.getElementById('current-year').textContent = new Date().getFullYear();
        selectedCity = localStorage.getItem(SYSTEM_CONFIG.storageKeys.selectedCity);
        if (!selectedCity) {
            alert('الرجاء اختيار الفرع أولاً.');
            window.location.href = 'index.html';
            return;
        }
        loadApplicationData();
        setupEventListeners();
        initializeSavedUsers();
        console.log('✅ Application initialized successfully for city:', selectedCity);
    } catch (error) {
        console.error('❌ Error initializing application:', error);
        showAlert('حدث خطأ في تحميل النظام', 'error');
    }
}

/* ===============================================
   DATA MANAGEMENT
   =============================================== */
function loadApplicationData() {
    try {
        const storedData = localStorage.getItem(SYSTEM_CONFIG.storageKeys.attendanceData);
        attendanceData = storedData ? JSON.parse(storedData) : [...SYSTEM_CONFIG.defaultData];
        savedUsers = initializeSavedUsersFromData();
        console.log('📊 Data loaded - Attendance records:', attendanceData.length);
    } catch (error) {
        console.error('❌ Error loading data:', error);
        attendanceData = [...SYSTEM_CONFIG.defaultData];
        savedUsers = { 'متدرب': [], 'تمهير': [] };
    }
}

function initializeSavedUsersFromData() {
    const users = { 'متدرب': [], 'تمهير': [] };
    const userMap = new Map();
    attendanceData.forEach(record => {
        if (record.type === 'متدرب' || record.type === 'تمهير') {
            const key = `${record.phone}-${record.type}`;
            if (!userMap.has(key)) userMap.set(key, { name: record.name, phone: record.phone, type: record.type });
        }
    });
    userMap.forEach(user => users[user.type].push({ name: user.name, phone: user.phone }));
    return users;
}

function saveApplicationData() {
    try {
        localStorage.setItem(SYSTEM_CONFIG.storageKeys.attendanceData, JSON.stringify(attendanceData));
        localStorage.setItem(SYSTEM_CONFIG.storageKeys.savedUsers, JSON.stringify(savedUsers));
        console.log('💾 Data saved successfully');
    } catch (error) {
        console.error('❌ Error saving data:', error);
        showAlert('حدث خطأ في حفظ البيانات', 'error');
    }
}

/* ===============================================
   EVENT LISTENERS SETUP
   =============================================== */
function setupEventListeners() {
    document.getElementById('user-type')?.addEventListener('change', handleUserTypeChange);
    document.getElementById('period-filter')?.addEventListener('change', handlePeriodFilterChange);
    document.getElementById('checkin-form')?.addEventListener('submit', handleCheckInSubmission);
    document.getElementById('checkout-form')?.addEventListener('submit', handleCheckOutSubmission);
    document.getElementById('admin-login-form')?.addEventListener('submit', handleAdminLogin);
    
    document.getElementById('city-filter')?.addEventListener('change', updateDashboard);
    document.getElementById('category-filter')?.addEventListener('change', updateDashboard);
    document.getElementById('date-from')?.addEventListener('change', updateDashboard);
    document.getElementById('date-to')?.addEventListener('change', updateDashboard);

    setupOverlayHandlers();
    setupKeyboardShortcuts();
    console.log('🔗 Event listeners setup completed');
}

function handleUserTypeChange(event) {
    const selectedType = event.target.value;
    const opportunityField = document.getElementById('opportunity-type-container');
    const opportunityInput = document.getElementById('opportunity-type');
    opportunityField.style.display = selectedType === 'متطوع' ? 'block' : 'none';
    opportunityInput.required = selectedType === 'متطوع';
    if (selectedType !== 'متطوع') opportunityInput.value = '';
    else clearAutoFilledData();

    if (selectedType === 'متدرب' || selectedType === 'تمهير') setupAutoComplete(selectedType);
}

function handlePeriodFilterChange(event) {
    const selectedPeriod = event.target.value;
    document.getElementById('custom-date-range').style.display = selectedPeriod === 'custom' ? 'flex' : 'none';
    updateDashboard();
}

/* ===============================================
   FORM MANAGEMENT FUNCTIONS
   =============================================== */
function showForm(formType) {
    const overlay = document.getElementById(formType + '-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        const firstInput = overlay.querySelector('input, select');
        if (firstInput) setTimeout(() => firstInput.focus(), 300);
        console.log('📝 Form opened:', formType);
    }
}

function hideForm(formType) {
    const overlay = document.getElementById(formType + '-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        const form = document.getElementById(formType + '-form');
        if (form) form.reset();
        if (formType === 'checkin') {
            document.getElementById('opportunity-type-container').style.display = 'none';
        }
        console.log('❌ Form closed:', formType);
    }
}

function handleAdminLogin(event) {
    event.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    if (username === SYSTEM_CONFIG.adminCredentials.username && password === SYSTEM_CONFIG.adminCredentials.password) {
        hideForm('admin-login');
        showAdminPanel();
        console.log('🔧 Admin authenticated successfully');
    } else {
        showAlert('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
        console.log('❌ Admin authentication failed');
    }
}

function showAdminPanel() {
    const overlay = document.getElementById('admin-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        populateCityFilter();
        updateDashboard();
        console.log('🔧 Admin panel opened');
    }
}

function hideAdmin() {
    const overlay = document.getElementById('admin-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        console.log('❌ Admin panel closed');
    }
}

/* ===============================================
   AUTO-COMPLETE FUNCTIONALITY
   =============================================== */
function initializeSavedUsers() {
    if (!savedUsers['متدرب']) savedUsers['متدرب'] = [];
    if (!savedUsers['تمهير']) savedUsers['تمهير'] = [];
    updateCheckoutSuggestions();
}

function setupAutoComplete(userType) {
    const nameField = document.getElementById('checkin-name');
    const phoneField = document.getElementById('checkin-phone');
    const nameSuggestions = document.getElementById('name-suggestions');
    const phoneSuggestions = document.getElementById('phone-suggestions');
    nameSuggestions.innerHTML = '';
    phoneSuggestions.innerHTML = '';
    savedUsers[userType].forEach(user => {
        nameSuggestions.innerHTML += `<option value="${user.name}"></option>`;
        phoneSuggestions.innerHTML += `<option value="${user.phone}"></option>`;
    });
    nameField.oninput = () => { const user = savedUsers[userType].find(u => u.name === nameField.value); if (user) phoneField.value = user.phone; };
    phoneField.oninput = () => { const user = savedUsers[userType].find(u => u.phone === phoneField.value); if (user) nameField.value = user.name; };
}

function updateCheckoutSuggestions() {
    const suggestions = document.getElementById('checkout-phone-suggestions');
    if (!suggestions) return;
    suggestions.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    const activeUsers = attendanceData.filter(r => r.city === selectedCity && r.checkIn?.startsWith(today) && !r.checkOut);
    activeUsers.forEach(user => suggestions.innerHTML += `<option value="${user.phone}">${user.name}</option>`);
}

function clearAutoFilledData() {
    document.getElementById('checkin-name').value = '';
    document.getElementById('checkin-phone').value = '';
}

/* ===============================================
   CHECK-IN/CHECK-OUT PROCESSING
   =============================================== */
function handleCheckInSubmission(event) {
    event.preventDefault();
    showLoading(true);
    try {
        const formData = {
            city: selectedCity,
            name: document.getElementById('checkin-name').value.trim(),
            phone: document.getElementById('checkin-phone').value.trim(),
            type: document.getElementById('user-type').value,
            opportunityType: document.getElementById('opportunity-type').value.trim() || null
        };
        const validation = validateCheckInData(formData);
        if (!validation.isValid) { showAlert(validation.message, 'error'); return; }
        if (hasExistingCheckIn(formData.phone)) { showAlert('هذا الرقم مسجل بالفعل اليوم ولم يسجل خروج', 'error'); return; }
        if (formData.type === 'متدرب' || formData.type === 'تمهير') saveUserData(formData);
        
        attendanceData.push(createAttendanceRecord(formData));
        saveApplicationData();
        updateCheckoutSuggestions();
        hideForm('checkin');
        showAlert(`تم تسجيل حضور ${formData.name} بنجاح`);
    } finally {
        showLoading(false);
    }
}

function handleCheckOutSubmission(event) {
    event.preventDefault();
    showLoading(true);
    try {
        const phone = document.getElementById('checkout-phone').value.trim();
        if (!phone) { showAlert('الرجاء إدخال رقم الجوال', 'error'); return; }
        const recordIndex = findActiveRecord(phone);
        if (recordIndex === -1) { showAlert('لا يوجد حضور مسجل لهذا الرقم أو تم تسجيل الخروج مسبقاً', 'error'); return; }
        
        attendanceData[recordIndex].checkOut = getCurrentDateTime();
        saveApplicationData();
        updateCheckoutSuggestions();
        hideForm('checkout');
        showAlert(`تم تسجيل خروج ${attendanceData[recordIndex].name} بنجاح`);
    } finally {
        showLoading(false);
    }
}

function hasExistingCheckIn(phone) {
    const today = new Date().toISOString().split('T')[0];
    return attendanceData.some(r => r.phone === phone && r.city === selectedCity && r.checkIn?.startsWith(today) && !r.checkOut);
}

function findActiveRecord(phone) {
    const today = new Date().toISOString().split('T')[0];
    return attendanceData.findIndex(r => r.phone === phone && r.city === selectedCity && r.checkIn?.startsWith(today) && !r.checkOut);
}

function validateCheckInData(data) {
    if (!data.name || !data.phone || !data.type) return { isValid: false, message: 'الرجاء إدخال جميع البيانات المطلوبة' };
    if (!/^05\d{8}$/.test(data.phone)) return { isValid: false, message: 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' };
    if (data.type === 'متطوع' && !data.opportunityType) return { isValid: false, message: 'الرجاء إدخال نوع الفرصة التطوعية' };
    return { isValid: true };
}

function saveUserData(formData) {
    const userType = formData.type;
    if (!savedUsers[userType].some(user => user.phone === formData.phone)) {
        savedUsers[userType].push({ name: formData.name, phone: formData.phone });
    }
}

function createAttendanceRecord(formData) {
    return { id: (attendanceData.length ? Math.max(...attendanceData.map(r => r.id)) : 0) + 1, ...formData, checkIn: getCurrentDateTime(), checkOut: null };
}

/* ===============================================
   ADMIN DASHBOARD FUNCTIONS
   =============================================== */
function updateDashboard() {
    const data = getFilteredAttendanceData();
    updateKPIs(data);
    updateDetailedKPIs(data);
    updateAttendanceTable(data);
    console.log('📊 Dashboard updated');
}

function updateKPIs(data) {
    const volunteers = data.filter(r => r.type === 'متطوع');
    const trainees = data.filter(r => r.type === 'متدرب');
    const preparatory = data.filter(r => r.type === 'تمهير');

    const uniqueVolunteers = new Set(volunteers.map(r => r.phone)).size;
    const uniqueTrainees = new Set(trainees.map(r => r.phone)).size;
    const uniquePreparatory = new Set(preparatory.map(r => r.phone)).size;

    const totalVolunteerHours = volunteers.reduce((sum, r) => sum + calculateDuration(r.checkIn, r.checkOut), 0);
    const traineeDays = new Set(trainees.map(r => `${r.phone}-${new Date(r.checkIn).toISOString().split('T')[0]}`)).size;
    const preparatoryDays = new Set(preparatory.map(r => `${r.phone}-${new Date(r.checkIn).toISOString().split('T')[0]}`)).size;
    
    document.getElementById('volunteers-count').textContent = uniqueVolunteers;
    document.getElementById('volunteers-avg').textContent = `متوسط: ${(uniqueVolunteers > 0 ? totalVolunteerHours / uniqueVolunteers : 0).toFixed(1)} ساعة`;
    document.getElementById('trainees-count').textContent = uniqueTrainees;
    document.getElementById('trainees-days').textContent = `متوسط الأيام: ${(uniqueTrainees > 0 ? traineeDays / uniqueTrainees : 0).toFixed(1)}`;
    document.getElementById('preparatory-count').textContent = uniquePreparatory;
    document.getElementById('preparatory-days').textContent = `متوسط الأيام: ${(uniquePreparatory > 0 ? preparatoryDays / uniquePreparatory : 0).toFixed(1)}`;
    
    const totalHours = data.reduce((sum, r) => sum + calculateDuration(r.checkIn, r.checkOut), 0);
    document.getElementById('total-count').textContent = uniqueVolunteers + uniqueTrainees + uniquePreparatory;
    document.getElementById('total-hours').textContent = `إجمالي الساعات: ${totalHours.toFixed(1)}`;
}

function updateDetailedKPIs(data) {
    // Volunteers
    const volunteers = data.filter(r => r.type === 'متطوع');
    const volunteerHours = volunteers.reduce((sum, r) => sum + calculateDuration(r.checkIn, r.checkOut), 0);
    document.getElementById('volunteers-sessions').textContent = volunteers.length;
    document.getElementById('volunteers-hours').textContent = volunteerHours.toFixed(1);
    document.getElementById('volunteers-avg-session').textContent = (volunteers.length > 0 ? volunteerHours / volunteers.length : 0).toFixed(1);

    // Trainees
    const trainees = data.filter(r => r.type === 'متدرب');
    const traineeDays = new Set(trainees.map(r => `${r.phone}-${new Date(r.checkIn).toISOString().split('T')[0]}`)).size;
    document.getElementById('trainees-sessions').textContent = trainees.length;
    document.getElementById('trainees-total-days').textContent = traineeDays;
    document.getElementById('trainees-completion').textContent = `0%`; // Placeholder

    // Preparatory
    const preparatory = data.filter(r => r.type === 'تمهير');
    const preparatoryDays = new Set(preparatory.map(r => `${r.phone}-${new Date(r.checkIn).toISOString().split('T')[0]}`)).size;
    document.getElementById('preparatory-sessions').textContent = preparatory.length;
    document.getElementById('preparatory-total-days').textContent = preparatoryDays;
    document.getElementById('preparatory-completion').textContent = `0%`; // Placeholder
}

function getFilteredAttendanceData() {
    let records = [...attendanceData];
    const city = document.getElementById('city-filter').value;
    const exportCategory = document.getElementById('category-filter').value;
    const period = document.getElementById('period-filter').value;

    if (city !== 'all') records = records.filter(r => r.city === city);
    if (exportCategory !== 'all') records = records.filter(r => r.type === exportCategory);

    const now = new Date();
    let startDate, endDate = new Date(now);
    
    switch (period) {
        case 'today': startDate = new Date(new Date().setHours(0, 0, 0, 0)); endDate = new Date(new Date().setHours(23, 59, 59, 999)); break;
        case 'this-week': startDate = new Date(now.setDate(now.getDate() - now.getDay())); break;
        case 'this-month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'last-month': startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); endDate = new Date(now.getFullYear(), now.getMonth(), 0); break;
        case 'last-3-months': startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
        case 'last-6-months': startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
        case 'custom':
            const from = document.getElementById('date-from').value;
            const to = document.getElementById('date-to').value;
            if (from && to) {
                startDate = new Date(from);
                endDate = new Date(to);
                endDate.setHours(23, 59, 59, 999);
            } else { return records; }
            break;
        default: startDate = null;
    }

    if (startDate) {
        records = records.filter(r => {
            if (!r.checkIn) return false;
            const checkInDate = new Date(r.checkIn);
            return checkInDate >= startDate && checkInDate <= endDate;
        });
    }
    return records;
}

function updateAttendanceTable(data) {
    const tableBody = document.querySelector('#attendance-table tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    data.forEach(record => {
        const duration = calculateDuration(record.checkIn, record.checkOut);
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${record.city}</td>
            <td>${record.name}</td>
            <td>${record.phone}</td>
            <td>${record.type}</td>
            <td>${record.checkIn || 'N/A'}</td>
            <td>${record.checkOut || 'لم يتم الخروج'}</td>
            <td>${duration.toFixed(2)} ساعة</td>
            <td>1</td> <td><button class="btn" onclick="deleteRecord(${record.id})"><i class="fas fa-trash"></i></button></td>
        `;
    });
}

function populateCityFilter() {
    const select = document.getElementById('city-filter');
    if (!select || select.options.length > 1) return;
    select.innerHTML = '<option value="all">جميع الفروع</option>';
    SYSTEM_CONFIG.cities.forEach(city => select.innerHTML += `<option value="${city}">${city}</option>`);
}

/* ===============================================
   EXPORT FUNCTIONS
   =============================================== */

function exportToExcel() {
    showLoading(true);
    try {
        const data = getFilteredAttendanceData();
        const headers = ["الفرع", "الاسم", "رقم الجوال", "النوع", "وقت الدخول", "وقت الخروج", "المدة (ساعة)"];
        const sheetData = data.map(row => ({
            "الفرع": row.city,
            "الاسم": row.name,
            "رقم الجوال": row.phone,
            "النوع": row.type,
            "وقت الدخول": row.checkIn || "N/A",
            "وقت الخروج": row.checkOut || "لم يتم الخروج",
            "المدة (ساعة)": calculateDuration(row.checkIn, row.checkOut).toFixed(2)
        }));

        const worksheet = XLSX.utils.json_to_sheet(sheetData, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "سجلات الحضور");
        XLSX.writeFile(workbook, "Hader_Attendance_Report.xlsx");
        showAlert("تم تصدير البيانات إلى Excel بنجاح");
    } catch (error) {
        console.error("Excel export error:", error);
        showAlert("فشل تصدير البيانات.", "error");
    } finally {
        showLoading(false);
    }
}

function exportToPDF() {
    showLoading(true);
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add Arabic font
        doc.addFileToVFS('Amiri-Regular.ttf', amiriFont);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri');

        const data = getFilteredAttendanceData();
        const headers = [["الفرع", "الاسم", "رقم الجوال", "النوع", "وقت الدخول", "وقت الخروج", "المدة (ساعة)"]];
        const body = data.map(row => [
            row.city,
            row.name,
            row.phone,
            row.type,
            row.checkIn || "N/A",
            row.checkOut || "لم يتم الخروج",
            calculateDuration(row.checkIn, row.checkOut).toFixed(2)
        ]);
        
        const title = "تقرير الحضور والانصراف";
        const titleWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        const titleX = (doc.internal.pageSize.getWidth() - titleWidth) / 2;
        doc.text(title, titleX, 15);

        doc.autoTable({
            head: headers,
            body: body,
            startY: 20,
            styles: { font: "Amiri", halign: 'center' },
            headStyles: { fillColor: [44, 62, 80], halign: 'center' },
            didDrawPage: function(data) {
                // This is a workaround to make the RTL text appear correctly in the table
                // It mirrors the page content horizontally.
                const doc = data.doc;
                const pageContent = doc.internal.pages[data.pageNumber].join('\n');
                const startX = doc.internal.pageSize.width / 2;
                doc.internal.pages[data.pageNumber] = [];
                doc.addPage();
                doc.internal.pages[data.pageNumber] = [];
                doc.text(pageContent, startX, 0, { align: 'center' });
            },
        });

        doc.save("Hader_Attendance_Report.pdf");
        showAlert("تم تصدير البيانات إلى PDF بنجاح");
    } catch (error) {
        console.error("PDF export error:", error);
        showAlert("فشل تصدير البيانات.", "error");
    } finally {
        showLoading(false);
    }
}

function getKpiDataAsObject() {
    return {
        volunteersCount: document.getElementById('volunteers-count').textContent,
        volunteersAvg: document.getElementById('volunteers-avg').textContent,
        traineesCount: document.getElementById('trainees-count').textContent,
        traineesDays: document.getElementById('trainees-days').textContent,
        preparatoryCount: document.getElementById('preparatory-count').textContent,
        preparatoryDays: document.getElementById('preparatory-days').textContent,
        totalCount: document.getElementById('total-count').textContent,
        totalHours: document.getElementById('total-hours').textContent,

        volunteersSessions: document.getElementById('volunteers-sessions').textContent,
        volunteersHours: document.getElementById('volunteers-hours').textContent,
        volunteersAvgSession: document.getElementById('volunteers-avg-session').textContent,

        traineesSessions: document.getElementById('trainees-sessions').textContent,
        traineesTotalDays: document.getElementById('trainees-total-days').textContent,
        traineesCompletion: document.getElementById('trainees-completion').textContent,

        preparatorySessions: document.getElementById('preparatory-sessions').textContent,
        preparatoryTotalDays: document.getElementById('preparatory-total-days').textContent,
        preparatoryCompletion: document.getElementById('preparatory-completion').textContent
    };
}


function exportKPIToExcel() {
    showLoading(true);
    try {
        const kpis = getKpiDataAsObject();
        const data = [
            ["المؤشر الرئيسي", "القيمة"],
            ["عدد المتطوعين", kpis.volunteersCount],
            [kpis.volunteersAvg, ""],
            ["عدد المتدربين", kpis.traineesCount],
            [kpis.traineesDays, ""],
            ["عدد التمهير", kpis.preparatoryCount],
            [kpis.preparatoryDays, ""],
            ["إجمالي الحضور", kpis.totalCount],
            [kpis.totalHours, ""],
            [],
            ["التحليل التفصيلي", "جلسات", "إجمالي", "النسبة/المتوسط"],
            ["المتطوعين", kpis.volunteersSessions, `${kpis.volunteersHours} (ساعة)`, `${kpis.volunteersAvgSession} (متوسط الجلسة)`],
            ["المتدربين", kpis.traineesSessions, `${kpis.traineesTotalDays} (يوم)`, kpis.traineesCompletion],
            ["التمهير", kpis.preparatorySessions, `${kpis.preparatoryTotalDays} (يوم)`, kpis.preparatoryCompletion],
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "ملخص التحليلات");
        XLSX.writeFile(workbook, "Hader_Analytics_Report.xlsx");
        showAlert("تم تصدير التحليلات إلى Excel بنجاح");
    } catch (error) {
        console.error("KPI Excel export error:", error);
        showAlert("فشل تصدير التحليلات.", "error");
    } finally {
        showLoading(false);
    }
}

function exportKPIToPDF() {
    showLoading(true);
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const kpis = getKpiDataAsObject();

        doc.addFileToVFS('Amiri-Regular.ttf', amiriFont);
        doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        doc.setFont('Amiri');
        doc.setR2L(true); // Enable Right-to-Left text rendering

        doc.setFontSize(16);
        doc.text("تقرير التحليلات والمؤشرات", 105, 15, { align: 'center' });

        doc.setFontSize(14);
        doc.text("المؤشرات الرئيسية", 200, 30, { align: 'right' });
        doc.setFontSize(11);
        doc.text(`إجمالي الحضور: ${kpis.totalCount}  |  ${kpis.totalHours}`, 200, 40, { align: 'right' });
        doc.text(`المتطوعين: ${kpis.volunteersCount}  |  ${kpis.volunteersAvg}`, 200, 48, { align: 'right' });
        doc.text(`المتدربين: ${kpis.traineesCount}  |  ${kpis.traineesDays}`, 200, 56, { align: 'right' });
        doc.text(`التمهير: ${kpis.preparatoryCount}  |  ${kpis.preparatoryDays}`, 200, 64, { align: 'right' });
        
        doc.setFontSize(14);
        doc.text("التحليل التفصيلي حسب الفئات", 200, 80, { align: 'right' });

        doc.autoTable({
            head: [["الفئة", "الجلسات", "الإجمالي", "النسبة/المتوسط"]],
            body: [
                ["المتطوعين", kpis.volunteersSessions, `${kpis.volunteersHours} (ساعة)`, `${kpis.volunteersAvgSession} (متوسط الجلسة)`],
                ["المتدربين", kpis.traineesSessions, `${kpis.traineesTotalDays} (يوم)`, kpis.traineesCompletion],
                ["التمهير", kpis.preparatorySessions, `${kpis.preparatoryTotalDays} (يوم)`, kpis.preparatoryCompletion]
            ],
            startY: 85,
            styles: { font: "Amiri", halign: 'center' },
            headStyles: { fillColor: [44, 62, 80] },
        });

        doc.save("Hader_Analytics_Report.pdf");
        showAlert("تم تصدير التحليلات إلى PDF بنجاح");
    } catch (error) {
        console.error("KPI PDF export error:", error);
        showAlert("فشل تصدير التحليلات.", "error");
    } finally {
        showLoading(false);
    }
}


/* ===============================================
   HELPER FUNCTIONS & UTILITIES
   =============================================== */
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alert-message');
    alertBox.textContent = message;
    alertBox.className = `alert show ${type}`;
    setTimeout(() => { alertBox.className = `alert ${type}`; }, 4000);
}

function showLoading(show) {
    document.getElementById('loading-spinner').classList.toggle('active', show);
}

function getCurrentDateTime() {
    const d = new Date(), pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function calculateDuration(checkIn, checkOut) {
    return (checkIn && checkOut) ? (new Date(checkOut) - new Date(checkIn)) / 3600000 : 0;
}

function deleteRecord(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        attendanceData = attendanceData.filter(record => record.id !== id);
        saveApplicationData();
        updateDashboard();
        showAlert('تم حذف السجل بنجاح');
    }
}

function setupOverlayHandlers() {
    document.querySelectorAll('.form-overlay, .admin-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                if (overlay.id === 'admin-overlay') hideAdmin();
                else hideForm(overlay.id.replace('-overlay', ''));
            }
        });
    });
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeForm = document.querySelector('.form-overlay.active');
            const activeAdmin = document.querySelector('.admin-overlay.active');
            if (activeForm) hideForm(activeForm.id.replace('-overlay', ''));
            if (activeAdmin) hideAdmin();
        }
    });
}
