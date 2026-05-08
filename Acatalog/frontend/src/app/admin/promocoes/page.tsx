import { AdminLayout } from '@/components/admin/admin-layout';
import { PromotionForm } from '@/components/admin/forms';

export default function AdminPromotionsPage() {
  return <AdminLayout><h1 className="mb-4 text-2xl font-black">Promocoes</h1><PromotionForm /></AdminLayout>;
}
