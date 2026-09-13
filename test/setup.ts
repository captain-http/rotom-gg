import { afterAll } from "vitest";
import { pool } from "../lib/db";

// Each test file gets its own module graph, and so its own pool.
afterAll(() => pool.end());
