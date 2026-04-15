import { Platform } from "react-native";

// Rajdhani is the primary font — geometric, industrial, Indian
// Falls back to system on load failure
export const F = {
  regular: Platform.select({ web: "Rajdhani_400Regular", default: "Rajdhani_400Regular" }),
  medium: Platform.select({ web: "Rajdhani_500Medium", default: "Rajdhani_500Medium" }),
  semibold: Platform.select({ web: "Rajdhani_600SemiBold", default: "Rajdhani_600SemiBold" }),
  bold: Platform.select({ web: "Rajdhani_700Bold", default: "Rajdhani_700Bold" }),
};
