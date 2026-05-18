import { Response } from 'express';

interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data?: T;
}

/**
 * Standardized API success response helper.
 * Enforces uniform payload structures across all controllers in ffairdrop.
 *
 * @param res Express Response object
 * @param data Response configuration payload
 */
export const sendResponse = <T>(
  res: Response,
  data: IResponse<T>
): void => {
  res.status(data.statusCode).send({
    success: data.success,
    status: data.statusCode,
    message: data.message || 'Operation completed successfully.',
    meta: data.meta || undefined,
    data: data.data || undefined,
    path: res.req?.originalUrl || undefined,
  });
};

export default sendResponse;
