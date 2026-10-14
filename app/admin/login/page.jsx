import { redirect } from 'next/navigation';
import { getAdmin } from '../../../lib/security.js';
import AdminLogin from '../../../components/admin-login.jsx';
export default async function LoginPage() { if (await getAdmin()) redirect('/admin'); return <AdminLogin/>; }
