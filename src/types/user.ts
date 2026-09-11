export interface AdminUser {
  id: string;
  name: string;
  email?: string;
  imageUrl?: string;
  online: boolean;
  lastSeenAt?: string;
}
