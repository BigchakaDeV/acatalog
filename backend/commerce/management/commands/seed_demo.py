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

        categories = [
            ('Placas de vídeo', 'placas-de-video'),
            ('Processadores', 'processadores'),
            ('Placas-mãe', 'placas-mae'),
            ('Memórias RAM', 'memorias-ram'),
            ('SSDs e armazenamento', 'ssds-e-armazenamento'),
            ('Fontes', 'fontes'),
            ('Gabinetes', 'gabinetes'),
            ('Monitores', 'monitores'),
            ('Periféricos gamer', 'perifericos-gamer'),
            ('Notebooks', 'notebooks'),
        ]
        brands = [
            ('Intel', 'intel'),
            ('AMD', 'amd'),
            ('NVIDIA', 'nvidia'),
            ('ASUS', 'asus'),
            ('Gigabyte', 'gigabyte'),
            ('MSI', 'msi'),
            ('Corsair', 'corsair'),
            ('Kingston', 'kingston'),
            ('Samsung', 'samsung'),
            ('Dell', 'dell'),
            ('Logitech', 'logitech'),
        ]

        for idx, (name, slug) in enumerate(categories, start=1):
            Category.objects.update_or_create(
                slug=slug,
                defaults={'name': name, 'is_featured': idx <= 6, 'sort_order': idx},
            )
        for idx, (name, slug) in enumerate(brands, start=1):
            Brand.objects.update_or_create(
                slug=slug,
                defaults={'name': name, 'is_featured': idx <= 8},
            )

        category = Category.objects.get(slug='ssds-e-armazenamento')
        brand = Brand.objects.get(slug='samsung')
        product, _ = Product.objects.update_or_create(
            slug='ssd-nvme-gen5-demo',
            defaults={
                'name': 'SSD NVMe 990 PRO 2TB',
                'sku': 'SSD-990PRO-DEMO',
                'category': category,
                'brand': brand,
                'description': 'SSD PCIe 4.0 de alto desempenho para workstations e setups gamer.',
                'specifications': {'Capacidade': '2TB', 'Leitura': '7450 MB/s', 'Interface': 'PCIe 4.0'},
                'price': Decimal('1199.90'),
                'promotional_price': Decimal('899.90'),
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
