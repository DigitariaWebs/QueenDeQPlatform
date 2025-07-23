exports.successResponse = (res, data, message = 'Success', status = 200) =>
  res.status(status).json({ message, data });

exports.errorResponse = (res, statusCode, message) =>
  res.status(statusCode).json({ message });
