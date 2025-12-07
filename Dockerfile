FROM denoland/deno:2.5.4

USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app


COPY deno.jsonc import_map.json deno.lock ./

COPY . .

RUN deno cache --config deno.jsonc --lock=deno.lock openNote/Main.ts
RUN deno cache --config deno.jsonc --lock=deno.lock openNote/interface/worker/Worker.ts



RUN mkdir -p openNote/interface/web/public/backups


EXPOSE 7000

CMD ["run", "--allow-all", "--config", "deno.jsonc", "openNote/Main.ts"]
