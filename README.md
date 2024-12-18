# Requirements

- Bun 1.0+
 You can use this bash script to install bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

## Install dependencies
```bash
bun install
```

## Preview and Testing
```bash
bun run start
```
This command will:
- start the workflow service.
- send the mock workflow to the service.
- provide debug information in the console.
- wait for the workflow to finish and print the result.
- exit the process.

## Development with auto-reloading
  ```bash
bun run dev
```
This command will:
- start the workflow service.
- send the mock workflow to the service every 2 seconds with auto-reloading on code changes.
- provide debug information in the console.
- clear the console history on each run, so it doesn't get messy.



