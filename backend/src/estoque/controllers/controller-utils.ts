import type { Logger } from '@nestjs/common';

export async function withLog(
  logger: Logger,
  action: string,
  successMessage: string,
  fn: () => Promise<void>,
): Promise<{ success: true; message: string }>;
export async function withLog<T>(
  logger: Logger,
  action: string,
  successMessage: string,
  fn: () => Promise<T>,
): Promise<{ success: true; data: T; message: string }>;
export async function withLog<T>(
  logger: Logger,
  action: string,
  successMessage: string,
  fn: () => Promise<T | void>,
): Promise<
  | { success: true; message: string }
  | { success: true; data: T; message: string }
> {
  try {
    const result = await fn();
    if (typeof result === 'undefined') {
      return { success: true, message: successMessage };
    }
    return { success: true, data: result as T, message: successMessage };
  } catch (error: any) {
    logger.error(`❌ ${action}: ${error?.message}`);
    throw error;
  }
}

export async function withLogReturn<T>(
  logger: Logger,
  action: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    logger.error(`❌ ${action}: ${error?.message}`);
    throw error;
  }
}
