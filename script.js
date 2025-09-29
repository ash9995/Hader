/* ===============================================
   SMART ATTENDANCE SYSTEM - JAVASCRIPT
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

let attendanceData = [];
let savedUsers = {};
let selectedCity = null;

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
    const volunteers = data.filter(r => r.type === 'متطوع');
    const volunteerHours = volunteers.reduce((sum, r) => sum + calculateDuration(r.checkIn, r.checkOut), 0);
    document.getElementById('volunteers-sessions').textContent = volunteers.length;
    document.getElementById('volunteers-hours').textContent = volunteerHours.toFixed(1);
    document.getElementById('volunteers-avg-session').textContent = (volunteers.length > 0 ? volunteerHours / volunteers.length : 0).toFixed(1);

    const trainees = data.filter(r => r.type === 'متدرب');
    const traineeDays = new Set(trainees.map(r => `${r.phone}-${new Date(r.checkIn).toISOString().split('T')[0]}`)).size;
    document.getElementById('trainees-sessions').textContent = trainees.length;
    document.getElementById('trainees-total-days').textContent = traineeDays;
    document.getElementById('trainees-completion').textContent = `0%`;

    const preparatory = data.filter(r => r.type === 'تمهير');
    const preparatoryDays = new Set(preparatory.map(r => `${r.phone}-${new Date(r.checkIn).toISOString().split('T')[0]}`)).size;
    document.getElementById('preparatory-sessions').textContent = preparatory.length;
    document.getElementById('preparatory-total-days').textContent = preparatoryDays;
    document.getElementById('preparatory-completion').textContent = `0%`;
}

function getFilteredAttendanceData() {
    let records = [...attendanceData];
    const city = document.getElementById('city-filter').value;
    const category = document.getElementById('category-filter').value;
    const period = document.getElementById('period-filter').value;

    if (city !== 'all') records = records.filter(r => r.city === city);
    if (category !== 'all') records = records.filter(r => r.type === category);

    const now = new Date();
    let startDate, endDate = new Date(now);
    
    switch (period) {
        case 'today': startDate = new Date(now.setHours(0, 0, 0, 0)); break;
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
            } else { return records; }
            break;
    }
    if (startDate) {
        records = records.filter(r => {
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
            <td>1</td>
            <td><button class="btn" onclick="deleteRecord(${record.id})"><i class="fas fa-trash"></i></button></td>
        `;
    });
}

function populateCityFilter() {
    const select = document.getElementById('city-filter');
    if (!select || select.options.length > 1) return;
    select.innerHTML = '<option value="all">جميع الفروع</option>';
    SYSTEM_CONFIG.cities.forEach(city => select.innerHTML += `<option value="${city}">${city}</option>`);
}

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

/* ===============================================
   EXPORT FUNCTIONS
   =============================================== */

function exportToExcel() {
    try {
        const data = getFilteredAttendanceData();
        if (data.length === 0) {
            showAlert('لا توجد بيانات للتصدير', 'error');
            return;
        }

        const excelData = data.map(record => ({
            'الفرع': record.city,
            'الاسم': record.name,
            'رقم الجوال': record.phone,
            'النوع': record.type,
            'نوع الفرصة': record.opportunityType || '-',
            'وقت الدخول': record.checkIn || '-',
            'وقت الخروج': record.checkOut || 'لم يتم الخروج',
            'المدة (ساعة)': calculateDuration(record.checkIn, record.checkOut).toFixed(2)
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        ws['!cols'] = [
            { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
            { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'سجلات الحضور');
        const filename = `سجلات_الحضور_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        showAlert('تم تصدير البيانات بنجاح');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        showAlert('حدث خطأ أثناء تصدير البيانات', 'error');
    }
}

function exportToPDF() {
    try {
        const data = getFilteredAttendanceData();
        if (data.length === 0) {
            showAlert('لا توجد بيانات للتصدير', 'error');
            return;
        }

        showLoading(true);

        // Create a temporary div to render the table
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.background = 'white';
        tempDiv.style.padding = '20px';
        tempDiv.style.width = '1200px';
        tempDiv.style.fontFamily = 'Tajawal, Arial, sans-serif';
        tempDiv.style.direction = 'rtl';
        
        // Create HTML table
        let tableHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="font-size: 24px; color: #333;">سجلات الحضور والانصراف</h1>
                <p style="font-size: 14px; color: #666;">التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;" dir="rtl">
                <thead>
                    <tr style="background-color: #546B68;">
                        <th style="border: 1px solid #ddd; padding: 10px; color: white;">الفرع</th>
                        <th style="border: 1px solid #ddd; padding: 10px; color: white;">الاسم</th>
                        <th style="border: 1px solid #ddd; padding: 10px; color: white;">رقم الجوال</th>
                        <th style="border: 1px solid #ddd; padding: 10px; color: white;">النوع</th>
                        <th style="border: 1px solid #ddd; padding: 10px; color: white;">وقت الدخول</th>
                        <th style="border: 1px solid #ddd; padding: 10px; color: white;">وقت الخروج</th>
                        <th style="border: 1px solid #ddd; padding: 10px; color: white;">المدة (ساعة)</th>
                    </tr>
                </thead>
                <tbody>`;

        data.forEach((record, index) => {
            const bgColor = index % 2 === 0 ? '#f5f5f5' : 'white';
            tableHTML += `
                <tr style="background-color: ${bgColor};">
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${record.city}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">${record.name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${record.phone}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${record.type}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${record.checkIn || '-'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${record.checkOut || 'لم يتم الخروج'}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${calculateDuration(record.checkIn, record.checkOut).toFixed(2)}</td>
                </tr>`;
        });

        tableHTML += `
                </tbody>
            </table>`;

        tempDiv.innerHTML = tableHTML;
        document.body.appendChild(tempDiv);

        // Convert to canvas then to PDF
        html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            logging: false
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4');
            
            // Calculate dimensions
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 10;

            // Add image to PDF, handle pagination if needed
            doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - 20);

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Save the PDF
            const filename = `attendance_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            // Clean up
            document.body.removeChild(tempDiv);
            showLoading(false);
            showAlert('تم تصدير البيانات بنجاح');
        }).catch(error => {
            console.error('Error generating PDF:', error);
            document.body.removeChild(tempDiv);
            showLoading(false);
            showAlert('حدث خطأ أثناء تصدير البيانات', 'error');
        });

    } catch (error) {
        console.error('Error exporting to PDF:', error);
        showLoading(false);
        showAlert('حدث خطأ أثناء تصدير البيانات', 'error');
    }
}

function exportKPIToExcel() {
    try {
        const data = getFilteredAttendanceData();
        if (data.length === 0) {
            showAlert('لا توجد بيانات للتصدير', 'error');
            return;
        }

        // Calculate KPI metrics
        const volunteers = data.filter(r => r.type === 'متطوع');
        const trainees = data.filter(r => r.type === 'متدرب');
        const preparatory = data.filter(r => r.type === 'تمهير');

        const uniqueVolunteers = new Set(volunteers.map(r => r.phone)).size;
        const uniqueTrainees = new Set(trainees.map(r => r.phone)).size;
        const uniquePreparatory = new Set(preparatory.map(r => r.phone)).size;

        const totalVolunteerHours = volunteers.reduce((sum, r) => sum + calculateDuration(r.checkIn, r.checkOut), 0);
        const avgVolunteerHours = uniqueVolunteers > 0 ? totalVolunteerHours / uniqueVolunteers : 0;

        const traineeDays = new Set(trainees.map(r => `${r.phone}-${new Date(r.checkIn).toISOString().split('T')[0]}`)).size;
        const avgTraineeDays = uniqueTrainees > 0 ? traineeDays / uniqueTrainees : 0;

        const preparatoryDays = new Set(preparatory.map(r => `${r.phone}-${new Date(r.checkIn).toISOString().split('T')[0]}`)).size;
        const avgPreparatoryDays = uniquePreparatory > 0 ? preparatoryDays / uniquePreparatory : 0;

        const totalHours = data.reduce((sum, r) => sum + calculateDuration(r.checkIn, r.checkOut), 0);
        const totalUnique = uniqueVolunteers + uniqueTrainees + uniquePreparatory;

        // Create Excel workbook with multiple sheets
        const wb = XLSX.utils.book_new();

        // Sheet 1: Summary KPIs
        const summaryData = [
            { 'المؤشر': 'عدد المتطوعين', 'القيمة': uniqueVolunteers, 'الوحدة': 'شخص' },
            { 'المؤشر': 'متوسط ساعات المتطوعين', 'القيمة': avgVolunteerHours.toFixed(1), 'الوحدة': 'ساعة' },
            { 'المؤشر': 'إجمالي ساعات التطوع', 'القيمة': totalVolunteerHours.toFixed(1), 'الوحدة': 'ساعة' },
            { 'المؤشر': '', 'القيمة': '', 'الوحدة': '' },
            { 'المؤشر': 'عدد المتدربين', 'القيمة': uniqueTrainees, 'الوحدة': 'شخص' },
            { 'المؤشر': 'متوسط أيام المتدربين', 'القيمة': avgTraineeDays.toFixed(1), 'الوحدة': 'يوم' },
            { 'المؤشر': 'إجمالي أيام التدريب', 'القيمة': traineeDays, 'الوحدة': 'يوم' },
            { 'المؤشر': '', 'القيمة': '', 'الوحدة': '' },
            { 'المؤشر': 'عدد التمهير', 'القيمة': uniquePreparatory, 'الوحدة': 'شخص' },
            { 'المؤشر': 'متوسط أيام التمهير', 'القيمة': avgPreparatoryDays.toFixed(1), 'الوحدة': 'يوم' },
            { 'المؤشر': 'إجمالي أيام التمهير', 'القيمة': preparatoryDays, 'الوحدة': 'يوم' },
            { 'المؤشر': '', 'القيمة': '', 'الوحدة': '' },
            { 'المؤشر': 'إجمالي الحضور', 'القيمة': totalUnique, 'الوحدة': 'شخص' },
            { 'المؤشر': 'إجمالي الساعات', 'القيمة': totalHours.toFixed(1), 'الوحدة': 'ساعة' }
        ];

        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, summarySheet, 'المؤشرات العامة');

        // Sheet 2: Detailed Category Analysis
        const categoryData = [
            // Volunteers section
            { 'الفئة': 'المتطوعين', 'المؤشر': 'عدد الجلسات', 'القيمة': volunteers.length },
            { 'الفئة': 'المتطوعين', 'المؤشر': 'إجمالي الساعات', 'القيمة': totalVolunteerHours.toFixed(1) },
            { 'الفئة': 'المتطوعين', 'المؤشر': 'متوسط الجلسة', 'القيمة': (volunteers.length > 0 ? totalVolunteerHours / volunteers.length : 0).toFixed(1) },
            { 'الفئة': '', 'المؤشر': '', 'القيمة': '' },
            // Trainees section
            { 'الفئة': 'المتدربين', 'المؤشر': 'عدد الجلسات', 'القيمة': trainees.length },
            { 'الفئة': 'المتدربين', 'المؤشر': 'إجمالي الأيام', 'القيمة': traineeDays },
            { 'الفئة': 'المتدربين', 'المؤشر': 'نسبة الإنجاز', 'القيمة': '0%' },
            { 'الفئة': '', 'المؤشر': '', 'القيمة': '' },
            // Preparatory section
            { 'الفئة': 'التمهير', 'المؤشر': 'عدد الجلسات', 'القيمة': preparatory.length },
            { 'الفئة': 'التمهير', 'المؤشر': 'إجمالي الأيام', 'القيمة': preparatoryDays },
            { 'الفئة': 'التمهير', 'المؤشر': 'نسبة الإنجاز', 'القيمة': '0%' }
        ];

        const categorySheet = XLSX.utils.json_to_sheet(categoryData);
        categorySheet['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, categorySheet, 'التحليل التفصيلي');

        // Sheet 3: Individual Performance (Top performers)
        const volunteerPerformance = [];
        const volunteerStats = new Map();

        volunteers.forEach(record => {
            const phone = record.phone;
            if (!volunteerStats.has(phone)) {
                volunteerStats.set(phone, {
                    name: record.name,
                    phone: phone,
                    sessions: 0,
                    totalHours: 0
                });
            }
            const stats = volunteerStats.get(phone);
            stats.sessions++;
            stats.totalHours += calculateDuration(record.checkIn, record.checkOut);
        });

        volunteerStats.forEach(stats => {
            volunteerPerformance.push({
                'الاسم': stats.name,
                'رقم الجوال': stats.phone,
                'عدد الجلسات': stats.sessions,
                'إجمالي الساعات': stats.totalHours.toFixed(1),
                'متوسط الجلسة': (stats.totalHours / stats.sessions).toFixed(1)
            });
        });

        // Sort by total hours descending
        volunteerPerformance.sort((a, b) => parseFloat(b['إجمالي الساعات']) - parseFloat(a['إجمالي الساعات']));

        const performanceSheet = XLSX.utils.json_to_sheet(volunteerPerformance);
        performanceSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, performanceSheet, 'أداء المتطوعين');

        // Save the file
        const filename = `تحليل_المؤشرات_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
        showAlert('تم تصدير التحليلات بنجاح');

    } catch (error) {
        console.error('Error exporting KPI to Excel:', error);
        showAlert('حدث خطأ أثناء تصدير التحليلات', 'error');
    }
}

function exportKPIToPDF() {
    try {
        const data = getFilteredAttendanceData();
        if (data.length === 0) {
            showAlert('لا توجد بيانات للتصدير', 'error');
            return;
        }

        showLoading(true);

        // Calculate KPI metrics (same as Excel export)
        const volunteers = data.filter(r => r.type === 'متطوع');
        const trainees = data.filter(r => r.type === 'متدرب');
        const preparatory = data.filter(r => r.type === 'تمهير');

        const uniqueVolunteers = new Set(volunteers.map(r => r.phone)).size;
        const uniqueTrainees = new Set(trainees.map(r => r.phone)).size;
        const uniquePreparatory = new Set(preparatory.map(r => r.phone)).size;

        const totalVolunteerHours = volunteers.reduce((sum, r) => sum + calculateDuration(r.checkIn, r.checkOut), 0);
        const avgVolunteerHours = uniqueVolunteers > 0 ? totalVolunteerHours / uniqueVolunteers : 0;

        const traineeDays = new Set(trainees.map(r => `${r.phone}-${new Date(r.checkIn).toISOString().split('T')[0]}`)).size;
        const preparatoryDays = new Set(preparatory.map(r => `${r.phone}-${new Date(r.checkIn).toISOString().split('T')[0]}`)).size;

        // Create temporary div for PDF generation
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.background = 'white';
        tempDiv.style.padding = '30px';
        tempDiv.style.width = '1000px';
        tempDiv.style.fontFamily = 'Tajawal, Arial, sans-serif';
        tempDiv.style.direction = 'rtl';
        
        // Create comprehensive KPI report HTML
        let reportHTML = `
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #96BCB7; padding-bottom: 20px;">
                <h1 style="font-size: 28px; color: #333; margin-bottom: 10px;">تقرير تحليل المؤشرات</h1>
                <h2 style="font-size: 20px; color: #96BCB7; margin-bottom: 5px;">نظام الحضور الذكي</h2>
                <p style="font-size: 14px; color: #666;">التاريخ: ${new Date().toLocaleDateString('ar-SA')} | الوقت: ${new Date().toLocaleTimeString('ar-SA')}</p>
            </div>

            <!-- Main KPIs Section -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 18px; color: #333; margin-bottom: 15px; background: #f5f5f5; padding: 10px; border-right: 4px solid #96BCB7;">المؤشرات الرئيسية</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-right: 4px solid #96BCB7;">
                        <h4 style="color: #96BCB7; margin-bottom: 10px;">المتطوعين</h4>
                        <p style="font-size: 24px; font-weight: bold; color: #333; margin: 5px 0;">${uniqueVolunteers}</p>
                        <p style="color: #666; font-size: 12px;">متوسط الساعات: ${avgVolunteerHours.toFixed(1)}</p>
                    </div>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-right: 4px solid #44556A;">
                        <h4 style="color: #44556A; margin-bottom: 10px;">المتدربين</h4>
                        <p style="font-size: 24px; font-weight: bold; color: #333; margin: 5px 0;">${uniqueTrainees}</p>
                        <p style="color: #666; font-size: 12px;">إجمالي الأيام: ${traineeDays}</p>
                    </div>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-right: 4px solid #E87853;">
                        <h4 style="color: #E87853; margin-bottom: 10px;">التمهير</h4>
                        <p style="font-size: 24px; font-weight: bold; color: #333; margin: 5px 0;">${uniquePreparatory}</p>
                        <p style="color: #666; font-size: 12px;">إجمالي الأيام: ${preparatoryDays}</p>
                    </div>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; border-right: 4px solid #546B68;">
                        <h4 style="color: #546B68; margin-bottom: 10px;">الإجمالي</h4>
                        <p style="font-size: 24px; font-weight: bold; color: #333; margin: 5px 0;">${uniqueVolunteers + uniqueTrainees + uniquePreparatory}</p>
                        <p style="color: #666; font-size: 12px;">الساعات: ${totalVolunteerHours.toFixed(1)}</p>
                    </div>
                </div>
            </div>

            <!-- Detailed Analysis Section -->
            <div style="margin-bottom: 30px;">
                <h3 style="font-size: 18px; color: #333; margin-bottom: 15px; background: #f5f5f5; padding: 10px; border-right: 4px solid #44556A;">التحليل التفصيلي</h3>
                
                <div style="margin-bottom: 20px;">
                    <h4 style="color: #96BCB7; margin-bottom: 10px;">المتطوعين</h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <tr style="background: #96BCB7; color: white;">
                            <td style="padding: 8px; border: 1px solid #ddd;">عدد الجلسات</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">إجمالي الساعات</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">متوسط الجلسة</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${volunteers.length}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalVolunteerHours.toFixed(1)}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${(volunteers.length > 0 ? totalVolunteerHours / volunteers.length : 0).toFixed(1)}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="color: #44556A; margin-bottom: 10px;">المتدربين</h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <tr style="background: #44556A; color: white;">
                            <td style="padding: 8px; border: 1px solid #ddd;">عدد الجلسات</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">إجمالي الأيام</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">نسبة الإنجاز</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${trainees.length}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${traineeDays}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">0%</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 20px;">
                    <h4 style="color: #E87853; margin-bottom: 10px;">التمهير</h4>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <tr style="background: #E87853; color: white;">
                            <td style="padding: 8px; border: 1px solid #ddd;">عدد الجلسات</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">إجمالي الأيام</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">نسبة الإنجاز</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${preparatory.length}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${preparatoryDays}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">0%</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Summary Statistics Section -->
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 18px; color: #333; margin-bottom: 15px; background: #f5f5f5; padding: 10px; border-right: 4px solid #546B68;">إحصائيات عامة</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <tr style="background: #546B68; color: white;">
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">المؤشر</td>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">القيمة</td>
                        <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">الوحدة</td>
                    </tr>
                    <tr style="background: #f9f9f9;">
                        <td style="padding: 8px; border: 1px solid #ddd;">إجمالي المشاركين</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${uniqueVolunteers + uniqueTrainees + uniquePreparatory}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">شخص</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">إجمالي ساعات التطوع</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalVolunteerHours.toFixed(1)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">ساعة</td>
                    </tr>
                    <tr style="background: #f9f9f9;">
                        <td style="padding: 8px; border: 1px solid #ddd;">إجمالي أيام التدريب</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${traineeDays + preparatoryDays}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">يوم</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">متوسط المشاركة اليومية</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${((uniqueVolunteers + uniqueTrainees + uniquePreparatory) / Math.max(1, new Set(data.map(r => new Date(r.checkIn).toDateString())).size)).toFixed(1)}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">شخص/يوم</td>
                    </tr>
                </table>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 12px;">
                <p>تم إنشاء هذا التقرير بواسطة نظام الحضور الذكي</p>
                <p style="margin-top: 5px;">جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
            </div>
        `;

        tempDiv.innerHTML = reportHTML;
        document.body.appendChild(tempDiv);

        // Convert to canvas then to PDF
        html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4'); // Portrait orientation for KPI report
            
            // Calculate dimensions
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 10;

            // Add image to PDF, handle pagination if needed
            doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - 20);

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Save the PDF
            const filename = `تقرير_التحليلات_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(filename);
            
            // Clean up
            document.body.removeChild(tempDiv);
            showLoading(false);
            showAlert('تم تصدير تقرير التحليلات بنجاح');
        }).catch(error => {
            console.error('Error generating KPI PDF:', error);
            document.body.removeChild(tempDiv);
            showLoading(false);
            showAlert('حدث خطأ أثناء تصدير تقرير التحليلات', 'error');
        });

    } catch (error) {
        console.error('Error exporting KPI to PDF:', error);
        showLoading(false);
        showAlert('حدث خطأ أثناء تصدير تقرير التحليلات', 'error');
    }
}
