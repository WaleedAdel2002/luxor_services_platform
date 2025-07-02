// بيانات وهمية للخدمات في الأقصر (ستأتي من الواجهة الخلفية لاحقًا)
// الإحداثيات هنا تقريبية لمناطق في الأقصر
const services = [
    { id: 1, name: "مستشفى الأقصر الدولي", type: "hospitals", lat: 25.6888, lng: 32.6394, address: "شارع خالد بن الوليد", phone: "0952378800", hours: "مفتوح 24 ساعة" },
    { id: 2, name: "صيدلية المدينة المنورة", type: "pharmacies", lat: 25.6945, lng: 32.6450, address: "شارع التلفزيون", phone: "0952381234", hours: "مفتوح حتى 11 مساءً" },
    { id: 3, name: "قسم شرطة الأقصر", type: "police", lat: 25.6960, lng: 32.6380, address: "ش. الجمهورية", phone: "122", hours: "مفتوح 24 ساعة" },
    { id: 4, name: "بنك مصر - فرع الأقصر", type: "banks", lat: 25.6910, lng: 32.6410, address: "ش. معبد الكرنك", phone: "19888", hours: "من 9 صباحاً حتى 2 مساءً" },
    { id: 5, name: "مكتب بريد الأقصر الرئيسي", type: "post-offices", lat: 25.6890, lng: 32.6370, address: "ش. المحطة", phone: "0952379000", hours: "من 8 صباحاً حتى 3 مساءً" },
    { id: 6, name: "مستشفى الأقصر العام", type: "hospitals", lat: 25.6980, lng: 32.6350, address: "ش. كورنيش النيل", phone: "0952377777", hours: "مفتوح 24 ساعة" },
    { id: 7, name: "صيدلية العوامية", type: "pharmacies", lat: 25.6790, lng: 32.6490, address: "حي العوامية", phone: "0952376543", hours: "مفتوح حتى 10 مساءً" },
];

// تهيئة الخريطة باستخدام Leaflet
let map = L.map('map').setView([25.6900, 32.6390], 13); // مركز الخريطة الأولي (قرب وسط الأقصر) ومستوى التكبير

// إضافة طبقة خرائط OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let userMarker; // لتخزين علامة موقع المستخدم
let serviceMarkers = L.layerGroup().addTo(map); // لتخزين علامات الخدمات

// **********************************************
// وظائف تحديد الموقع
// **********************************************

// وظيفة الحصول على موقع المستخدم
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.locate({setView: true, maxZoom: 16}); // يطلب تحديد الموقع ويركز الخريطة عليه
        map.on('locationfound', onLocationFound);
        map.on('locationerror', onLocationError);
    } else {
        alert("المتصفح لا يدعم تحديد الموقع الجغرافي.");
        // إذا لم يدعم المتصفح، يمكن هنا توجيه المستخدم لإدخال موقعه يدويًا
    }
}

// عند العثور على موقع المستخدم
function onLocationFound(e) {
    if (userMarker) {
        map.removeLayer(userMarker); // إزالة العلامة القديمة إذا كانت موجودة
    }
    userMarker = L.marker(e.latlng).addTo(map)
        .bindPopup("موقعك الحالي").openPopup();
    map.setView(e.latlng, 15); // تكبير الخريطة على موقع المستخدم

    displayServices(services); // عرض كل الخدمات بعد تحديد موقع المستخدم
}

// عند حدوث خطأ في تحديد الموقع
function onLocationError(e) {
    alert("تعذر تحديد موقعك: " + e.message + ". سيتم عرض الخدمات في الأقصر بشكل عام.");
    displayServices(services); // عرض الخدمات بدون تحديد موقع المستخدم
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
        modalServiceType.textContent = `النوع: ${service.type === 'hospitals' ? 'مستشفى' : service.type === 'pharmacies' ? 'صيدلية' : service.type === 'police' ? 'شرطة' : service.type === 'banks' ? 'بنك' : service.type === 'post-offices' ? 'بريد' : service.type}`;
        modalServiceAddress.textContent = `العنوان: ${service.address}`;
        modalServicePhone.textContent = `الهاتف: ${service.phone}`;
        modalServiceHours.textContent = `ساعات العمل: ${service.hours}`;

        // إعداد زر التوجيه
        modalDirectionsBtn.onclick = () => {
            if (userMarker) {
                const userLat = userMarker.getLatLng().lat;
                const userLng = userMarker.getLatLng().lng;
                // فتح خرائط جوجل مع توجيهات
                window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${service.lat},${service.lng}&travelmode=driving`, '_blank');
            } else {
                alert("يرجى السماح بتحديد موقعك للحصول على توجيهات دقيقة.");
                // أو يمكن فتح الخريطة مع الوجهة فقط
                window.open(`https://www.google.com/maps/search/?api=1&query=${service.lat},${service.lng}`, '_blank');
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
        service.type.toLowerCase().includes(searchTerm) // يمكن توسيع البحث ليشمل الوصف أيضاً
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
        getUserLocation(); // محاولة تحديد الموقع إذا لم يكن متاحًا
    }
});


// استدعاء تحديد الموقع عند تحميل الصفحة لأول مرة
getUserLocation();
displayServices(services); // عرض الخدمات مبدئيًا حتى قبل تحديد الموقع