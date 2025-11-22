build:
	deno run --allow-read --allow-write src/main.ts

run:
	deno run --allow-read --allow-write src/main.ts
	docker compose exec runner sh -c 'cc -o ./dist/out ./dist/out.s'
	docker compose exec runner sh -c './dist/out; echo $$?'

debug:
	deno run --allow-read --allow-write src/main.ts
	docker compose exec runner sh -c 'cc -g -o ./dist/out ./dist/out.s'
	docker compose exec runner sh -c 'gdb ./dist/out'