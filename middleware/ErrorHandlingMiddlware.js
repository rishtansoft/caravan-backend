const ApiError = require('../error/ApiError')

function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      status: err.status,
      message: err.message,
    });
  }

  return res.status(500).json({
    status: 500,
    message: 'Serverda kutilmagan xatolik yuz berdi',
  });
}

module.exports = errorHandler;
