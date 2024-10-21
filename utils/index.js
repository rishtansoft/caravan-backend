class UtilFunctions {
    validateEmail(email) {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    }

    validatePhoneNumber(phoneNumber) {
        // Telefon raqam +998 bilan boshlanib, keyingi 9 ta raqam kiritilishi kerak
        const regex = /^\+998(9[0-9]{2})([0-9]{7})$/;
        return regex.test(phoneNumber);
    }

    validateName(firstName) {
        // Ism kamida 3 ta belgidan iborat bo'lishi va raqam bilan boshlanmasligi kerak
        const regex = /^[^\d][a-zA-Z]{2,}$/;
        return regex.test(firstName);
    }

    // Tex passport seriya uchun
    validateTexPassportSeries(series) {
        const regex = /^[A-Z]{3}$/;
        return regex.test(series);
    }

    // Tex passport va prava raqam uchun
    validatePassportNumber(number) {
        const regex = /^[0-9]{7}$/;
        return regex.test(number);
    }

    // Prava passport seriya uchun
    validatePravaPassportSeries(series) {
        const regex = /^[A-Z]{2}$/;
        return regex.test(series);
    }

}

module.exports = new UtilFunctions();
