// بيانات وهمية للخدمات في الأقصر (ستأتي من الواجهة الخلفية لاحقًا)
// الإحداثيات هنا تقريبية لمناطق في الأقصر
let services = []; // الآن، هذا المتغير سيكون فارغًا في البداية وسيتم ملؤه من ملف JSON

// دالة جديدة لجلب البيانات وتشغيل التطبيق
async function fetchServicesAndInitialize() {
    try {
        const response = await fetch('services.json'); // اسم ملف JSON الخاص بك
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        services = await response.json(); // قم بتعيين البيانات للمتغير 'services'
        console.log('Services loaded successfully:', services);
        getUserLocation(); // بعد تحميل الخدمات، ابدأ في الحصول على موقع المستخدم
    } catch (error) {
        console.error('Failed to load services:', error);
        alert("تعذر تحميل بيانات الخدمات. يرجى التأكد من وجود ملف services.json وتشغيل خادم محلي.");
        // لا يزال من الممكن محاولة تحديد موقع المستخدم، ولكن لن تظهر الخدمات
        getUserLocation();
    }
}

// تهيئة الخريطة باستخدام Leaflet
let map = L.map('map').setView([25.6900, 32.6390], 13); // مركز الخريطة الأولي (قرب وسط الأقصر) ومستوى التكبير

// إضافة طبقة خرائط OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let userMarker; // لتخزين علامة موقع المستخدم
let serviceMarkers = L.layerGroup().addTo(map); // لتخزين علامات الخدمات

// **********************************************
// وظائف تحديد الموقع
// **********************************************

// وظيفة الحصول على موقع المستخدم
function getUserLocation() {
    if (navigator.geolocation) {
        // هذا هو السطر الذي تم تصحيحه!
        // نستخدم getCurrentPosition للحصول على الموقع لمرة واحدة
        navigator.geolocation.getCurrentPosition(onLocationFound, onLocationError, {
            enableHighAccuracy: true, // محاولة الحصول على أدق موقع ممكن
            timeout: 10000,           // مهلة 10 ثوانٍ قبل الإبلاغ عن خطأ
            maximumAge: 0             // لا نستخدم نتائج سابقة مخبأة
        });
    } else {
        alert("متصفحك لا يدعم تحديد الموقع الجغرافي. يرجى استخدام متصفح أحدث.");
        displayServices(services); // عرض الخدمات بدون موقع المستخدم إذا كان التحديد غير مدعوم
    }
}

// عند العثور على موقع المستخدم
function onLocationFound(position) {
    const latlng = L.latLng(position.coords.latitude, position.coords.longitude);
    if (userMarker) {
        map.removeLayer(userMarker); // إزالة العلامة القديمة إذا كانت موجودة
    }
    userMarker = L.marker(latlng).addTo(map)
        .bindPopup("موقعك الحالي").openPopup();
    map.setView(latlng, 15); // تكبير الخريطة على موقع المستخدم

    displayServices(services); // عرض كل الخدمات بعد تحديد موقع المستخدم
}

// عند حدوث خطأ في تحديد الموقع
function onLocationError(error) {
    let errorMessage = "تعذر تحديد موقعك. سيتم عرض الخدمات في الأقصر بشكل عام.";
    switch(error.code) {
        case error.PERMISSION_DENIED:
            errorMessage = "تم رفض إذن تحديد الموقع. يرجى السماح بالوصول لموقعك.";
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage = "معلومات الموقع غير متوفرة حالياً.";
            break;
        case error.TIMEOUT:
            errorMessage = "انتهت مهلة طلب تحديد الموقع.";
            break;
        case error.UNKNOWN_ERROR:
            errorMessage = "حدث خطأ غير معروف أثناء تحديد الموقع.";
            break;
    }
    alert(errorMessage);
    displayServices(services); // عرض الخدمات بدون موقع المستخدم
}

// **********************************************
// وظائف عرض الخدمات والتصفية
// **********************************************

// وظيفة عرض الخدمات على الخريطة
function displayServices(servicesToShow) {
    serviceMarkers.clearLayers(); // مسح العلامات الموجودة
    servicesToShow.forEach(service => {
        // تم التعديل هنا: إضافة id للماركر
        const marker = L.marker([service.lat, service.lng], { id: service.id }).addTo(serviceMarkers);
        marker.bindPopup(`<b>${service.name}</b><br>${service.address}<br><a href="#" data-id="${service.id}" class="show-details">المزيد من التفاصيل</a>`);
        // عند النقر على الرابط في الـ popup، نعرض المودال
        marker.on('popupopen', function (e) {
            const link = e.popup.getElement().querySelector('.show-details');
            if (link) {
                link.onclick = (event) => {
                    event.preventDefault();
                    showServiceDetails(service.id);
                };
            }
        });
    });
}

// وظيفة تصفية الخدمات حسب الفئة
document.querySelectorAll('.category-btn').forEach(button => {
    button.addEventListener('click', function() {
        const category = this.dataset.category;
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        if (category === 'all') { // إذا أردنا زر "كل الخدمات"
            displayServices(services);
        } else {
            const filteredServices = services.filter(service => service.type === category);
            displayServices(filteredServices);
        }
    });
});

// **********************************************
// وظائف المودال (تفاصيل الخدمة)
// **********************************************

const modal = document.getElementById('service-details-modal');
const closeButton = document.querySelector('.close-button');
const modalServiceName = document.getElementById('modal-service-name');
const modalServiceType = document.getElementById('modal-service-type');
const modalServiceAddress = document.getElementById('modal-service-address');
const modalServicePhone = document.getElementById('modal-service-phone');
const modalServiceHours = document.getElementById('modal-service-hours');
const modalDirectionsBtn = document.getElementById('modal-directions-btn');

function showServiceDetails(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (service) {
        modalServiceName.textContent = service.name;
        // تحويل أنواع الخدمات للعربية للعرض
        let serviceTypeArabic;
        switch(service.type) {
            case 'hospitals': serviceTypeArabic = 'مستشفى'; break;
            case 'pharmacies': serviceTypeArabic = 'صيدلية'; break;
            case 'police': serviceTypeArabic = 'شرطة'; break;
            case 'banks': serviceTypeArabic = 'بنك'; break;
            case 'post-offices': serviceTypeArabic = 'بريد'; break;
            default: serviceTypeArabic = service.type;
        }
        modalServiceType.textContent = `النوع: ${serviceTypeArabic}`;
        modalServiceAddress.textContent = `العنوان: ${service.address}`;
        modalServicePhone.textContent = `الهاتف: ${service.phone}`;
        modalServiceHours.textContent = `ساعات العمل: ${service.hours}`;

        // إعداد زر "الانتقال إلى الموقع على الخريطة"
        modalDirectionsBtn.textContent = 'الانتقال إلى الموقع على الخريطة';
        modalDirectionsBtn.onclick = () => {
            modal.style.display = 'none';
            map.setView([service.lat, service.lng], 16);
            serviceMarkers.eachLayer(function(layer) {
                if (layer.options.id === service.id) {
                    layer.openPopup();
                }
            });
        };
        modal.style.display = 'flex';
    }
}

closeButton.onclick = function() {
    modal.style.display = 'none';
}

// إخفاء المودال عند النقر خارج المحتوى
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// **********************************************
// وظائف البحث عن أقرب خدمة (باستخدام Leaflet Routing Machine)
// **********************************************

// **********************************************
// وظائف المودال الجديد لأقرب الخدمات (المعايير)
// **********************************************
const nearestServicesCriteriaModal = document.getElementById('nearest-services-criteria-modal');
const closeNearestModalButton = document.getElementById('close-nearest-modal');
const nearestServiceTypeSelect = document.getElementById('nearest-service-type-select');
const findNearestBtnInModal = document.getElementById('find-nearest-btn-in-modal');

// عند النقر على زر "أقرب الخدمات لي"
document.getElementById('nearest-services-btn').addEventListener('click', function() {
    if (!userMarker) {
        alert("يرجى السماح بتحديد موقعك أولاً للعثور على أقرب الخدمات.");
        getUserLocation(); // محاولة تحديد الموقع إذا لم يكن متاحًا
        return;
    }
    nearestServicesCriteriaModal.style.display = 'flex'; // إظهار المودال
});

// إغلاق المودال من زر الإغلاق
closeNearestModalButton.onclick = function() {
    nearestServicesCriteriaModal.style.display = 'none';
}

// إغلاق المودال عند النقر خارج المحتوى
window.addEventListener('click', function(event) {
    if (event.target == nearestServicesCriteriaModal) {
        nearestServicesCriteriaModal.style.display = 'none';
    }
});

// **************************************************************************
// تم التعديل بالكامل هنا: منطق حساب المسافة بالمسار باستخدام Leaflet Routing Machine
// **************************************************************************
// عند النقر على زر "البحث" داخل مودال أقرب الخدمات
findNearestBtnInModal.addEventListener('click', function() {
    const selectedCategory = nearestServiceTypeSelect.value;
    const userLatLng = userMarker.getLatLng();

    let filteredServices = services;
    if (selectedCategory !== 'all') {
        filteredServices = services.filter(service => service.type === selectedCategory);
    }

    nearestServicesCriteriaModal.style.display = 'none'; // إخفاء المودال بعد البحث

    if (!userLatLng) {
        alert("لا يمكن حساب المسافة، موقع المستخدم غير معروف.");
        return;
    }

    // إخفاء كل العلامات القديمة والممرات
    serviceMarkers.clearLayers();
    if (window.currentRouteControl) { // تأكد من إزالة المسار القديم إذا كان موجوداً
        map.removeControl(window.currentRouteControl);
        window.currentRouteControl = null;
    }

    // إذا لم تكن هناك خدمات مفلترة، قم بعرض رسالة
    if (filteredServices.length === 0) {
        alert("لم يتم العثور على خدمات مطابقة في هذه الفئة.");
        return;
    }

    let nearestService = null;
    let minDistance = Infinity; // استخدام مسافة كبيرة جداً كقيمة مبدئية

    let completedRequests = 0;
    const totalRequests = filteredServices.length;

    // عرض رسالة "جاري الحساب..." للمستخدم
    alert("جاري حساب أقرب مسار. قد يستغرق الأمر بعض الوقت...");

    // حلقة لطلب المسار لكل خدمة مفلترة
    filteredServices.forEach(service => {
        L.Routing.control({
            waypoints: [
                L.latLng(userLatLng.lat, userLatLng.lng),
                L.latLng(service.lat, service.lng)
            ],
            router: L.Routing.osrmv1(), // استخدام OSRM كخدمة توجيه افتراضية
            profile: 'driving', // نوع المسار: 'driving' للسيارة، يمكنك تغيير هذا إلى 'walking' أو 'cycling'
            createMarker: function() { return null; }, // لا تنشئ markers افتراضية
            addWaypoints: false, // لا تسمح بإضافة نقاط طريق يدوياً
            routeWhileDragging: false, // لا تعيد التوجيه أثناء سحب الخريطة
            fitSelectedRoutes: false // لا تقم بتكبير الخريطة تلقائياً على المسار
        }).on('routesfound', function(e) {
            const routes = e.routes;
            if (routes.length > 0) {
                const route = routes[0];
                const distance = route.summary.totalDistance; // المسافة بالمتر
                const time = route.summary.totalTime; // الوقت بالثواني

                // قارن هذه المسافة مع الحد الأدنى الحالي
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestService = service;
                    nearestService.routeDistance = distance; // حفظ المسافة والوقت في كائن الخدمة
                    nearestService.routeTime = time;
                    nearestService.route = route; // لحفظ المسار الأقصر
                }
            }
            completedRequests++;
            if (completedRequests === totalRequests) {
                // كل الطلبات اكتملت، الآن اعرض النتيجة
                displayNearestRouteResult(nearestService);
            }
        }).on('routingerror', function(e) {
            console.error('Routing error for service:', service.name, e.error);
            completedRequests++;
            if (completedRequests === totalRequests) {
                displayNearestRouteResult(nearestService);
            }
        }).addTo(map); // أضف التحكم إلى الخريطة مؤقتاً لكي يتم تشغيل الأحداث
    });

    // دالة لعرض نتيجة أقرب مسار
    function displayNearestRouteResult(service) {
        if (service) {
            // عرض المسار الأقصر على الخريطة
            if (window.currentRouteControl) {
                map.removeControl(window.currentRouteControl);
            }
            window.currentRouteControl = L.Routing.control({
                waypoints: [
                    L.latLng(userLatLng.lat, userLatLng.lng),
                    L.latLng(service.lat, service.lng)
                ],
                router: L.Routing.osrmv1(),
                lineOptions: {
                    styles: [{ color: '#007bff', weight: 6, opacity: 0.7 }] // لون المسار
                },
                createMarker: function() { return null; }, // لا تنشئ markers افتراضية
                addWaypoints: false,
                routeWhileDragging: false,
                show: false, // لا تظهر لوحة التحكم بالمسار
                altLineOptions: { extend: false }, // إخفاء المسارات البديلة
                showAlternatives: false, // عدم إظهار المسارات البديلة في لوحة التحكم
                fitSelectedRoutes: true // تكبير الخريطة على المسار المحدد
            }).addTo(map);

            // إظهار الماركر الخاص بالخدمة على المسار
            const marker = L.marker([service.lat, service.lng], { id: service.id }).addTo(serviceMarkers);
            marker.bindPopup(`<b>${service.name}</b><br>${service.address}<br>المسافة: ${(service.routeDistance / 1000).toFixed(2)} كم<br>الوقت المقدر: ${formatTime(service.routeTime)}<br><a href="#" data-id="${service.id}" class="show-details">المزيد من التفاصيل</a>`).openPopup();
            
            // عرض النتيجة في تنبيه (يمكنك تعديلها لاحقًا لعرضها بشكل أفضل)
            alert(`أقرب خدمة هي: ${service.name}\nالمسافة عبر المسار: ${(service.routeDistance / 1000).toFixed(2)} كم\nالوقت المقدر: ${formatTime(service.routeTime)}`);
        } else {
            alert("لم يتم العثور على أي مسار لأي خدمة مطابقة.");
        }
    }
});

// دالة مساعدة لتنسيق الوقت من الثواني إلى نص (ساعات ودقائق)
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    let timeString = '';
    if (hours > 0) {
        timeString += `${hours} ساعة `;
    }
    timeString += `${minutes} دقيقة`;
    return timeString.trim();
}


// **********************************************
// وظائف البحث العام
// **********************************************
document.getElementById('search-button').addEventListener('click', performSearch);
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // منع الإرسال الافتراضي للنموذج إذا كان موجودا
        performSearch();
    }
});

function performSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    if (searchTerm.trim() === '') {
        displayServices(services); // عرض كل الخدمات إذا كان البحث فارغًا
        return;
    }

    const searchResults = services.filter(service =>
        service.name.toLowerCase().includes(searchTerm) ||
        service.address.toLowerCase().includes(searchTerm) ||
        // يمكن توسيع البحث ليشمل الوصف أيضاً أو ترجمة أنواع الخدمات
        (service.type === 'hospitals' && 'مستشفى'.includes(searchTerm)) ||
        (service.type === 'pharmacies' && 'صيدلية'.includes(searchTerm)) ||
        (service.type === 'police' && 'شرطة'.includes(searchTerm)) ||
        (service.type === 'banks' && 'بنك'.includes(searchTerm)) ||
        (service.type === 'post-offices' && 'بريد'.includes(searchTerm))
    );
    displayServices(searchResults);
    if (searchResults.length === 0) {
        alert("لم يتم العثور على نتائج مطابقة لبحثك.");
    }
}


// **********************************************
// وظائف أخرى
// **********************************************

// زر إعادة تمركز الخريطة على موقع المستخدم
document.getElementById('recenter-btn').addEventListener('click', function() {
    if (userMarker) {
        map.setView(userMarker.getLatLng(), 15);
    } else {
        // إذا لم يكن موقع المستخدم متاحًا، نطلب تحديده أولاً
        getUserLocation();
    }
});


// استدعاء الدالة الجديدة لبدء تحميل البيانات وتشغيل التطبيق عند تحميل الصفحة لأول مرة
fetchServicesAndInitialize();

    // وظيفة لإظهار أو إخفاء النافذة المنبثقة
    function togglePopup() {
        const popup = document.getElementById("info-popup");
        const overlay = document.getElementById("info-overlay");
        if (popup.style.display === "block") {
            popup.style.display = "none";
            overlay.style.display = "none";
        } else {
            popup.style.display = "block";
            overlay.style.display = "block";
        }
    }