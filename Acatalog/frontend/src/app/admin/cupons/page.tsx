import { AdminLayout } from '@/components/admin/admin-layout';
import { CouponForm } from '@/components/admin/forms';

export default function AdminCouponsPage() {
  return <AdminLayout><h1 className="mb-4 text-2xl font-black">Cupons</h1><CouponForm /></AdminLayout>;
}
