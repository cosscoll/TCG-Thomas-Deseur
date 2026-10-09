import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "line",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:8000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "python3 -m http.server 8000 --bind 127.0.0.1",
    url: "http://127.0.0.1:8000/",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
