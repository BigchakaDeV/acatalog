from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from commerce.models import Brand, Cart, Category, Coupon, Inventory, Product

User = get_user_model()


class Command(BaseCommand):
    help = 'Cria dados demo para validar o fluxo manual do Acatalog Tech.'

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            email='admin@acatalog.local',
            defaults={'username': 'admin', 'role': User.Role.ADMIN, 'is_staff': True, 'is_superuser': True},
        )
        if created:
            admin.set_password('Admin@12345')
            admin.save()
        customer, created = User.objects.get_or_create(
            email='cliente@acatalog.local',
            defaults={'username': 'cliente', 'role': User.Role.CUSTOMER},
        )
        if created:
            customer.set_password('Cliente@12345')
            customer.save()
        Cart.objects.get_or_create(user=customer)

        category, _ = Category.objects.get_or_create(name='Hardware', slug='hardware', defaults={'is_featured': True, 'sort_order': 1})
        brand, _ = Brand.objects.get_or_create(name='Acatalog Pro', slug='acatalog-pro', defaults={'is_featured': True})
        product, _ = Product.objects.update_or_create(
            slug='ssd-nvme-gen5-demo',
            defaults={
                'name': 'SSD NVMe Gen5 Demo 2TB',
                'sku': 'SSD-GEN5-DEMO',
                'category': category,
                'brand': brand,
                'description': 'Produto demo para validar catalogo, carrinho, cupom e checkout.',
                'specifications': {'Capacidade': '2TB', 'Leitura': '12000 MB/s', 'Interface': 'PCIe 5.0'},
                'price': Decimal('1299.90'),
                'promotional_price': Decimal('999.90'),
                'is_active': True,
                'is_featured': True,
                'is_new': True,
                'is_best_seller': True,
            },
        )
        Inventory.objects.update_or_create(product=product, defaults={'quantity': 25, 'reserved': 0, 'low_stock_threshold': 3})
        Coupon.objects.update_or_create(
            code='RAD10',
            defaults={
                'discount_type': Coupon.DiscountType.PERCENT,
                'value': Decimal('10.00'),
                'is_active': True,
                'valid_from': timezone.now() - timezone.timedelta(days=1),
                'valid_until': timezone.now() + timezone.timedelta(days=30),
                'usage_limit': 100,
            },
        )
        self.stdout.write(self.style.SUCCESS('Dados demo criados. Admin: admin@acatalog.local / Admin@12345; Cliente: cliente@acatalog.local / Cliente@12345; Cupom: RAD10'))
