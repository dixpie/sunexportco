import { redirect } from 'next/navigation';
import { getAdmin } from '../../lib/security.js';
import AdminDashboard from '../../components/admin-dashboard.jsx';
export default async function AdminPage() { const admin = await getAdmin(); if (!admin) redirect('/admin/login'); return <AdminDashboard admin={admin}/>; }
