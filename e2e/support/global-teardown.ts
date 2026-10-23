import { purgeTestData, restoreSettings } from "./data";

export default async function globalTeardown() {
  await restoreSettings();
  await purgeTestData();
}
