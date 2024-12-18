# Requirements

- Bun 1.0+
- Node.js 18+

 You can use this bash script to install bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

## Install dependencies
```bash
bun install
```

## Preview and Testing
This workflow is designed to be run in a single terminal window. It will start the workflow service and the third-party mock API service, to illustrate step payload piping usage within next steps.


## Mock API endpoints

- `/bitcoin-rate` - returns the current bitcoin rate.
```typescript
{
  btcToUsdRate: number;
  usdToBtcRate: number;
}
```
- `/current-balance` - returns the current balance of the user.
```typescript
{
  balance: number;
}
```
- `/process-high-balance` - processes the high balance of the user.
```typescript
{
  balance: number;
}
```
- `/process-low-balance` - processes the low balance of the user.
```typescript
{
  balance: number;
}
```

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



