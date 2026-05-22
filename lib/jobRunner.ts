import { logger } from "./logger";

export async function runSafe<T>(
  nome: string,
  fn: () => Promise<T>
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    logger.error({ job: nome, err, msg: "job falhou — capturado pelo runSafe" });
    return null;
  }
}
