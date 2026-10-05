import { redirect } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin/session.server';

export default async function AdminIndex() {
  await requireAdminPage('/admin');
  redirect('/admin/comments');
}
