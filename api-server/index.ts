import elysia from "elysia";
import { processEndpoint } from "./src/endpoints/process";

new elysia()
  .use(processEndpoint)
  .get("/", "Hello Mom!")
  .listen(3000, ({ hostname, port }) => {
    console.log("Server corriendo en", hostname, port);
  });
