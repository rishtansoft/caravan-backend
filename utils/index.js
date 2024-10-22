const { S3, S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

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

    async uploadFile(file, configService) {
        try {
            const s3Client = new S3({
                credentials: {
                    accessKeyId: configService.get('S3_ACCESS_KEY'),
                    secretAccessKey: configService.get('S3_SECRET_KEY'),
                },
                endpoint: configService.get('S3_ENDPOINT'),
                forcePathStyle: true,
                region: configService.get('S3_REGION'),
            });
            
            const fileName = `caravan/${Date.now()}.png`;
            let contentType = file.mimetype;

            if (contentType.startsWith('image/')) {
                if (!['image/jpeg', 'image/png', 'image/gif'].includes(contentType)) {
                    contentType = 'image/jpeg';
                }
            } else {
                throw new Error('Only image files are allowed!');
            }

            const upload = new Upload({
                client: s3Client,
                params: {
                    Bucket: configService.get('S3_BUCKET_NAME'),
                    Key: fileName,
                    Body: file.buffer,
                    ContentType: contentType,
                },
            });

            await upload.done();

            const fileUrl = `${configService.get('S3_ENDPOINT')}/${configService.get('S3_BUCKET_NAME')}/${fileName}`;
            return fileUrl;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw new Error(`Failed to upload file to S3: ${error.message}`);
        }
    }

    async deleteFile(fileUrl, configService) {
        try {
            const fileName = fileUrl;
            
            const s3Client = new S3Client({
                region: configService.get('S3_REGION'),
                credentials: {
                    accessKeyId: configService.get('S3_ACCESS_KEY'),
                    secretAccessKey: configService.get('S3_SECRET_KEY'),
                },
                endpoint: configService.get('S3_ENDPOINT'),
                forcePathStyle: true,
            });
    
            const deleteParams = {
                Bucket: configService.get('S3_BUCKET_NAME'),
                Key: fileName,
            };
    
            const command = new DeleteObjectCommand(deleteParams);
            const response = await s3Client.send(command);  // Faylni o'chirishni kutamiz
    
            return {
                message: 'File deleted successfully',
                response,
            };
        } catch (error) {
            console.error("Error deleting file from S3:", error);
            throw new Error(`Failed to delete file from S3: ${error.message}`);
        }
    }

}

module.exports = new UtilFunctions();
