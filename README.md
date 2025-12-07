# OpenNote

OpenNote is a web based text editor/note taking software.

## Dependencies

- [Deno](https://docs.deno.com/runtime/getting_started/installation/) (Backend server)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (Frontend)
- [Docker Compose](https://docs.docker.com/compose/install) (Database & Cache)

## How to install

```cmd
$ deno install
$ cd openNote/interface/frontend-vue && npm install
```

## How to run

Set your variables in the `.env` file following the format of `.env.example`

```cmd
$ docker compose up -d
```

Run these 3 commands in 3 different processes

```cmd
$ deno task dev
$ deno task worker
$ deno task vue
```
