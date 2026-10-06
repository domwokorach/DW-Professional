import { redirect } from 'next/navigation';

/** The section was renamed: /admin/portfolio-access now lives at /admin/sessions. */
export default function AdminPortfolioAccessRedirect() {
  redirect('/admin/sessions');
}
