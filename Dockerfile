FROM denoland/deno:2.5.6

USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN deno cache --config deno.jsonc --lock=deno.lock openNote/Main.ts
RUN deno cache --config deno.jsonc --lock=deno.lock openNote/interface/worker/Worker.ts
RUN mkdir -p interface/web/public/backups

# COPY start.sh .
# RUN chmod +x start.sh
# CMD ["./start.sh"]
CMD ["deno", "run", "-A", "openNote/Main.ts"]