import { Capacitor, registerPlugin } from "@capacitor/core";

interface NativePreferencesPluginContract {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
}

const NativePreferences =
  registerPlugin<NativePreferencesPluginContract>("NativePreferences");

export const isNativeAndroid = () =>
  typeof window !== "undefined" &&
  Capacitor.isNativePlatform() &&
  Capacitor.getPlatform() === "android";

export const nativePreferences = {
  async get(key: string): Promise<string | null> {
    if (!isNativeAndroid()) return null;
    const { value } = await NativePreferences.get({ key });
    return value ?? null;
  },

  async set(key: string, value: string): Promise<void> {
    if (!isNativeAndroid()) return;
    await NativePreferences.set({ key, value });
  },

  async remove(key: string): Promise<void> {
    if (!isNativeAndroid()) return;
    await NativePreferences.remove({ key });
  },
};
