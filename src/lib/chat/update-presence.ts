import {
  setAdminOffline,
  setAdminOnline,
  setAdminAway,
  touchAdminActivity,
  refreshAdminPresenceTtl,
  isAnyAdminOnline,
  getOnlineAdminIds,
  getStaleOnlineAdminIds,
  getAdminAggregateStatus,
  setVisitorOnline,
  setVisitorOffline,
  isVisitorOnline,
} from "@/lib/redis/presence";

export const updatePresence = {
  markOnline: setAdminOnline,
  markOffline: setAdminOffline,
  markAway: setAdminAway,
  touchActivity: touchAdminActivity,
  refreshTtl: refreshAdminPresenceTtl,
  isAnyAdminOnline,
  getOnlineAdminIds,
  getStaleOnlineAdminIds,
  getAggregateStatus: getAdminAggregateStatus,
  markVisitorOnline: setVisitorOnline,
  markVisitorOffline: setVisitorOffline,
  isVisitorOnline,
};
