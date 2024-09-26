class Validate {
    isValidUUID(value) {
        // uuid ni tekshiradigon validate
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }
    containsSQLCode(text) {
        // Define regular expressions for common SQL code patterns
        const sqlPatterns = [
            /SELECT .*? FROM/i,
            /INSERT INTO .*? VALUES/i,
            /UPDATE .*? SET/i,
            /DELETE FROM .*? WHERE/i,
            /CREATE TABLE .*? \(/i,
            /ALTER TABLE .*? ADD/i,
            /DROP TABLE .*?/i,
            /CREATE DATABASE .*?/i,
            /USE DATABASE .*?/i,
            /--.*?$/m, // SQL comments
            /\/\*[\s\S]*?\*\//, // SQL multiline comments
        ];

        // Iterate through each pattern and check if it exists in the text
        for (const pattern of sqlPatterns) {
            if (pattern.test(text)) {
                return true; // Found SQL code
            }
        }

        return false; // No SQL code found
    }
    isValidLicenseID(licenseID) {
        // Example: License ID should be alphanumeric and between 8 to 10 characters
        const licenseRegex = /^[A-Za-z0-9]{8,10}$/;

        // Test the input against the regex
        if (licenseRegex.test(licenseID)) {
            return true; // License ID is valid
        } else {
            return false; // License ID is invalid
        }
    }
    isDate(dateString) {
        const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
        const match = dateString.match(regex);
        const date = new Date(dateString);
        if (match && !isNaN(date.getTime())) {
            return true;
        } else {
            return false;
        }
    }
    is_img(img) {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
        if (allowedMimeTypes.includes(img.mimetype)) {
            return true;
        } else {
            return false;
        }

    }
    validateCode(a) {
        // Check if the length is 6 and all characters are digits
        if (a.length === 6 && /^[0-9]+$/.test(a)) {
            return true;
        } else {
            return false;
        }
    }
    validatePhoneNumber(phone) {
        // "+998123456789" format 
        const phoneRegex = /^\+998\d{9}$/;
        return phoneRegex.test(phone);
    }

}

module.exports = new Validate();
