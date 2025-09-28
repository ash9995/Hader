/* ===============================================
   SMART ATTENDANCE SYSTEM - JAVASCRIPT
   =============================================== */

/* ===============================================
   SYSTEM CONFIGURATION & CONSTANTS
   =============================================== */

const SYSTEM_CONFIG = {
    // List of available cities/branches
    cities: [
        'الدمام', 'الرياض', 'جيزان', 'نجران', 
        'حايل', 'احد رفيده', 'بريدة', 'سكاكا'
    ],
    
    // Admin credentials (in production, this should be handled server-side)
    adminCredentials: {
        username: 'admin',
        password: 'admin123456'
    },
    
    // Default demo data
    defaultData: [
        {
            id: 1,
            city: "الدمام",
            name: "محمد أحمد",
            phone: "0512345678",
            type: "متطوع",
            opportunityType: "توزيع مواد غذائية",
            checkIn: "2024-01-15 08:30:00",
            checkOut: "2024-01-15 16:45:00"
        },
        {
            id: 2,
            city: "الرياض", 
            name: "أحمد علي",
            phone: "0556789123",
            type: "متدرب",
            checkIn: "2024-01-15 09:15:00",
            checkOut: "2024-01-15 17:30:00"
        },
        {
            id: 3,
            city: "الدمام",
            name: "فاطمة محمد", 
            phone: "0551234567",
            type: "تمهير",
            checkIn: "2024-01-16 08:00:00",
            checkOut: "2024-01-16 16:00:00"
        }
    ],
    
    // User data storage keys
    storageKeys: {
        attendanceData: 'attendanceData',
        savedUsers: 'savedUsers',
        selectedCity: 'selectedCity'
    }
};

/* ===============================================
   GLOBAL VARIABLES
   =============================================== */

let attendanceData = []; // Main attendance records
let savedUsers = {}; // Saved user data for trainees and preparatory
let selectedCity = null; // Currently selected city

/* ===============================================
   APPLICATION INITIALIZATION
   =============================================== */

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeApplication();
});

/**
 * Main application initialization function
 */
function initializeApplication() {
    try {
        // Check if city is selected
        selectedCity = localStorage.getItem(SYSTEM_CONFIG.storageKeys.selectedCity);
        
        if (!selectedCity) {
            showCitySelection();
            return;
        }
        
        // Load data from localStorage or use defaults
        loadApplicationData();
        
        // Set current year in footer
        document.getElementById('current-year').textContent = new Date().getFullYear();
        
        // Initialize event listeners
        setupEventListeners();
        
        // Populate city filter dropdown
        populateCityFilter();
        
        // Initialize saved users for auto-complete
        initializeSavedUsers();
        
        // Show main application
        showMainApplication();
        
        console.log('✅ Application initialized successfully for city:', selectedCity);
    } catch (error) {
        console.error('❌ Error initializing application:', error);
        showAlert('حدث خطأ في تحميل النظام', 'error');
    }
}

/* ===============================================
   CITY SELECTION FUNCTIONS
   =============================================== */

/**
 * Show city selection screen
 */
function showCitySelection() {
    document.getElementById('city-selection-screen').style.display = 'flex';
    document.getElementById('main-application').style.display = 'none';
    console.log('🏢 Showing city selection screen');
}

/**
 * Show main application
 */
function showMainApplication() {
    document.getElementById('city-selection-screen').style.display = 'none';
    document.getElementById('main-application').style.display = 'flex';
    
    // Update selected city display
    const cityDisplay = document.getElementById('selected-city-display');
    if (cityDisplay) {
        cityDisplay.textContent = `الفرع المحدد: ${selectedCity}`;
    }
    
    console.log('🏠 Showing main application');
}

/**
 * Handle city selection
 * @param {string} city - Selected city name
 */
function selectCity(city) {
    showLoading(true);
    
    try {
        // Store selected city
        selectedCity = city;
        localStorage.setItem(SYSTEM_CONFIG.storageKeys.selectedCity, city);
        
        // Load application data
        loadApplicationData();
        
        // Set current year in footer
        document.getElementById('current-year').textContent = new Date().getFullYear();
        
        // Initialize event listeners
        setupEventListeners();
        
        // Populate city filter dropdown
        populateCityFilter();
        
        // Initialize saved users for auto-complete
        initializeSavedUsers();
        
        // Show main application after delay
        setTimeout(() => {
            showMainApplication();
            showLoading(false);
            showAlert(`تم اختيار فرع ${city} بنجاح`);
        }, 500);
        
        console.log('🏢 City selected:', city);
        
    } catch (error) {
        console.error('❌ Error selecting city:', error);
        showAlert('حدث خطأ في اختيار الفرع', 'error');
        showLoading(false);
    }
}

/**
 * Change city - go back to city selection
 */
function changeCity() {
    if (confirm('هل تريد تغيير الفرع؟ سيتم العودة إلى شاشة اختيار الفرع.')) {
        selectedCity = null;
        localStorage.removeItem(SYSTEM_CONFIG.storageKeys.selectedCity);
        showCitySelection();
        console.log('🔄 Returning to city selection');
    }
}

/**
 * Load application data from localStorage or use defaults
 */
function loadApplicationData() {
    try {
        // Load attendance data
        const storedData = localStorage.getItem(SYSTEM_CONFIG.storageKeys.attendanceData);
        attendanceData = storedData ? JSON.parse(storedData) : [...SYSTEM_CONFIG.defaultData];
        
        // Initialize saved users from actual attendance data
        savedUsers = initializeSavedUsersFromData();
        
        console.log('📊 Data loaded - Attendance records:', attendanceData.length);
    } catch (error) {
        console.error('❌ Error loading data:', error);
        // Fallback to default data
        attendanceData = [...SYSTEM_CONFIG.defaultData];
        savedUsers = { 'متدرب': [], 'تمهير': [] };
    }
}

/**
 * Initialize saved users from actual attendance data
 * @returns {Object} Saved users object
 */
function initializeSavedUsersFromData() {
    const users = { 'متدرب': [], 'تمهير': [] };
    
    // Extract unique users from attendance data
    const userMap = new Map();
    
    attendanceData.forEach(record => {
        if (record.type === 'متدرب' || record.type === 'تمهير') {
            const key = `${record.phone}-${record.type}`;
            if (!userMap.has(key)) {
                userMap.set(key, {
                    name: record.name,
                    phone: record.phone,
                    type: record.type
                });
            }
        }
    });
    
    // Group by type
    userMap.forEach(user => {
        users[user.type].push({
            name: user.name,
            phone: user.phone
        });
    });
    
    return users;
}

/**
 * Save application data to localStorage
 */
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

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // User type change handler
    const userTypeSelect = document.getElementById('user-type');
    if (userTypeSelect) {
        userTypeSelect.addEventListener('change', handleUserTypeChange);
    }
    
    // Period filter change handler
    const periodFilter = document.getElementById('period-filter');
    if (periodFilter) {
        periodFilter.addEventListener('change', handlePeriodFilterChange);
    }
    
    // Form submission handlers
    const checkinForm = document.getElementById('checkin-form');
    if (checkinForm) {
        checkinForm.addEventListener('submit', handleCheckInSubmission);
    }
    
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckOutSubmission);
    }
    
    // Filter change handlers
    const cityFilter = document.getElementById('city-filter');
    if (cityFilter) {
        cityFilter.addEventListener('change', updateDashboard);
    }
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', updateAttendanceTable);
    }
    
    // Setup overlay closing handlers
    setupOverlayHandlers();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    console.log('🔗 Event listeners setup completed');
}

/**
 * Handle user type selection change
 */
function handleUserTypeChange(event) {
    const selectedType = event.target.value;
    const opportunityField = document.getElementById('opportunity-type-container');
    const opportunityInput = document.getElementById('opportunity-type');
    
    // Show/hide opportunity type field for volunteers
    if (selectedType === 'متطوع') {
        opportunityField.style.display = 'block';
        opportunityInput.required = true;
        clearAutoFilledData();
    } else {
        opportunityField.style.display = 'none';
        opportunityInput.required = false;
        opportunityInput.value = '';
    }
    
    // Setup auto-complete for trainees and preparatory
    if (selectedType === 'متدرب' || selectedType === 'تمهير') {
        setupAutoComplete(selectedType);
    }
    
    console.log('👤 User type changed to:', selectedType);
}

/**
 * Handle period filter change
 */
function handlePeriodFilterChange(event) {
    const selectedPeriod = event.target.value;
    const customDateRange = document.getElementById('custom-date-range');
    
    // Show/hide custom date range
    if (selectedPeriod === 'custom') {
        customDateRange.style.display = 'block';
        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        document.getElementById('date-from').value = weekAgo;
        document.getElementById('date-to').value = today;
    } else {
        customDateRange.style.display = 'none';
    }
    
    // Update dashboard with new filter
    updateDashboard();
    console.log('📅 Period filter changed to:', selectedPeriod);
}

/* ===============================================
   FORM MANAGEMENT FUNCTIONS
   =============================================== */

/**
 * Show form overlay
 * @param {string} formType - Type of form to show (checkin/checkout)
 */
function showForm(formType) {
    const overlay = document.getElementById(formType + '-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus on first input field
        const firstInput = overlay.querySelector('input, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
        
        console.log('📝 Form opened:', formType);
    }
}

/**
 * Hide form overlay
 * @param {string} formType - Type of form to hide (checkin/checkout)
 */
function hideForm(formType) {
    const overlay = document.getElementById(formType + '-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById(formType + '-form');
        if (form) {
            form.reset();
            if (formType === 'checkin') {
                document.getElementById('opportunity-type-container').style.display = 'none';
                document.getElementById('user-type').value = '';
            }
        }
        
        console.log('❌ Form closed:', formType);
    }
}

/**
 * Show admin panel
 */
function showAdmin() {
    const overlay = document.getElementById('admin-overlay');
    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateDashboard();
        console.log('🔧 Admin panel opened');
    }
}

/**
 * Hide admin panel
 */
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

/**
 * Initialize saved users for faster check-in
 */
function initializeSavedUsers() {
    // Ensure saved users structure exists
    if (!savedUsers['متدرب']) savedUsers['متدرب'] = [];
    if (!savedUsers['تمهير']) savedUsers['تمهير'] = [];
    
    // Update checkout suggestions with all users
    updateCheckoutSuggestions();
    
    console.log('🔄 Auto-complete initialized');
}

/**
 * Setup auto-complete for name and phone fields
 * @param {string} userType - Type of user (متدرب/تمهير)
 */
function setupAutoComplete(userType) {
    if (!savedUsers[userType] || savedUsers[userType].length === 0) {
        return;
    }
    
    const nameField = document.getElementById('checkin-name');
    const phoneField = document.getElementById('checkin-phone');
    const nameSuggestions = document.getElementById('name-suggestions');
    const phoneSuggestions = document.getElementById('phone-suggestions');
    
    // Clear previous suggestions
    nameSuggestions.innerHTML = '';
    phoneSuggestions.innerHTML = '';
    
    // Populate suggestions
    savedUsers[userType].forEach(user => {
        // Name suggestions
        const nameOption = document.createElement('option');
        nameOption.value = user.name;
        nameSuggestions.appendChild(nameOption);
        
        // Phone suggestions
        const phoneOption = document.createElement('option');
        phoneOption.value = user.phone;
        phoneSuggestions.appendChild(phoneOption);
    });
    
    // Setup auto-fill handlers
    nameField.addEventListener('input', function() {
        const selectedUser = savedUsers[userType].find(user => user.name === this.value);
        if (selectedUser) {
            phoneField.value = selectedUser.phone;
            console.log('📞 Auto-filled phone for:', selectedUser.name);
        }
    });
    
    phoneField.addEventListener('input', function() {
        const selectedUser = savedUsers[userType].find(user => user.phone === this.value);
        if (selectedUser) {
            nameField.value = selectedUser.name;
            console.log('👤 Auto-filled name for:', selectedUser.phone);
        }
    });
    
    console.log('✨ Auto-complete setup for:', userType, '- Users:', savedUsers[userType].length);
}

/**
 * Update checkout form with phone number suggestions
 */
function updateCheckoutSuggestions() {
    const checkoutSuggestions = document.getElementById('checkout-phone-suggestions');
    if (!checkoutSuggestions) return;
    
    checkoutSuggestions.innerHTML = '';
    
    // Get today's checked-in users who haven't checked out
    const today = new Date().toISOString().split('T')[0];
    const activeUsers = attendanceData.filter(record => 
        record.checkIn && 
        record.checkIn.startsWith(today) && 
        !record.checkOut
    );
    
    activeUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.phone;
        option.textContent = `${user.phone} - ${user.name}`;
        checkoutSuggestions.appendChild(option);
    });
    
    console.log('🔄 Checkout suggestions updated:', activeUsers.length, 'active users');
}

/**
 * Clear auto-filled data
 */
function clearAutoFilledData() {
    const nameField = document.getElementById('checkin-name');
    const phoneField = document.getElementById('checkin-phone');
    
    if (nameField) nameField.value = '';
    if (phoneField) phoneField.value = '';
}

/* ===============================================
   CHECK-IN/CHECK-OUT PROCESSING
   =============================================== */

/**
 * Handle check-in form submission
 * @param {Event} event - Form submission event
 */
function handleCheckInSubmission(event) {
    event.preventDefault();
    showLoading(true);
    
    try {
        const formData = getCheckInFormData();
        
        // Validate form data
        const validation = validateCheckInData(formData);
        if (!validation.isValid) {
            showAlert(validation.message, 'error');
            showLoading(false);
            return;
        }
        
        // Check for existing check-in
        if (hasExistingCheckIn(formData.phone)) {
            showAlert('هذا الرقم مسجل بالفعل اليوم ولم يسجل خروج', 'error');
            showLoading(false);
            return;
        }
        
        // Save user for future auto-complete (trainees and preparatory only)
        if (formData.type === 'متدرب' || formData.type === 'تمهير') {
            saveUserData(formData);
        }
        
        // Create and save new attendance record
        const newRecord = createAttendanceRecord(formData);
        attendanceData.push(newRecord);
        saveApplicationData();
        
        // Update UI and show success message
        updateCheckoutSuggestions();
        hideForm('checkin');
        showAlert(`تم تسجيل حضور ${formData.name} بنجاح`);
        
        console.log('✅ Check-in successful for:', formData.name);
        
    } catch (error) {
        console.error('❌ Check-in error:', error);
        showAlert('حدث خطأ أثناء تسجيل الحضور', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Handle check-out form submission
 * @param {Event} event - Form submission event
 */
function handleCheckOutSubmission(event) {
    event.preventDefault();
    showLoading(true);
    
    try {
        const phone = document.getElementById('checkout-phone').value.trim();
        
        // Validate phone number
        if (!phone) {
            showAlert('الرجاء إدخال رقم الجوال', 'error');
            showLoading(false);
            return;
        }
        
        // Find active attendance record
        const recordIndex = findActiveRecord(phone);
        
        if (recordIndex === -1) {
            showAlert('لا يوجد حضور مسجل لهذا الرقم أو تم تسجيل الخروج مسبقاً', 'error');
            showLoading(false);
            return;
        }
        
        // Update record with check-out time
        attendanceData[recordIndex].checkOut = getCurrentDateTime();
        saveApplicationData();
        
        // Update UI and show success message
        updateCheckoutSuggestions();
        hideForm('checkout');
        showAlert(`تم تسجيل خروج ${attendanceData[recordIndex].name} بنجاح`);
        
        console.log('✅ Check-out successful for:', attendanceData[recordIndex].name);
        
    } catch (error) {
        console.error('❌ Check-out error:', error);
        showAlert('حدث خطأ أثناء تسجيل الخروج', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Get check-in form data
 * @returns {Object} Form data object
 */
function getCheckInFormData() {
    return {
        city: selectedCity, // Use the selected city instead of hardcoding
        name: document.getElementById('checkin-name').value.trim(),
        phone: document.getElementById('checkin-phone').value.trim(),
        type: document.getElementById('user-type').value,
        opportunityType: document.getElementById('opportunity-type').value.trim() || null
    };
}

/**
 * Check if user already has an active check-in today
 * @param {string} phone - Phone number to check
 * @returns {boolean} True if has existing check-in
 */
function hasExistingCheckIn(phone) {
    const today = new Date().toISOString().split('T')[0];
    return attendanceData.some(record => 
        record.phone === phone && 
        record.city === selectedCity && // Use selected city
        record.checkIn && 
        record.checkIn.startsWith(today) && 
        !record.checkOut
    );
}

/**
 * Find active attendance record for today
 * @param {string} phone - Phone number to search
 * @returns {number} Record index or -1 if not found
 */
function findActiveRecord(phone) {
    const today = new Date().toISOString().split('T')[0];
    return attendanceData.findIndex(record => 
        record.phone === phone && 
        record.city === selectedCity && // Use selected city
        record.checkIn && 
        record.checkIn.startsWith(today) && 
        !record.checkOut
    );
}

/**
 * Validate check-in data
 * @param {Object} data - Form data to validate
 * @returns {Object} Validation result
 */
function validateCheckInData(data) {
    if (!data.name || !data.phone || !data.type) {
        return { isValid: false, message: 'الرجاء إدخال جميع البيانات المطلوبة' };
    }
    
    if (!/^05\d{8}$/.test(data.phone)) {
        return { isValid: false, message: 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' };
    }
    
    if (data.type === 'متطوع' && !data.opportunityType) {
        return { isValid: false, message: 'الرجاء إدخال نوع الفرصة التطوعية' };
    }
    
    return { isValid: true };
}

/**
 * Save user data for future auto-complete
 * @param {Object} formData - User data to save
 */
function saveUserData(formData) {
    const userType = formData.type;
    const existingUser = savedUsers[userType].find(user => user.phone === formData.phone);
    
    if (!existingUser) {
        savedUsers[userType].push({
            name: formData.name,
            phone: formData.phone
        });
        console.log('💾 User saved for auto-complete:', formData.name);
    }
}

/**
 * Create new attendance record
 * @param {Object} formData - Form data
 * @returns {Object} New attendance record
 */
function createAttendanceRecord(formData) {
    return {
        id: attendanceData.length > 0 ? Math.max(...attendanceData.map(r => r.id)) + 1 : 1,
        city: formData.city,
        name: formData.name,
        phone: formData.phone,
        type: formData.type,
        opportunityType: formData.opportunityType,
        checkIn: getCurrentDateTime(),
        checkOut: null
    };
}

/**
 * Update entire dashboard including KPIs and table
 */
function updateDashboard() {
    updateKPIs();
    updateCategoryKPIs();
    updateAttendanceTable();
    console.log('📊 Dashboard updated');
}

/**
 * Update main KPI cards
 */
function updateKPIs() {
    const filteredData = getFilteredAttendanceData();
    
    // Calculate category counts
    const volunteerCount = filteredData.filter(r => r.type === 'متطوع').length;
    const traineeCount = filteredData.filter(r => r.type === 'متدرب').length;
    const preparatoryCount = filteredData.filter(r => r.type === 'تمهير').length;
    const totalCount = filteredData.length;
    
    // Calculate averages and totals
    const volunteerAvgHours = calculateAverageHours(filteredData.filter(r => r.type === 'متطوع'));
    const traineeAvgDays = calculateAverageDays(filteredData.filter(r => r.type === 'متدرب'));
    const preparatoryAvgDays = calculateAverageDays(filteredData.filter(r => r.type === 'تمهير'));
    const totalHours = calculateTotalHours(filteredData);
    
    // Update KPI displays
    updateKPIElement('volunteers-count', volunteerCount);
    updateKPIElement('volunteers-avg', `متوسط: ${volunteerAvgHours} ساعة`);
    
    updateKPIElement('trainees-count', traineeCount);
    updateKPIElement('trainees-days', `متوسط الأيام: ${traineeAvgDays}`);
    
    updateKPIElement('preparatory-count', preparatoryCount);
    updateKPIElement('preparatory-days', `متوسط الأيام: ${preparatoryAvgDays}`);
    
    updateKPIElement('total-count', totalCount);
    updateKPIElement('total-hours', `إجمالي الساعات: ${totalHours}`);
}

/**
 * Update detailed category KPIs
 */
function updateCategoryKPIs() {
    const filteredData = getFilteredAttendanceData();
    
    // Calculate volunteers KPIs
    const volunteersData = filteredData.filter(r => r.type === 'متطوع');
    const volunteersStats = calculateCategoryStats(volunteersData, 'متطوع');
    
    updateKPIElement('volunteers-sessions', volunteersStats.totalSessions);
    updateKPIElement('volunteers-hours', volunteersStats.totalHours.toFixed(1));
    updateKPIElement('volunteers-avg-session', volunteersStats.avgSessionHours + ' ساعة');
    
    // Calculate trainees KPIs
    const traineesData = filteredData.filter(r => r.type === 'متدرب');
    const traineesStats = calculateCategoryStats(traineesData, 'متدرب');
    
    updateKPIElement('trainees-sessions', traineesStats.totalSessions);
    updateKPIElement('trainees-total-days', traineesStats.uniqueDays);
    updateKPIElement('trainees-completion', traineesStats.completionRate + '%');
    
    // Calculate preparatory KPIs
    const preparatoryData = filteredData.filter(r => r.type === 'تمهير');
    const preparatoryStats = calculateCategoryStats(preparatoryData, 'تمهير');
    
    updateKPIElement('preparatory-sessions', preparatoryStats.totalSessions);
    updateKPIElement('preparatory-total-days', preparatoryStats.uniqueDays);
    updateKPIElement('preparatory-completion', preparatoryStats.completionRate + '%');
    
    console.log('📈 Category KPIs updated');
}

/**
 * Calculate detailed statistics for a category
 * @param {Array} data - Category data
 * @param {string} type - Category type
 * @returns {Object} Category statistics
 */
function calculateCategoryStats(data, type) {
    const totalSessions = data.length;
    const completedSessions = data.filter(r => r.checkOut).length;
    const totalHours = calculateTotalHours(data);
    const avgSessionHours = completedSessions > 0 ? (totalHours / completedSessions).toFixed(1) : 0;
    
    // Calculate unique days
    const uniqueDaysSet = new Set();
    data.forEach(record => {
        if (record.checkIn) {
            uniqueDaysSet.add(record.checkIn.split(' ')[0]);
        }
    });
    const uniqueDays = uniqueDaysSet.size;
    
    // Calculate completion rate based on expected program duration
    let completionRate = 0;
    if (type === 'متدرب' || type === 'تمهير') {
        // Assuming 6-month program (approximately 180 days)
        const expectedDays = 180;
        completionRate = Math.min(Math.round((uniqueDays / expectedDays) * 100), 100);
    } else if (type === 'متطوع') {
        // For volunteers, completion rate is based on completed sessions
        completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    }
    
    return {
        totalSessions,
        completedSessions,
        totalHours,
        avgSessionHours,
        uniqueDays,
        completionRate
    };
}

/**
 * Update KPI element
 * @param {string} elementId - Element ID
 * @param {string|number} value - Value to display
 */
function updateKPIElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

/* ===============================================
   CALCULATION FUNCTIONS
   =============================================== */

/**
 * Calculate average hours for volunteer records
 * @param {Array} records - Volunteer records
 * @returns {number} Average hours
 */
function calculateAverageHours(records) {
    const completedRecords = records.filter(r => r.checkOut);
    if (completedRecords.length === 0) return 0;
    
    const totalHours = completedRecords.reduce((sum, record) => {
        return sum + calculateSessionHours(record.checkIn, record.checkOut);
    }, 0);
    
    return (totalHours / completedRecords.length).toFixed(1);
}

/**
 * Calculate average days for trainee/preparatory records
 * @param {Array} records - Records to analyze
 * @returns {number} Average unique days
 */
function calculateAverageDays(records) {
    if (records.length === 0) return 0;
    
    const userDays = new Map();
    
    records.forEach(record => {
        const userKey = record.phone;
        const date = record.checkIn.split(' ')[0];
        
        if (!userDays.has(userKey)) {
            userDays.set(userKey, new Set());
        }
        userDays.get(userKey).add(date);
    });
    
    const totalUniqueDays = Array.from(userDays.values()).reduce((sum, days) => sum + days.size, 0);
    return Math.round(totalUniqueDays / userDays.size);
}

/**
 * Calculate total hours for all records
 * @param {Array} records - All records
 * @returns {number} Total hours
 */
function calculateTotalHours(records) {
    const completedRecords = records.filter(r => r.checkOut);
    const totalHours = completedRecords.reduce((sum, record) => {
        return sum + calculateSessionHours(record.checkIn, record.checkOut);
    }, 0);
    
    return Math.round(totalHours);
}

/**
 * Calculate session hours between check-in and check-out
 * @param {string} checkIn - Check-in datetime string
 * @param {string} checkOut - Check-out datetime string
 * @returns {number} Hours between check-in and check-out
 */
function calculateSessionHours(checkIn, checkOut) {
    if (!checkOut) return 0;
    
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffMs = checkOutTime - checkInTime;
    
    return diffMs / (1000 * 60 * 60); // Convert to hours
}

/* ===============================================
   DATA FILTERING FUNCTIONS
   =============================================== */

/**
 * Get filtered attendance data based on current filters
 * @returns {Array} Filtered attendance data
 */
function getFilteredAttendanceData() {
    const cityFilter = document.getElementById('city-filter')?.value || 'all';
    const periodFilter = document.getElementById('period-filter')?.value || 'today';
    
    let filteredData = attendanceData;
    
    // Filter by city
    if (cityFilter !== 'all') {
        filteredData = filteredData.filter(record => record.city === cityFilter);
    }
    
    // Filter by period
    filteredData = filterByPeriod(filteredData, periodFilter);
    
    return filteredData;
}

/**
 * Filter data by time period
 * @param {Array} data - Data to filter
 * @param {string} period - Period filter value
 * @returns {Array} Filtered data
 */
function filterByPeriod(data, period) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch (period) {
        case 'today':
            return data.filter(record => 
                record.checkIn && record.checkIn.startsWith(today)
            );
            
        case 'this-week':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekStartStr = weekStart.toISOString().split('T')[0];
            return data.filter(record => 
                record.checkIn && record.checkIn >= weekStartStr
            );
            
        case 'this-month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            return data.filter(record => 
                record.checkIn && record.checkIn >= monthStart
            );
            
        case 'last-month':
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            return data.filter(record => {
                if (!record.checkIn) return false;
                const recordDate = new Date(record.checkIn);
                return recordDate >= lastMonthStart && recordDate <= lastMonthEnd;
            });
            
        case 'last-3-months':
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
            return data.filter(record => 
                record.checkIn && record.checkIn >= threeMonthsAgo
            );
            
        case 'last-6-months':
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];
            return data.filter(record => 
                record.checkIn && record.checkIn >= sixMonthsAgo
            );
            
        case 'custom':
            const dateFrom = document.getElementById('date-from')?.value;
            const dateTo = document.getElementById('date-to')?.value;
            
            if (!dateFrom && !dateTo) return data;
            
            return data.filter(record => {
                if (!record.checkIn) return false;
                const recordDate = record.checkIn.split(' ')[0];
                
                if (dateFrom && dateTo) {
                    return recordDate >= dateFrom && recordDate <= dateTo;
                } else if (dateFrom) {
                    return recordDate >= dateFrom;
                } else if (dateTo) {
                    return recordDate <= dateTo;
                }
                return true;
            });
            
        default:
            return data;
    }
}

/* ===============================================
   TABLE MANAGEMENT FUNCTIONS
   =============================================== */

/**
 * Update attendance table
 */
function updateAttendanceTable() {
    const filteredData = getFilteredAttendanceData();
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    
    let displayData = filteredData;
    if (categoryFilter !== 'all') {
        displayData = filteredData.filter(record => record.type === categoryFilter);
    }
    
    const tableBody = document.querySelector('#attendance-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Sort by check-in time (newest first)
    displayData.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
    
    displayData.forEach(record => {
        const row = createTableRow(record);
        tableBody.appendChild(row);
    });
    
    console.log('📋 Table updated with', displayData.length, 'records');
}

/**
 * Create table row element
 * @param {Object} record - Attendance record
 * @returns {HTMLElement} Table row element
 */
function createTableRow(record) {
    const row = document.createElement('tr');
    
    // Calculate unique days for this user
    const userDays = calculateUserUniqueDays(record.phone, record.type);
    
    row.innerHTML = `
        <td>${record.city}</td>
        <td>${record.name}</td>
        <td>${record.phone}</td>
        <td>${formatUserType(record.type, record.opportunityType)}</td>
        <td>${formatDateTime(record.checkIn)}</td>
        <td>${record.checkOut ? formatDateTime(record.checkOut) : 'لم يخرج بعد'}</td>
        <td>${calculateDuration(record.checkIn, record.checkOut)}</td>
        <td>${userDays} يوم</td>
        <td>
            <button class="btn btn-reset" onclick="deleteRecord(${record.id})" style="padding: 8px 12px; font-size: 0.9rem; min-width: auto;">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

/**
 * Calculate unique days for a specific user
 * @param {string} phone - User phone number
 * @param {string} type - User type
 * @returns {number} Number of unique days
 */
function calculateUserUniqueDays(phone, type) {
    const userRecords = attendanceData.filter(record => record.phone === phone && record.type === type);
    const uniqueDays = new Set();
    
    userRecords.forEach(record => {
        if (record.checkIn) {
            const date = record.checkIn.split(' ')[0];
            uniqueDays.add(date);
        }
    });
    
    return uniqueDays.size;
}

/* ===============================================
   EXPORT FUNCTIONS
   =============================================== */

/**
 * Export data to Excel (CSV format)
 */
function exportToExcel() {
    showLoading(true);
    
    try {
        const categoryFilter = document.getElementById('category-filter')?.value || 'all';
        let data = getFilteredAttendanceData();
        
        if (categoryFilter !== 'all') {
            data = data.filter(record => record.type === categoryFilter);
        }
        
        if (data.length === 0) {
            showAlert('لا توجد بيانات لتصديرها', 'error');
            showLoading(false);
            return;
        }
        
        // Generate CSV content
        const csv = generateCSVContent(data);
        
        // Create and download file
        downloadCSVFile(csv, categoryFilter);
        
        showAlert('تم تصدير البيانات إلى Excel بنجاح', 'success');
        console.log('📊 Excel export successful:', data.length, 'records');
        
    } catch (error) {
        console.error('❌ Excel export error:', error);
        showAlert('حدث خطأ أثناء تصدير البيانات', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Export data to PDF
 */
function exportToPDF() {
    showLoading(true);
    
    try {
        const categoryFilter = document.getElementById('category-filter')?.value || 'all';
        let data = getFilteredAttendanceData();
        
        if (categoryFilter !== 'all') {
            data = data.filter(record => record.type === categoryFilter);
        }
        
        if (data.length === 0) {
            showAlert('لا توجد بيانات لتصديرها', 'error');
            showLoading(false);
            return;
        }
        
        // Generate PDF content
        const pdfContent = generatePDFContent(data, categoryFilter);
        
        // Open print dialog for PDF saving
        const printWindow = window.open('', '_blank');
        printWindow.document.open();
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.print();
        };
        
        showAlert('تم فتح نافذة الطباعة، يمكنك حفظ التقرير كـ PDF', 'success');
        console.log('📄 PDF export initiated:', data.length, 'records');
        
    } catch (error) {
        console.error('❌ PDF export error:', error);
        showAlert('حدث خطأ أثناء تصدير PDF', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Generate CSV content
 * @param {Array} data - Data to export
 * @returns {string} CSV content
 */
function generateCSVContent(data) {
    let csv = 'الفرع,الاسم,رقم الجوال,النوع,وقت الدخول,وقت الخروج,المدة,عدد الأيام\n';
    
    data.forEach(record => {
        const userDays = calculateUserUniqueDays(record.phone, record.type);
        
        csv += `"${record.city}","${record.name}","${record.phone}",`;
        csv += `"${formatUserType(record.type, record.opportunityType)}",`;
        csv += `"${formatDateTime(record.checkIn)}",`;
        csv += `"${record.checkOut ? formatDateTime(record.checkOut) : 'لم يخرج بعد'}",`;
        csv += `"${calculateDuration(record.checkIn, record.checkOut)}",`;
        csv += `"${userDays} يوم"\n`;
    });
    
    return csv;
}

/**
 * Generate PDF content
 * @param {Array} data - Data to export
 * @param {string} category - Selected category
 * @returns {string} PDF HTML content
 */
function generatePDFContent(data, category) {
    const categoryName = category === 'all' ? 'جميع الفئات' : category;
    const currentDate = formatDateTime(getCurrentDateTime());
    
    let tableRows = '';
    data.forEach(record => {
        const userDays = calculateUserUniqueDays(record.phone, record.type);
        
        tableRows += `
            <tr>
                <td>${record.city}</td>
                <td>${record.name}</td>
                <td>${record.phone}</td>
                <td>${formatUserType(record.type, record.opportunityType)}</td>
                <td>${formatDateTime(record.checkIn)}</td>
                <td>${record.checkOut ? formatDateTime(record.checkOut) : 'لم يخرج بعد'}</td>
                <td>${calculateDuration(record.checkIn, record.checkOut)}</td>
                <td>${userDays} يوم</td>
            </tr>
        `;
    });
    
    return `
        <html>
        <head>
            <title>تقرير الحضور</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&display=swap');
                body { 
                    font-family: 'Tajawal', sans-serif; 
                    direction: rtl; 
                    margin: 20px;
                }
                h1 { 
                    text-align: center; 
                    color: #36E39B; 
                    margin-bottom: 30px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px; 
                }
                th { 
                    background-color: #36E39B; 
                    color: black; 
                    padding: 12px 8px; 
                    text-align: right; 
                    border: 1px solid #ddd;
                    font-weight: 600;
                }
                td { 
                    padding: 10px 8px; 
                    border: 1px solid #ddd; 
                    text-align: right; 
                    font-size: 14px;
                }
                tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                }
                .footer { 
                    text-align: center; 
                    margin-top: 30px; 
                    font-size: 12px; 
                    color: #666; 
                }
                .info-box {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border: 1px solid #e9ecef;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>تقرير الحضور والانصراف</h1>
                <div class="info-box">
                    <p><strong>الفئة:</strong> ${categoryName}</p>
                    <p><strong>تاريخ التقرير:</strong> ${currentDate}</p>
                    <p><strong>عدد السجلات:</strong> ${data.length}</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>الفرع</th>
                        <th>الاسم</th>
                        <th>رقم الجوال</th>
                        <th>النوع</th>
                        <th>وقت الدخول</th>
                        <th>وقت الخروج</th>
                        <th>المدة</th>
                        <th>عدد الأيام</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            
            <div class="footer">
                <p>تم إنشاء التقرير بواسطة نظام الحضور الذكي</p>
                <p>تطوير: عائشة راشد الشمري - ${new Date().getFullYear()} © جميع الحقوق محفوظة</p>
            </div>
        </body>
        </html>
    `;
}

/**
 * Download CSV file
 * @param {string} csv - CSV content
 * @param {string} category - Selected category
 */
function downloadCSVFile(csv, category) {
    const categoryName = category === 'all' ? 'جميع_الفئات' : category;
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `حضور_${categoryName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

/* ===============================================
   DATA MANAGEMENT FUNCTIONS
   =============================================== */

/**
 * Export KPI data to Excel (CSV format)
 */
function exportKPIToExcel() {
    showLoading(true);
    
    try {
        const filteredData = getFilteredAttendanceData();
        const kpiData = generateKPIData(filteredData);
        
        if (kpiData.length === 0) {
            showAlert('لا توجد بيانات تحليلية لتصديرها', 'error');
            showLoading(false);
            return;
        }
        
        // Generate CSV content for KPIs
        const csv = generateKPICSVContent(kpiData);
        
        // Create and download file
        downloadKPICSVFile(csv);
        
        showAlert('تم تصدير التحليلات إلى Excel بنجاح', 'success');
        console.log('📊 KPI Excel export successful');
        
    } catch (error) {
        console.error('❌ KPI Excel export error:', error);
        showAlert('حدث خطأ أثناء تصدير التحليلات', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Export KPI data to PDF
 */
function exportKPIToPDF() {
    showLoading(true);
    
    try {
        const filteredData = getFilteredAttendanceData();
        const kpiData = generateKPIData(filteredData);
        
        if (kpiData.length === 0) {
            showAlert('لا توجد بيانات تحليلية لتصديرها', 'error');
            showLoading(false);
            return;
        }
        
        // Generate PDF content for KPIs
        const pdfContent = generateKPIPDFContent(kpiData);
        
        // Open print dialog for PDF saving
        const printWindow = window.open('', '_blank');
        printWindow.document.open();
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.print();
        };
        
        showAlert('تم فتح نافذة الطباعة للتحليلات، يمكنك حفظ التقرير كـ PDF', 'success');
        console.log('📄 KPI PDF export initiated');
        
    } catch (error) {
        console.error('❌ KPI PDF export error:', error);
        showAlert('حدث خطأ أثناء تصدير تحليلات PDF', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Generate KPI data for export
 * @param {Array} data - Filtered attendance data
 * @returns {Array} KPI data array
 */
function generateKPIData(data) {
    const categories = ['متطوع', 'متدرب', 'تمهير'];
    const kpiData = [];
    
    categories.forEach(category => {
        const categoryData = data.filter(r => r.type === category);
        if (categoryData.length > 0) {
            const stats = calculateCategoryStats(categoryData, category);
            
            kpiData.push({
                category: category,
                totalSessions: stats.totalSessions,
                completedSessions: stats.completedSessions,
                totalHours: stats.totalHours.toFixed(2),
                avgSessionHours: stats.avgSessionHours,
                uniqueDays: stats.uniqueDays,
                completionRate: stats.completionRate,
                activeUsers: getUniqueUsers(categoryData).length
            });
        }
    });
    
    return kpiData;
}

/**
 * Get unique users from data
 * @param {Array} data - Category data
 * @returns {Array} Unique users
 */
function getUniqueUsers(data) {
    const uniqueUsers = new Map();
    
    data.forEach(record => {
        const key = `${record.phone}-${record.name}`;
        if (!uniqueUsers.has(key)) {
            uniqueUsers.set(key, {
                name: record.name,
                phone: record.phone,
                type: record.type
            });
        }
    });
    
    return Array.from(uniqueUsers.values());
}

/**
 * Generate CSV content for KPIs
 * @param {Array} kpiData - KPI data
 * @returns {string} CSV content
 */
function generateKPICSVContent(kpiData) {
    let csv = 'الفئة,إجمالي الجلسات,الجلسات المكتملة,إجمالي الساعات,متوسط الجلسة,الأيام الفريدة,نسبة الإنجاز,المستخدمين النشطين\n';
    
    kpiData.forEach(item => {
        csv += `"${item.category}","${item.totalSessions}","${item.completedSessions}",`;
        csv += `"${item.totalHours}","${item.avgSessionHours}","${item.uniqueDays}",`;
        csv += `"${item.completionRate}%","${item.activeUsers}"\n`;
    });
    
    return csv;
}

/**
 * Generate PDF content for KPIs
 * @param {Array} kpiData - KPI data
 * @returns {string} PDF HTML content
 */
function generateKPIPDFContent(kpiData) {
    const currentDate = formatDateTime(getCurrentDateTime());
    
    let tableRows = '';
    kpiData.forEach(item => {
        tableRows += `
            <tr>
                <td>${item.category}</td>
                <td>${item.totalSessions}</td>
                <td>${item.completedSessions}</td>
                <td>${item.totalHours}</td>
                <td>${item.avgSessionHours} ساعة</td>
                <td>${item.uniqueDays}</td>
                <td>${item.completionRate}%</td>
                <td>${item.activeUsers}</td>
            </tr>
        `;
    });
    
    return `
        <html>
        <head>
            <title>تقرير التحليلات والمؤشرات</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700&display=swap');
                body { 
                    font-family: 'Tajawal', sans-serif; 
                    direction: rtl; 
                    margin: 20px;
                    color: #212529;
                }
                h1 { 
                    text-align: center; 
                    color: #96BCB7; 
                    margin-bottom: 30px;
                    font-size: 28px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px; 
                }
                th { 
                    background-color: #96BCB7; 
                    color: white; 
                    padding: 12px 8px; 
                    text-align: right; 
                    border: 1px solid #ddd;
                    font-weight: 600;
                }
                td { 
                    padding: 10px 8px; 
                    border: 1px solid #ddd; 
                    text-align: right; 
                    font-size: 14px;
                }
                tr:nth-child(even) {
                    background-color: #F0F0F0;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                }
                .footer { 
                    text-align: center; 
                    margin-top: 30px; 
                    font-size: 12px; 
                    color: #666; 
                }
                .info-box {
                    background: #F0F0F0;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border: 1px solid #e9ecef;
                }
                .category-volunteers { color: #96BCB7; font-weight: bold; }
                .category-trainees { color: #44556A; font-weight: bold; }
                .category-preparatory { color: #E87853; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>تقرير التحليلات والمؤشرات الرئيسية</h1>
                <div class="info-box">
                    <p><strong>تاريخ التقرير:</strong> ${currentDate}</p>
                    <p><strong>عدد الفئات:</strong> ${kpiData.length}</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>الفئة</th>
                        <th>إجمالي الجلسات</th>
                        <th>الجلسات المكتملة</th>
                        <th>إجمالي الساعات</th>
                        <th>متوسط الجلسة</th>
                        <th>الأيام الفريدة</th>
                        <th>نسبة الإنجاز</th>
                        <th>المستخدمين النشطين</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            
            <div class="footer">
                <p>تم إنشاء التقرير بواسطة نظام الحضور الذكي</p>
                <p>تطوير: عائشة راشد الشمري - ${new Date().getFullYear()} © جميع الحقوق محفوظة</p>
            </div>
        </body>
        </html>
    `;
}

/**
 * Download KPI CSV file
 * @param {string} csv - CSV content
 */
function downloadKPICSVFile(csv) {
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `تحليلات_المؤشرات_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Delete specific record
 * @param {number} id - Record ID to delete
 */
function deleteRecord(id) {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        const recordIndex = attendanceData.findIndex(record => record.id === id);
        if (recordIndex !== -1) {
            const deletedRecord = attendanceData[recordIndex];
            attendanceData.splice(recordIndex, 1);
            saveApplicationData();
            updateDashboard();
            updateCheckoutSuggestions();
            showAlert('تم حذف السجل بنجاح', 'success');
            console.log('🗑️ Record deleted:', deletedRecord.name);
        }
    }
}

/**
 * Populate city filter dropdown
 */
function populateCityFilter() {
    const cityFilter = document.getElementById('city-filter');
    if (!cityFilter) return;
    
    cityFilter.innerHTML = '<option value="all">جميع الفروع</option>';
    
    SYSTEM_CONFIG.cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
    });
    
    console.log('🏢 City filter populated');
}

/* ===============================================
   UTILITY FUNCTIONS
   =============================================== */

/**
 * Get current date and time as formatted string
 * @returns {string} Current datetime in YYYY-MM-DD HH:MM:SS format
 */
function getCurrentDateTime() {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Format datetime string for display
 * @param {string} dateTimeString - Datetime string to format
 * @returns {string} Formatted datetime
 */
function formatDateTime(dateTimeString) {
    if (!dateTimeString) return '';
    
    const dateTime = new Date(dateTimeString);
    
    // Format time (12-hour format)
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const ampm = hours >= 12 ? 'م' : 'ص';
    const formattedHours = hours % 12 || 12;
    const formattedTime = `${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    
    // Format date
    const day = dateTime.getDate();
    const month = dateTime.getMonth() + 1;
    const year = dateTime.getFullYear();
    const formattedDate = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    
    return `${formattedDate} ${formattedTime}`;
}

/**
 * Format user type for display
 * @param {string} type - User type
 * @param {string} opportunityType - Opportunity type (for volunteers)
 * @returns {string} Formatted user type
 */
function formatUserType(type, opportunityType) {
    if (type === 'متطوع') {
        return `متطوع - ${opportunityType || 'غير محدد'}`;
    }
    return type;
}

/**
 * Calculate duration between check-in and check-out
 * @param {string} checkIn - Check-in datetime
 * @param {string} checkOut - Check-out datetime
 * @returns {string} Duration string
 */
function calculateDuration(checkIn, checkOut) {
    if (!checkOut) return 'لم يخرج بعد';
    
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffMs = checkOutTime - checkInTime;
    
    const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
    const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
    
    return `${diffHrs} ساعات و ${diffMins} دقائق`;
}

/* ===============================================
   UI UTILITY FUNCTIONS
   =============================================== */

/**
 * Show alert message
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success/error)
 */
function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert-message');
    if (!alert) return;
    
    alert.textContent = message;
    alert.className = `alert ${type} show`;
    
    setTimeout(() => {
        alert.classList.remove('show');
    }, type === 'error' ? 5000 : 3000);
    
    console.log(`${type === 'error' ? '⚠️' : '✅'} Alert:`, message);
}

/**
 * Show/hide loading spinner
 * @param {boolean} show - Whether to show loading
 */
function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (!spinner) return;
    
    if (show) {
        spinner.classList.add('active');
    } else {
        spinner.classList.remove('active');
    }
}

/* ===============================================
   EVENT HANDLERS FOR OVERLAYS & SHORTCUTS
   =============================================== */

/**
 * Setup overlay closing handlers
 */
function setupOverlayHandlers() {
    // Close overlays when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('form-overlay')) {
            const overlayId = e.target.id;
            const formType = overlayId.replace('-overlay', '');
            hideForm(formType);
        }
        
        if (e.target.classList.contains('admin-overlay')) {
            hideAdmin();
        }
    });
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Close overlays with Escape key
        if (e.key === 'Escape') {
            const activeOverlay = document.querySelector('.form-overlay.active, .admin-overlay.active');
            if (activeOverlay) {
                if (activeOverlay.classList.contains('admin-overlay')) {
                    hideAdmin();
                } else {
                    const formType = activeOverlay.id.replace('-overlay', '');
                    hideForm(formType);
                }
            }
        }
        
        // Quick shortcuts (Ctrl/Cmd + key)
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    showForm('checkin');
                    break;
                case '2':
                    e.preventDefault();
                    showForm('checkout');
                    break;
                case '3':
                    e.preventDefault();
                    showAdmin();
                    break;
            }
        }
    });
}

/* ===============================================
   INITIALIZATION COMPLETE
   =============================================== */

console.log('🚀 Smart Attendance System JavaScript loaded successfully');
console.log('📋 Available shortcuts: Ctrl+1 (Check-in), Ctrl+2 (Check-out), Ctrl+3 (Admin), ESC (Close)');
