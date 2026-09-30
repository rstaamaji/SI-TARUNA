import { redirect } from 'next/navigation';

export default function AnggotaRedirect() {
  redirect('/admin/members');
}
