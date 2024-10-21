class UtilFunctions {
    validateEmail(email) {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    }

    validatePhoneNumber(phoneNumber) {
        // Raqamning boshlanishi +998 bilan, keyin 93 kabi 9 bilan boshlangan 3ta raqam va 7ta qoldiq raqam
        const regex = /^\+998([0-9]{2})([0-9]{7})$/;
        return regex.test(phoneNumber);
    }

    validateName(firstName) {
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
