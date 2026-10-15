import elysia from "elysia";
import { ProcessService } from "./process-service";
import { ProcessModel } from "./model";

export const processEndpoint = new elysia({ prefix: "process" }).get(
  "/",
  async ({ query }) => {
    console.log(query.limit);
    return await ProcessService.getProcess(query.limit);
  },
  {
    query: ProcessModel.Query,
  },
);
