require('dotenv').config()
const bcrypt = require('bcrypt')
const { Op } = require('sequelize')
const sequelize = require('../db')
const {
    Users, Driver, Load, LoadDetails, DriverStop, Assignment, Location, CarType, Notification,
} = require('../models')

const SEED_MARKER_PHONE = '+998901111101'

// ─── Helpers ──────────────────────────────────────────────────────────
const rand = (min, max) => min + Math.random() * (max - min)
const randInt = (min, max) => Math.floor(rand(min, max + 1))
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]
const daysAgo = (n, h = 0) => new Date(Date.now() - n * 86400000 + h * 3600000)
const daysAhead = (n, h = 0) => new Date(Date.now() + n * 86400000 + h * 3600000)

// Realistic Uzbekistan cities (lat, lon)
const CITY = {
    tashkent_yunusabad: { lat: 41.3650, lon: 69.2890, name: "Toshkent, Yunusobod tumani" },
    tashkent_chilanzar: { lat: 41.2845, lon: 69.2034, name: "Toshkent, Chilonzor tumani" },
    tashkent_mirzo:     { lat: 41.3111, lon: 69.2401, name: "Toshkent, Mirzo Ulug'bek tumani" },
    tashkent_sergeli:   { lat: 41.2298, lon: 69.2227, name: "Toshkent, Sergeli tumani" },
    tashkent_yashnabad: { lat: 41.3187, lon: 69.3401, name: "Toshkent, Yashnobod tumani" },
    tashkent_almazar:   { lat: 41.3552, lon: 69.2294, name: "Toshkent, Olmazor tumani" },
    samarkand:          { lat: 39.6542, lon: 66.9597, name: "Samarqand sh., Registon ko'chasi" },
    samarkand_urgut:    { lat: 39.4153, lon: 67.2425, name: "Samarqand viloyati, Urgut tumani" },
    bukhara:            { lat: 39.7681, lon: 64.4214, name: "Buxoro sh., Lyabi-Hauz" },
    bukhara_kagan:      { lat: 39.7239, lon: 64.5544, name: "Buxoro viloyati, Kogon sh." },
    andijan:            { lat: 40.7821, lon: 72.3442, name: "Andijon sh., A. Navoiy ko'chasi" },
    namangan:           { lat: 40.9983, lon: 71.6726, name: "Namangan sh., Bobur ko'chasi" },
    fergana:            { lat: 40.3895, lon: 71.7833, name: "Farg'ona sh., Mustaqillik ko'chasi" },
    qarshi:             { lat: 38.8606, lon: 65.7889, name: "Qarshi sh., Mustaqillik ko'chasi" },
    nukus:              { lat: 42.4538, lon: 59.6103, name: "Nukus sh., Markaziy ko'cha" },
    urgench:            { lat: 41.5500, lon: 60.6314, name: "Urganch sh., Al-Xorazmiy ko'chasi" },
    termez:             { lat: 37.2242, lon: 67.2783, name: "Termiz sh., Mustaqillik ko'chasi" },
    jizzakh:            { lat: 40.1158, lon: 67.8422, name: "Jizzax sh., Sharof Rashidov ko'chasi" },
    navoi:              { lat: 40.0844, lon: 65.3792, name: "Navoiy sh., Karim Beg ko'chasi" },
    gulistan:           { lat: 40.4897, lon: 68.7842, name: "Guliston sh., Markaz" },
}

// ─── Data: Cargo owners (12) ──────────────────────────────────────────
const OWNERS = [
    { firstname: 'Akmal',     lastname: "Yo'ldoshev",    phone: '+998901111101', phone_2: '+998901111201', email: 'akmal.y@gmail.com',    address: "Toshkent sh., Yunusobod 5-mavze, 12-uy", birthday: '1985-03-15', user_img: 'https://i.pravatar.cc/150?img=11' },
    { firstname: 'Nodira',    lastname: 'Karimova',      phone: '+998901111102', phone_2: null,           email: 'nodira.k@mail.ru',     address: "Toshkent sh., Chilonzor 9-kvartal", birthday: '1990-07-22', user_img: 'https://i.pravatar.cc/150?img=47' },
    { firstname: 'Sherzod',   lastname: "To'shpo'latov", phone: '+998901111103', phone_2: '+998901111203', email: null,                   address: "Samarqand sh., Registon ko'chasi 24",   birthday: '1982-11-08', user_img: 'https://i.pravatar.cc/150?img=12' },
    { firstname: 'Muxayyo',   lastname: 'Ergasheva',     phone: '+998901111104', phone_2: null,           email: 'm.ergasheva@umail.uz', address: "Buxoro sh., Lyabi-Hauz 7-uy",          birthday: '1988-05-30', user_img: null },
    { firstname: 'Bekzod',    lastname: 'Mirzayev',      phone: '+998901111105', phone_2: '+998901111205', email: 'bekzod.m@yandex.ru',   address: "Andijon sh., A. Navoiy 45",            birthday: '1987-09-12', user_img: 'https://i.pravatar.cc/150?img=33' },
    { firstname: 'Gulnoza',   lastname: 'Saidova',       phone: '+998901111106', phone_2: null,           email: null,                   address: "Toshkent sh., Mirzo Ulug'bek 100-uy",  birthday: '1992-01-25', user_img: 'https://i.pravatar.cc/150?img=44' },
    { firstname: 'Aziz',      lastname: 'Komilov',       phone: '+998901111107', phone_2: '+998901111207', email: 'a.komilov@gmail.com',  address: "Farg'ona sh., Mustaqillik 18",         birthday: '1980-12-03', user_img: 'https://i.pravatar.cc/150?img=14' },
    { firstname: 'Madina',    lastname: 'Raximova',      phone: '+998901111108', phone_2: null,           email: 'madina.r@mail.ru',     address: "Namangan sh., Bobur ko'chasi 67",      birthday: '1995-04-18', user_img: 'https://i.pravatar.cc/150?img=48' },
    { firstname: 'Jaxongir',  lastname: 'Axmedov',       phone: '+998901111109', phone_2: '+998901111209', email: null,                   address: "Toshkent sh., Sergeli 3-mavze",        birthday: '1978-08-22', user_img: 'https://i.pravatar.cc/150?img=15' },
    { firstname: 'Lola',      lastname: 'Ismoilova',     phone: '+998901111110', phone_2: null,           email: 'lola.ismoilova@gmail.com', address: "Qarshi sh., Mustaqillik 11",       birthday: '1993-06-07', user_img: 'https://i.pravatar.cc/150?img=49' },
    { firstname: 'Otabek',    lastname: 'Raxmonov',      phone: '+998901111111', phone_2: '+998901111211', email: 'otabek.r@umail.uz',    address: "Termiz sh., Markaziy ko'cha 9",       birthday: '1984-10-15', user_img: 'https://i.pravatar.cc/150?img=16' },
    { firstname: 'Zafar',     lastname: 'Xalilov',       phone: '+998901111112', phone_2: null,           email: null,                   address: "Urganch sh., Al-Xorazmiy 32",         birthday: '1989-02-28', user_img: null },
]

// ─── Data: Drivers (18) ───────────────────────────────────────────────
const DRIVERS = [
    // 12 APPROVED — har xil status
    { user: { firstname: 'Sardor',   lastname: 'Tursunov',     phone: '+998901112201', phone_2: '+998901112301', email: null, address: "Toshkent sh., Yunusobod",  birthday: '1986-04-10', user_img: 'https://i.pravatar.cc/150?img=51' }, driver: { name: 'Mercedes-Benz Actros 1845', tex_pas_ser: 'AA', tex_pas_num: '1234567', prava_ser: 'AB', prava_num: '7654321', driver_status: 'at_work', is_approved: true, blocked: false }, carTypeName: 'TIR' },
    { user: { firstname: 'Bahodir',  lastname: 'Sobirov',      phone: '+998901112202', phone_2: null,           email: 'bahodir.s@gmail.com', address: "Samarqand sh.", birthday: '1983-09-22', user_img: 'https://i.pravatar.cc/150?img=52' }, driver: { name: 'MAN TGX 18.480', tex_pas_ser: 'AB', tex_pas_num: '2345678', prava_ser: 'AC', prava_num: '8765432', driver_status: 'at_work', is_approved: true, blocked: false }, carTypeName: 'TIR' },
    { user: { firstname: 'Doniyor',  lastname: 'Qodirov',      phone: '+998901112203', phone_2: '+998901112303', email: null, address: "Toshkent sh., Chilonzor",  birthday: '1991-01-15', user_img: 'https://i.pravatar.cc/150?img=53' }, driver: { name: 'Isuzu NPR 75', tex_pas_ser: 'AC', tex_pas_num: '3456789', prava_ser: 'AD', prava_num: '9876543', driver_status: 'empty', is_approved: true, blocked: false }, carTypeName: 'Yuk mashinasi (5t)' },
    { user: { firstname: 'Anvar',    lastname: 'Hamidov',      phone: '+998901112204', phone_2: null,           email: 'anvar.h@mail.ru', address: "Buxoro sh.",   birthday: '1987-06-08', user_img: 'https://i.pravatar.cc/150?img=54' }, driver: { name: 'GAZelle Next', tex_pas_ser: 'AD', tex_pas_num: '4567890', prava_ser: 'AE', prava_num: '0987654', driver_status: 'empty', is_approved: true, blocked: false }, carTypeName: 'Furgon' },
    { user: { firstname: 'Farrux',   lastname: 'Boboyev',      phone: '+998901112205', phone_2: '+998901112305', email: null, address: "Andijon sh.",  birthday: '1984-11-30', user_img: 'https://i.pravatar.cc/150?img=55' }, driver: { name: 'Hyundai HD78', tex_pas_ser: 'AE', tex_pas_num: '5678901', prava_ser: 'AF', prava_num: '1098765', driver_status: 'at_work', is_approved: true, blocked: false }, carTypeName: 'Yuk mashinasi (5t)' },
    { user: { firstname: 'Ravshan',  lastname: 'Toshxo\'jayev',phone: '+998901112206', phone_2: null,           email: 'ravshan.t@gmail.com', address: "Toshkent sh., Sergeli", birthday: '1979-03-14', user_img: 'https://i.pravatar.cc/150?img=56' }, driver: { name: 'Scania R 500', tex_pas_ser: 'AF', tex_pas_num: '6789012', prava_ser: 'BA', prava_num: '2109876', driver_status: 'resting', is_approved: true, blocked: false }, carTypeName: 'TIR' },
    { user: { firstname: 'Ulug\'bek',lastname: 'Mamatov',      phone: '+998901112207', phone_2: null,           email: null, address: "Farg'ona sh.",  birthday: '1990-08-25', user_img: 'https://i.pravatar.cc/150?img=57' }, driver: { name: 'Daewoo Novus', tex_pas_ser: 'BB', tex_pas_num: '7890123', prava_ser: 'BC', prava_num: '3210987', driver_status: 'empty', is_approved: true, blocked: false }, carTypeName: 'Yuk mashinasi (5t)' },
    { user: { firstname: 'Komil',    lastname: 'Nizomov',      phone: '+998901112208', phone_2: '+998901112308', email: 'komil.n@umail.uz', address: "Namangan sh.", birthday: '1986-12-05', user_img: 'https://i.pravatar.cc/150?img=58' }, driver: { name: 'Ford Transit', tex_pas_ser: 'BD', tex_pas_num: '8901234', prava_ser: 'BE', prava_num: '4321098', driver_status: 'empty', is_approved: true, blocked: false }, carTypeName: 'Furgon' },
    { user: { firstname: 'Sanjar',   lastname: 'Pulatov',      phone: '+998901112209', phone_2: null,           email: null, address: "Qarshi sh.",   birthday: '1982-05-19', user_img: 'https://i.pravatar.cc/150?img=59' }, driver: { name: 'JAC N75', tex_pas_ser: 'BF', tex_pas_num: '9012345', prava_ser: 'CA', prava_num: '5432109', driver_status: 'at_work', is_approved: true, blocked: false }, carTypeName: 'Yuk mashinasi (5t)' },
    { user: { firstname: 'Murod',    lastname: 'Yusupov',      phone: '+998901112210', phone_2: null,           email: 'murod.y@gmail.com', address: "Toshkent sh., Yashnobod", birthday: '1988-10-11', user_img: 'https://i.pravatar.cc/150?img=60' }, driver: { name: 'Volvo FH16', tex_pas_ser: 'CB', tex_pas_num: '0123456', prava_ser: 'CC', prava_num: '6543210', driver_status: 'at_work', is_approved: true, blocked: false }, carTypeName: 'TIR' },
    { user: { firstname: 'Olim',     lastname: 'Karimov',      phone: '+998901112211', phone_2: '+998901112311', email: null, address: "Termiz sh.",   birthday: '1985-02-27', user_img: 'https://i.pravatar.cc/150?img=61' }, driver: { name: 'Iveco Daily', tex_pas_ser: 'CD', tex_pas_num: '1122334', prava_ser: 'CE', prava_num: '7654321', driver_status: 'offline', is_approved: true, blocked: false }, carTypeName: 'Pikap' },
    { user: { firstname: 'Bekzod',   lastname: 'Sayfullayev',  phone: '+998901112212', phone_2: null,           email: null, address: "Urganch sh.",  birthday: '1991-07-04', user_img: 'https://i.pravatar.cc/150?img=62' }, driver: { name: 'Chevrolet Damas', tex_pas_ser: 'CF', tex_pas_num: '2233445', prava_ser: 'DA', prava_num: '8765432', driver_status: 'empty', is_approved: true, blocked: false }, carTypeName: 'Sedan' },

    // 4 PENDING (yangi ro'yxatdan o'tgan, hujjatlari kutilmoqda)
    { user: { firstname: 'Rustam',   lastname: 'Tashpulatov',  phone: '+998901112213', phone_2: null,           email: null, address: "Toshkent sh., Olmazor", birthday: '1993-04-21', user_img: 'https://i.pravatar.cc/150?img=63' }, driver: { name: 'Mercedes Sprinter', tex_pas_ser: 'DB', tex_pas_num: '3344556', prava_ser: 'DC', prava_num: '9876543', driver_status: 'offline', is_approved: false, blocked: false }, carTypeName: 'Furgon' },
    { user: { firstname: 'Jamshid',  lastname: 'Eshonqulov',   phone: '+998901112214', phone_2: null,           email: 'j.eshonqulov@gmail.com', address: "Jizzax sh.", birthday: '1989-11-13', user_img: 'https://i.pravatar.cc/150?img=64' }, driver: { name: 'Renault Master', tex_pas_ser: 'DD', tex_pas_num: '4455667', prava_ser: 'DE', prava_num: '0987654', driver_status: 'offline', is_approved: false, blocked: false }, carTypeName: 'Furgon' },
    { user: { firstname: 'Asror',    lastname: 'Mahmudov',     phone: '+998901112215', phone_2: '+998901112315', email: null, address: "Navoiy sh.",   birthday: '1987-08-09', user_img: 'https://i.pravatar.cc/150?img=65' }, driver: { name: 'Kamaz 65117', tex_pas_ser: 'DF', tex_pas_num: '5566778', prava_ser: 'EA', prava_num: '1098765', driver_status: 'offline', is_approved: false, blocked: false }, carTypeName: 'TIR' },
    { user: { firstname: 'Shaxzod',  lastname: 'Norqulov',     phone: '+998901112216', phone_2: null,           email: null, address: "Guliston sh.", birthday: '1994-03-17', user_img: 'https://i.pravatar.cc/150?img=66' }, driver: { name: 'Lada Largus', tex_pas_ser: 'EB', tex_pas_num: '6677889', prava_ser: 'EC', prava_num: '2109876', driver_status: 'offline', is_approved: false, blocked: false }, carTypeName: 'Pikap' },

    // 2 BLOCKED
    { user: { firstname: 'Ilhom',    lastname: 'Soliyev',      phone: '+998901112217', phone_2: null,           email: null, address: "Buxoro sh.",   birthday: '1981-12-29', user_img: 'https://i.pravatar.cc/150?img=67' }, driver: { name: 'Hyundai Porter', tex_pas_ser: 'ED', tex_pas_num: '7788990', prava_ser: 'EE', prava_num: '3210987', driver_status: 'offline', is_approved: true, blocked: true }, carTypeName: 'Pikap' },
    { user: { firstname: 'Davron',   lastname: 'Akromov',      phone: '+998901112218', phone_2: null,           email: 'davron.a@mail.ru', address: "Andijon sh.", birthday: '1990-06-12', user_img: 'https://i.pravatar.cc/150?img=68' }, driver: { name: 'GAZ Sobol', tex_pas_ser: 'EF', tex_pas_num: '8899001', prava_ser: 'FA', prava_num: '4321098', driver_status: 'offline', is_approved: true, blocked: true }, carTypeName: 'Furgon' },
]

// Image placeholders (Picsum)
const carImg     = (seed) => `https://picsum.photos/seed/car${seed}/600/400`
const docImg     = (seed) => `https://picsum.photos/seed/doc${seed}/600/400`

// ─── Data: Loads (25 — har statusda) ─────────────────────────────────
const LOAD_TEMPLATES = [
    // POSTED (8) — yangi, hali assign qilinmagan
    { name: "Sement (50 qop)", cargo_type: "Qurilish materiali", description: "Yuk yaxshi qadoqlangan. Yuklash va tushirish forklift bilan amalga oshiriladi.", origin: 'tashkent_yunusabad', dest: 'samarkand', weight: 2500, dims: [2.5, 1.5, 1.2], carType: 'Yuk mashinasi (5t)', payer: 'sender', status: 'posted', daysOld: 0.1, isRound: false },
    { name: "Mebel komplekti", cargo_type: "Maishiy texnika va mebel", description: "2 ta divan, 1 ta shkaf, 6 ta stul. Ehtiyot bilan tashish kerak.", origin: 'tashkent_chilanzar', dest: 'fergana', weight: 800, dims: [3.0, 2.0, 1.8], carType: 'Furgon', payer: 'receiver', status: 'posted', daysOld: 0.5, isRound: false },
    { name: "Tarvuz (10 tonna)", cargo_type: "Oziq-ovqat (sovuq saqlash)", description: "Yangi yig'ilgan tarvuz. Ertasi kun yetkazib berilishi shart.", origin: 'samarkand_urgut', dest: 'tashkent_mirzo', weight: 10000, dims: [6.0, 2.4, 2.4], carType: 'TIR', payer: 'sender', status: 'posted', daysOld: 0.7, isRound: false },
    { name: "Maktab kitoblari", cargo_type: "Kitob, qog'oz", description: "150 ta quti darslik. 1-9 sinflar uchun.", origin: 'tashkent_almazar', dest: 'andijan', weight: 1500, dims: [4.0, 2.0, 2.0], carType: 'Furgon', payer: 'third_party', status: 'posted', daysOld: 1, isRound: false },
    { name: "Sovutgich (komp.)", cargo_type: "Maishiy texnika", description: "5 ta sovutgich, 3 ta kir yuvish mashinasi. Magazinga yetkazish.", origin: 'tashkent_yashnabad', dest: 'qarshi', weight: 600, dims: [2.5, 1.5, 2.0], carType: 'Pikap', payer: 'receiver', status: 'posted', daysOld: 1.2, isRound: false },
    { name: "Kiyim-kechak (omborga)", cargo_type: "Kiyim", description: "Turkiyadan kelgan kiyimlar. Omborga yetkazish.", origin: 'tashkent_mirzo', dest: 'namangan', weight: 1200, dims: [3.5, 2.0, 1.9], carType: 'Furgon', payer: 'sender', status: 'posted', daysOld: 1.5, isRound: true },
    { name: "Toshqolib (300 ta)", cargo_type: "Qurilish materiali", description: "Yengil og'irlik beton bloklar. Yuklash kran bilan.", origin: 'samarkand', dest: 'jizzakh', weight: 4500, dims: [6.0, 2.4, 2.5], carType: 'Yuk mashinasi (5t)', payer: 'sender', status: 'posted', daysOld: 2, isRound: false },
    { name: "Konteyner (40-fut)", cargo_type: "Sanoat yuki", description: "Xitoydan kelgan konteyner. Bojxonadan chiqarilgan.", origin: 'tashkent_yashnabad', dest: 'nukus', weight: 18000, dims: [12.0, 2.4, 2.6], carType: 'TIR', payer: 'sender', status: 'posted', daysOld: 2.5, isRound: false },

    // ASSIGNED (3) — driver tayinlangan, hali yo'lda emas
    { name: "Avtomobil ehtiyot qismlari", cargo_type: "Avtoehtiyot qism", description: "BMW va Mercedes ehtiyot qismlari, 3 ta katta quti.", origin: 'tashkent_chilanzar', dest: 'bukhara', weight: 500, dims: [2.0, 1.5, 1.0], carType: 'Pikap', payer: 'receiver', status: 'assigned', daysOld: 3, isRound: false },
    { name: "Sabzavot to'plami", cargo_type: "Oziq-ovqat", description: "Kartoshka, sabzi, piyoz aralash. Bozorga yetkazish.", origin: 'tashkent_almazar', dest: 'samarkand', weight: 3000, dims: [4.0, 2.0, 1.8], carType: 'Yuk mashinasi (5t)', payer: 'sender', status: 'assigned', daysOld: 3.2, isRound: false },
    { name: "Sport jihozlari", cargo_type: "Sport tovari", description: "Trenajyorlar, fitnes anjomlari. Magazin uchun.", origin: 'tashkent_yunusabad', dest: 'fergana', weight: 1800, dims: [3.5, 2.0, 1.9], carType: 'Furgon', payer: 'third_party', status: 'assigned', daysOld: 3.5, isRound: false },

    // IN_TRANSIT_GET_LOAD (2) — driver yukni olishga ketmoqda
    { name: "Maishiy kimyo mahsulotlari", cargo_type: "Kimyoviy mahsulot", description: "Yuvish vositalari, sovunlar. 25 ta quti.", origin: 'tashkent_sergeli', dest: 'qarshi', weight: 1100, dims: [3.0, 2.0, 1.5], carType: 'Furgon', payer: 'sender', status: 'in_transit_get_load', daysOld: 0.3, isRound: false },
    { name: "Plitka (keramika)", cargo_type: "Qurilish materiali", description: "Pol plitkasi, 200 m². Italiya brendi.", origin: 'tashkent_mirzo', dest: 'andijan', weight: 4000, dims: [5.0, 2.4, 1.5], carType: 'Yuk mashinasi (5t)', payer: 'sender', status: 'in_transit_get_load', daysOld: 0.5, isRound: false },

    // ARRIVED_PICKED_UP (2) — driver yetib keldi, yuklash boshlanmoqchi
    { name: "Konditerlik mahsulotlari", cargo_type: "Oziq-ovqat", description: "Konfetlar, shokoladlar. Magazinga yetkazish.", origin: 'tashkent_yashnabad', dest: 'jizzakh', weight: 700, dims: [2.5, 1.8, 1.5], carType: 'Pikap', payer: 'receiver', status: 'arrived_picked_up', daysOld: 0.2, isRound: false },
    { name: "Elektr asboblari", cargo_type: "Maishiy texnika", description: "Drilli, bolg'a, asboblar to'plami. Qurilish do'koni uchun.", origin: 'tashkent_chilanzar', dest: 'samarkand', weight: 900, dims: [3.0, 1.8, 1.6], carType: 'Furgon', payer: 'sender', status: 'arrived_picked_up', daysOld: 0.4, isRound: false },

    // PICKED_UP (2) — yuk olindi, yo'lda emas hali
    { name: "Avtomobil moylari", cargo_type: "Avtoehtiyot qism", description: "Castrol, Mobil moylari. 50 ta kanistr.", origin: 'tashkent_yashnabad', dest: 'navoi', weight: 1500, dims: [3.5, 2.0, 1.8], carType: 'Furgon', payer: 'sender', status: 'picked_up', daysOld: 0.6, isRound: false },
    { name: "Mevali sharbat (qadoqli)", cargo_type: "Oziq-ovqat", description: "Apelsin va olma sharbati, 1L butilkalar. 500 ta quti.", origin: 'tashkent_almazar', dest: 'termez', weight: 6000, dims: [6.0, 2.4, 2.2], carType: 'Yuk mashinasi (5t)', payer: 'sender', status: 'picked_up', daysOld: 0.8, isRound: false },

    // IN_TRANSIT (3) — yo'lda
    { name: "Tekstil mahsulotlari", cargo_type: "Kiyim, tekstil", description: "Choyshab, sochiq, parda. 80 quti.", origin: 'fergana', dest: 'tashkent_yashnabad', weight: 2200, dims: [4.5, 2.2, 1.9], carType: 'Furgon', payer: 'receiver', status: 'in_transit', daysOld: 1.1, isRound: false },
    { name: "Issiqxonadan pomidor", cargo_type: "Oziq-ovqat (sovuq saqlash)", description: "Yangi terilgan, 4 tonna. Sovuq saqlash zarur.", origin: 'samarkand_urgut', dest: 'urgench', weight: 4000, dims: [5.5, 2.4, 2.3], carType: 'TIR', payer: 'sender', status: 'in_transit', daysOld: 1.3, isRound: false },
    { name: "Ofis mebellari", cargo_type: "Mebel", description: "Stol, stul, shkaf. Yangi ofisga yetkazish.", origin: 'tashkent_yunusabad', dest: 'qarshi', weight: 1700, dims: [4.0, 2.0, 1.9], carType: 'Furgon', payer: 'third_party', status: 'in_transit', daysOld: 1.5, isRound: false },

    // DELIVERED (5) — tugagan
    { name: "Avtoshina (4 ta to'plam)", cargo_type: "Avtoehtiyot qism", description: "Michelin shinalar, 16 ta dona.", origin: 'tashkent_chilanzar', dest: 'bukhara', weight: 320, dims: [2.0, 1.5, 1.2], carType: 'Pikap', payer: 'sender', status: 'delivered', daysOld: 5, isRound: false },
    { name: "Maktab uskunalari", cargo_type: "Boshqa", description: "Parta, doska, stullar. Yangi maktab uchun.", origin: 'tashkent_yashnabad', dest: 'samarkand', weight: 2800, dims: [5.0, 2.2, 2.0], carType: 'Yuk mashinasi (5t)', payer: 'third_party', status: 'delivered', daysOld: 7, isRound: false },
    { name: "Konteyner (export Qozog'iston)", cargo_type: "Sanoat yuki", description: "Toshkent–Almati yo'nalishida.", origin: 'tashkent_mirzo', dest: 'jizzakh', weight: 15000, dims: [12.0, 2.4, 2.6], carType: 'TIR', payer: 'sender', status: 'delivered', daysOld: 10, isRound: false },
    { name: "Sun'iy gul (do'kon)", cargo_type: "Boshqa", description: "Sun'iy gullar va bezaklar.", origin: 'tashkent_almazar', dest: 'andijan', weight: 400, dims: [2.5, 1.5, 1.5], carType: 'Pikap', payer: 'receiver', status: 'delivered', daysOld: 12, isRound: false },
    { name: "Mineral suv (5L butilka)", cargo_type: "Oziq-ovqat", description: "1000 ta butilka. Magazin tarmog'iga yetkazib berildi.", origin: 'tashkent_sergeli', dest: 'termez', weight: 5500, dims: [6.0, 2.4, 2.2], carType: 'Yuk mashinasi (5t)', payer: 'sender', status: 'delivered', daysOld: 15, isRound: false },
]

// ─── Main seed ─────────────────────────────────────────────────────────
;(async () => {
    try {
        await sequelize.authenticate()
        console.log('✅ DB ulanish OK')

        const reset = process.argv.includes('--reset')

        if (reset) {
            console.log('🗑️  --reset: avval barcha seed datalarni o\'chiraman...')
            await Notification.destroy({ where: {} })
            await Location.destroy({ where: {} })
            await Assignment.destroy({ where: {} })
            await DriverStop.destroy({ where: {} })
            await LoadDetails.destroy({ where: {} })
            await Load.destroy({ where: {} })
            await Driver.destroy({ where: {} })
            await Users.destroy({ where: { role: { [Op.in]: ['driver', 'cargo_owner'] } } })
            console.log('   ✓ Barcha load, driver, owner ma\'lumotlari o\'chirildi')

            // Fix legacy column type bug: loading_time may be stored as float8
            try {
                await sequelize.query(
                    'ALTER TABLE "LoadDetails" ALTER COLUMN "loading_time" TYPE TIMESTAMP WITH TIME ZONE USING NULL'
                )
                console.log('   ✓ LoadDetails.loading_time ustun tipi tuzatildi')
            } catch (e) {
                // Already correct type or table doesn't exist yet
            }
        } else {
            const exists = await Users.findOne({ where: { phone: SEED_MARKER_PHONE } })
            if (exists) {
                console.log('\n⚠️  Seed allaqachon ishlatilgan.')
                console.log('   Qayta yuklash uchun: node scripts/seedMockData.js --reset\n')
                await sequelize.close()
                process.exit(0)
            }
        }

        const carTypes = await CarType.findAll()
        if (carTypes.length === 0) {
            console.error('❌ CarType jadvali bo\'sh! Avval ishga tushiring: node scripts/seedCarTypes.js')
            await sequelize.close()
            process.exit(1)
        }
        const ctByName = (n) => carTypes.find(c => c.name === n) || carTypes[0]

        // ─── 1. OWNERS ─────────────────────────────────────
        console.log('\n📦 Yuk egalari yaratilmoqda...')
        const ownerRecords = []
        for (const o of OWNERS) {
            const u = await Users.create({
                firstname: o.firstname,
                lastname: o.lastname,
                phone: o.phone,
                phone_2: o.phone_2,
                email: o.email,
                address: o.address,
                birthday: o.birthday,
                user_img: o.user_img,
                role: 'cargo_owner',
                user_status: 'active',
                password: await bcrypt.hash('User123', 10),
            })
            ownerRecords.push(u)
            console.log(`   + ${o.firstname} ${o.lastname} (${o.phone})`)
        }

        // ─── 2. DRIVERS ────────────────────────────────────
        console.log('\n🚛 Haydovchilar yaratilmoqda...')
        const driverRecords = []
        for (const [i, d] of DRIVERS.entries()) {
            const u = await Users.create({
                firstname: d.user.firstname,
                lastname: d.user.lastname,
                phone: d.user.phone,
                phone_2: d.user.phone_2,
                email: d.user.email,
                address: d.user.address,
                birthday: d.user.birthday,
                user_img: d.user.user_img,
                role: 'driver',
                user_status: d.driver.blocked ? 'inactive' : 'active',
                password: await bcrypt.hash('Driver123', 10),
            })

            const drv = await Driver.create({
                user_id: u.id,
                car_type_id: ctByName(d.carTypeName).id,
                name: d.driver.name,
                tex_pas_ser: d.driver.tex_pas_ser,
                tex_pas_num: d.driver.tex_pas_num,
                prava_ser: d.driver.prava_ser,
                prava_num: d.driver.prava_num,
                car_img: carImg(i + 1),
                tex_pas_img: docImg(`tex${i + 1}`),
                prava_img: docImg(`prava${i + 1}`),
                driver_status: d.driver.driver_status,
                is_approved: d.driver.is_approved,
                blocked: d.driver.blocked,
            })
            driverRecords.push({ user: u, driver: drv })
            const badge = d.driver.blocked ? '🚫 blocked' : d.driver.is_approved ? '✓ approved' : '⏳ pending'
            console.log(`   + ${d.user.firstname} ${d.user.lastname} (${d.driver.name}) ${badge}`)
        }

        // ─── 3. LOADS + LoadDetails + DriverStop + Assignment + Location ─
        console.log('\n📦 Yuklar yaratilmoqda...')

        // Approved + non-blocked drivers for assignment
        const availableDrivers = driverRecords.filter(d => d.driver.is_approved && !d.driver.blocked)
        let driverCursor = 0
        const pickDriver = () => {
            const d = availableDrivers[driverCursor % availableDrivers.length]
            driverCursor++
            return d
        }

        let loadCount = 0
        for (const t of LOAD_TEMPLATES) {
            const owner = pickRandom(ownerRecords)
            const created = daysAgo(t.daysOld)

            const load = await Load.create({
                user_id: owner.id,
                name: t.name,
                cargo_type: t.cargo_type,
                receiver_phone: '+998' + (90 + randInt(0, 9)) + String(randInt(1000000, 9999999)),
                payer: t.payer,
                description: t.description,
                load_status: t.status,
                is_round_trip: t.isRound,
                status: 'active',
                createdAt: created,
                updatedAt: created,
            })

            // LoadDetails
            const loadingTime = t.status === 'delivered' ? daysAgo(t.daysOld - 0.5) : daysAhead(0.5)
            await LoadDetails.create({
                load_id: load.id,
                weight: t.weight,
                length: t.dims[0],
                width: t.dims[1],
                height: t.dims[2],
                car_type_id: ctByName(t.carType).id,
                loading_time: loadingTime,
            })

            // DriverStop (origin + destination + optional middle stops)
            const o = CITY[t.origin]
            const d = CITY[t.dest]
            const stops = [
                { load_id: load.id, latitude: o.lat, longitude: o.lon, order: 0, location_name: o.name },
                { load_id: load.id, latitude: d.lat, longitude: d.lon, order: 1, location_name: d.name },
            ]

            // Set start_time / end_time for delivered loads
            if (t.status === 'delivered') {
                stops[0].start_time = daysAgo(t.daysOld - 0.5)
                stops[0].end_time = daysAgo(t.daysOld - 0.4)
                stops[1].start_time = daysAgo(t.daysOld - 0.2)
                stops[1].end_time = daysAgo(t.daysOld - 0.1)
            } else if (['picked_up', 'in_transit'].includes(t.status)) {
                stops[0].start_time = daysAgo(0.5)
                stops[0].end_time = daysAgo(0.3)
            } else if (t.status === 'arrived_picked_up') {
                stops[0].start_time = daysAgo(0.1)
            }

            await DriverStop.bulkCreate(stops)

            // Assignment (for non-posted)
            if (t.status !== 'posted') {
                const driverData = pickDriver()
                const pickUp = t.status === 'delivered' ? daysAgo(t.daysOld - 0.4) : daysAhead(0.3)
                const delivery = t.status === 'delivered' ? daysAgo(t.daysOld - 0.1) : daysAhead(1.5)

                await Assignment.create({
                    load_id: load.id,
                    driver_id: driverData.driver.id,
                    assignment_status: t.status === 'posted' ? 'assigned' : t.status,
                    pickUpTime: pickUp,
                    deliveryTime: delivery,
                    createdAt: created,
                })

                // Location records for in-transit-ish statuses (simulate GPS trail)
                if (['picked_up', 'in_transit', 'in_transit_get_load', 'arrived_picked_up', 'delivered'].includes(t.status)) {
                    const startLat = t.status === 'in_transit_get_load' ? d.lat + (o.lat - d.lat) * 0.7 : o.lat
                    const startLon = t.status === 'in_transit_get_load' ? d.lon + (o.lon - d.lon) * 0.7 : o.lon
                    const endLat = t.status === 'delivered' ? d.lat : t.status === 'in_transit' ? o.lat + (d.lat - o.lat) * 0.6 : o.lat + 0.001
                    const endLon = t.status === 'delivered' ? d.lon : t.status === 'in_transit' ? o.lon + (d.lon - o.lon) * 0.6 : o.lon + 0.001

                    const points = randInt(5, 12)
                    const baseTime = t.status === 'delivered' ? daysAgo(t.daysOld - 0.4).getTime() : daysAgo(0.5).getTime()
                    const timeSpan = t.status === 'delivered' ? 3 * 3600000 : 2 * 3600000

                    const locationsToInsert = []
                    for (let p = 0; p < points; p++) {
                        const ratio = p / (points - 1)
                        locationsToInsert.push({
                            load_id: load.id,
                            latitude: (startLat + (endLat - startLat) * ratio + rand(-0.005, 0.005)).toFixed(8),
                            longitude: (startLon + (endLon - startLon) * ratio + rand(-0.005, 0.005)).toFixed(8),
                            recordedAt: new Date(baseTime + timeSpan * ratio),
                            order: p + 1,
                        })
                    }
                    // bulk create one-by-one because of the beforeCreate hook on Location
                    for (const loc of locationsToInsert) {
                        await Location.create(loc)
                    }
                }
            }

            loadCount++
            console.log(`   + [${t.status}] ${t.name} — ${o.name.split(',')[0]} → ${d.name.split(',')[0]}`)
        }

        // ─── 4. Bir nechta notification ─────────────────────
        console.log('\n🔔 Bildirishnomalar yaratilmoqda...')
        const someLoads = await Load.findAll({ limit: 6, order: [['createdAt', 'DESC']] })
        for (const l of someLoads) {
            await Notification.create({
                load_id: l.id,
                user_id: l.user_id,
                message: `Sizning "${l.name}" yukingiz holati: ${l.load_status}`,
                order: 1,
            })
        }
        console.log(`   + ${someLoads.length} ta notification`)

        // ─── Summary ───────────────────────────────────────
        const counts = {
            owners: await Users.count({ where: { role: 'cargo_owner' } }),
            drivers: await Driver.count(),
            driversApproved: await Driver.count({ where: { is_approved: true } }),
            driversPending: await Driver.count({ where: { is_approved: false } }),
            driversBlocked: await Driver.count({ where: { blocked: true } }),
            loads: await Load.count(),
            assignments: await Assignment.count(),
            locations: await Location.count(),
            stops: await DriverStop.count(),
            carTypes: carTypes.length,
            notifications: await Notification.count(),
        }

        console.log('\n📊 YAKUNIY HISOB:')
        console.log(`   Cargo owners:     ${counts.owners}`)
        console.log(`   Drivers:          ${counts.drivers} (${counts.driversApproved} approved · ${counts.driversPending} pending · ${counts.driversBlocked} blocked)`)
        console.log(`   Loads:            ${counts.loads} (har statusda)`)
        console.log(`   Assignments:      ${counts.assignments}`)
        console.log(`   GPS Locations:    ${counts.locations}`)
        console.log(`   Driver Stops:     ${counts.stops}`)
        console.log(`   Notifications:    ${counts.notifications}`)
        console.log(`   Car Types:        ${counts.carTypes}`)
        console.log('\n✅ Mock data muvaffaqiyatli yuklandi!')
        console.log('\n   Login credentials:')
        console.log('   - Admin:  +998900000000 / Admin123')
        console.log('   - Owner:  +998901111101 / User123 (yoki ...102-...112)')
        console.log('   - Driver: +998901112201 / Driver123 (yoki ...2202-...2218)\n')

        await sequelize.close()
        process.exit(0)
    } catch (err) {
        console.error('\n❌ Seed xatolik:', err)
        process.exit(1)
    }
})()
