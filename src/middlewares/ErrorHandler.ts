import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { customErrorType } from "../Types/Auth/Error";



const errorHandler = (
  err: customErrorType,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.status || 500;
  const errorMessage = err.message || "Something went wrong";

  res.json({
    error: {
      status: statusCode,
      message: errorMessage,
    },
  });
};

export default errorHandler;
