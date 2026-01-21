import { Text, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../store/authStore";
import styles from "../assets/styles/profile.styles";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/colors";

export default function LogoutButton() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const confirmLogout = () => {
    // On web, Alert with multiple buttons is unreliable. Use confirm().
    if (Platform.OS === "web") {
      const ok = globalThis?.confirm?.("Are you sure you want to logout?");
      if (!ok) return;
      logout().finally(() => router.replace("/(auth)"));
      return;
    }

    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          await logout();
          router.replace("/(auth)");
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
      <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );
}
