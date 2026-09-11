import {
  setAdminOffline,
  setAdminOnline,
  isAnyAdminOnline,
  getOnlineAdminIds,
  setVisitorOnline,
  setVisitorOffline,
  isVisitorOnline,
} from "@/lib/redis/presence";

export const updatePresence = {
  markOnline: setAdminOnline,
  markOffline: setAdminOffline,
  isAnyAdminOnline,
  getOnlineAdminIds,
  markVisitorOnline: setVisitorOnline,
  markVisitorOffline: setVisitorOffline,
  isVisitorOnline,
};
