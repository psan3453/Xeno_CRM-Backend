import { ErrorRequestHandler } from "express";
import { Error as MongooseError } from "mongoose";
import { ZodError } from "zod";
import HttpError from "../utils/httpError";

const getStatusCode = (error: unknown): number => {
  if (error instanceof HttpError) {
    return error.statusCode;
  }

  if (error instanceof ZodError) {
    return 400;
  }

  if (
    error instanceof MongooseError.ValidationError ||
    error instanceof MongooseError.CastError
  ) {
    return 400;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    return 409;
  }

  return 500;
};

const getErrorType = (statusCode: number): string => {
  if (statusCode === 400) {
    return "VALIDATION_ERROR";
  }

  if (statusCode === 409) {
    return "DATABASE_CONFLICT";
  }

  if (statusCode === 502) {
    return "UPSTREAM_ERROR";
  }

  return statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR";
};

const getMessage = (error: unknown, statusCode: number): string => {
  if (error instanceof ZodError) {
    return "Invalid request payload.";
  }

  if (error instanceof Error && statusCode < 500) {
    return error.message;
  }

  return "Internal server error";
};

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  const statusCode = getStatusCode(error);

  res.status(statusCode).json({
    error: {
      type: getErrorType(statusCode),
      message: getMessage(error, statusCode),
    },
  });
};
