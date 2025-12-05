import { UseCase } from "../../application/core/UseCase.ts";
import { RetryExecutor, RetryOptions } from "../resilience/RetryExecutor.ts";

export class RetryUseCaseDecorator<I, O> implements UseCase<I, O> {
  constructor(
    private useCase: UseCase<I, O>,
    private options: RetryOptions = {}
  ) {}

  async execute(request: I): Promise<O> {
    const operationName = this.useCase.constructor.name;

    return await RetryExecutor.execute<O>(
      operationName,
      async () => {
        return await this.useCase.execute(request);
      },
      this.options
    );
  }
}
