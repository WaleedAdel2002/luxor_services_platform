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
        const marker = L.marker([service.lat, service.lng]).addTo(serviceMarkers);
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

        // إعداد زر التوجيه
        modalDirectionsBtn.onclick = () => {
            if (userMarker) {
                const userLat = userMarker.getLatLng().lat;
                const userLng = userMarker.getLatLng().lng;
                // فتح خرائط جوجل مع توجيهات
                window.open(`http://maps.google.com/maps?saddr=${userLat},${userLng}&daddr=${service.lat},${service.lng}&travelmode=driving`, '_blank');
            } else {
                alert("يرجى السماح بتحديد موقعك للحصول على توجيهات دقيقة.");
                // أو يمكن فتح الخريطة مع الوجهة فقط
                window.open(`http://maps.google.com/maps?q=${service.lat},${service.lng}`, '_blank');
            }
        };

        modal.style.display = 'flex'; // إظهار المودال (نستخدم flex لجعلها تتوسط)
    }
}

closeButton.onclick = function() {
    modal.style.display = 'none'; // إخفاء المودال
}

// إخفاء المودال عند النقر خارج المحتوى
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// **********************************************
// وظائف البحث عن أقرب خدمة
// **********************************************

document.getElementById('nearest-services-btn').addEventListener('click', function() {
    if (!userMarker) {
        alert("يرجى السماح بتحديد موقعك أولاً للعثور على أقرب الخدمات.");
        getUserLocation(); // محاولة تحديد الموقع إذا لم يكن متاحًا
        return;
    }

    const userLatLng = userMarker.getLatLng();
    const distances = services.map(service => {
        const serviceLatLng = L.latLng(service.lat, service.lng);
        // حساب المسافة بالمتر باستخدام Leaflet
        const distance = userLatLng.distanceTo(serviceLatLng);
        return { service: service, distance: distance };
    });

    // ترتيب الخدمات حسب المسافة (الأقرب أولاً)
    distances.sort((a, b) => a.distance - b.distance);

    // هنا يجب عرض قائمة بالخدمات المرتبة (ليس فقط على الخريطة)
    // في هذه المرحلة، سنعرض فقط أقرب 5 خدمات في تنبيه بسيط
    let nearestList = "أقرب الخدمات إليك:\n";
    for (let i = 0; i < Math.min(5, distances.length); i++) {
        nearestList += `${distances[i].service.name} (${(distances[i].distance / 1000).toFixed(2)} كم)\n`;
    }
    alert(nearestList);
    // مستقبلاً: سنقوم ببناء شاشة قائمة تفصيلية هنا
});


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