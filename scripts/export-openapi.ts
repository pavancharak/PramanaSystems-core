import fs from "fs";

import Fastify from "fastify";

import swagger from "@fastify/swagger";

const server =
  Fastify();

async function
generateSpec(): Promise<void> {
  await server.register(
    swagger,
    {
      openapi: {
        info: {
          title:
            "PramanaSystems Runtime API",

          version:
            "1.0.0",
        },
      },
    }
  );

  server.get(
    "/health",
    async () => ({
      success: true,
    })
  );

  await server.ready();

  const spec =
    server.swagger();

  fs.writeFileSync(
    "./openapi.json",
    JSON.stringify(
      spec,
      null,
      2
    )
  );

  console.log(
    "OpenAPI spec exported to openapi.json"
  );

  process.exit(0);
}

generateSpec();


