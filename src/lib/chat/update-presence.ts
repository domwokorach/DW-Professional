import { setAdminOffline, setAdminOnline, isAnyAdminOnline, getOnlineAdminIds } from "@/lib/redis/presence";

export const updatePresence = {
  markOnline: setAdminOnline,
  markOffline: setAdminOffline,
  isAnyAdminOnline,
  getOnlineAdminIds,
};
