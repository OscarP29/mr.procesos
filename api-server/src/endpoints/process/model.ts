import { t } from "elysia";

export const ProcessModel = {
  Query: t.Object({
    limit: t.Optional(
      t.Numeric({
        minimum: 1,
        maximum: 500,
        default: 10,
      }),
    ),
  }),
};
