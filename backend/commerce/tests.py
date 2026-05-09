from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Address, Brand, Cart, Category, Coupon, Inventory, Order, Product, ProductImage

User = get_user_model()


class CommerceApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='cliente', email='cliente@teste.com', password='senha-forte-123')
        self.admin = User.objects.create_user(username='admin', email='admin@teste.com', password='senha-forte-123', role=User.Role.ADMIN, is_staff=True)
        self.cart = Cart.objects.create(user=self.user)
        self.category = Category.objects.create(name='Hardware', slug='hardware')
        self.brand = Brand.objects.create(name='Acme', slug='acme')
        self.product = Product.objects.create(
            name='SSD NVMe',
            slug='ssd-nvme',
            sku='SSD-1',
            category=self.category,
            brand=self.brand,
            description='SSD rapido',
            price=Decimal('100.00'),
            promotional_price=Decimal('80.00'),
            is_active=True,
        )
        Inventory.objects.create(product=self.product, quantity=3, low_stock_threshold=1)
        self.address = Address.objects.create(
            user=self.user,
            recipient='Cliente',
            zip_code='01001000',
            street='Rua A',
            number='10',
            district='Centro',
            city='Sao Paulo',
            state='SP',
        )
        self.coupon = Coupon.objects.create(
            code='RAD10',
            discount_type=Coupon.DiscountType.PERCENT,
            value=Decimal('10.00'),
            valid_from=timezone.now() - timezone.timedelta(days=1),
            valid_until=timezone.now() + timezone.timedelta(days=1),
            usage_limit=10,
        )

    def auth(self, user=None):
        self.client.force_authenticate(user=user or self.user)

    def test_customer_login_returns_access_and_refresh_cookie(self):
        response = self.client.post('/api/auth/login/', {'email': self.user.email, 'password': 'senha-forte-123'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertIn('refresh_token', response.cookies)

    def test_admin_login_accepts_email_or_username(self):
        response = self.client.post('/api/auth/admin-login/', {'email': self.admin.email, 'password': 'senha-forte-123'})
        self.assertEqual(response.status_code, 200)
        response = self.client.post('/api/auth/admin-login/', {'email': self.admin.username, 'password': 'senha-forte-123'})
        self.assertEqual(response.status_code, 200)

    def test_refresh_rejects_invalid_cookie_without_server_error(self):
        self.client.cookies['refresh_token'] = 'token-invalido'
        response = self.client.post('/api/auth/refresh/')
        self.assertEqual(response.status_code, 401)

    def test_customer_cannot_create_admin_product(self):
        self.auth(self.user)
        response = self.client.post('/api/products/', {'name': 'X'})
        self.assertEqual(response.status_code, 403)

    def test_cart_add_validates_stock_and_calculates_backend_totals(self):
        self.auth()
        response = self.client.post('/api/cart/add/', {'product_id': self.product.id, 'quantity': 2})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['subtotal'], '160.00')
        response = self.client.post('/api/cart/add/', {'product_id': self.product.id, 'quantity': 2})
        self.assertEqual(response.status_code, 400)

    def test_cart_item_update_handles_bad_input(self):
        self.auth()
        self.client.post('/api/cart/add/', {'product_id': self.product.id, 'quantity': 1})
        item = self.cart.items.get()
        response = self.client.patch(f'/api/cart/items/{item.id}/', {'quantity': 'abc'})
        self.assertEqual(response.status_code, 400)
        response = self.client.patch('/api/cart/items/9999/', {'quantity': 1})
        self.assertEqual(response.status_code, 404)

    def test_coupon_recalculates_cart_total(self):
        self.auth()
        self.client.post('/api/cart/add/', {'product_id': self.product.id, 'quantity': 1})
        response = self.client.post('/api/cart/coupon/', {'code': 'RAD10'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['discount'], '8.00')
        self.assertEqual(response.data['total'], '101.90')

    def test_checkout_creates_snapshot_and_decrements_stock(self):
        self.auth()
        self.client.post('/api/cart/add/', {'product_id': self.product.id, 'quantity': 2})
        self.client.post('/api/cart/coupon/', {'code': 'RAD10'})
        response = self.client.post('/api/orders/checkout/', {'address_id': self.address.id, 'payment_method': 'mock_card'})
        self.assertEqual(response.status_code, 201)
        order = Order.objects.get(id=response.data['id'])
        self.assertEqual(order.items.count(), 1)
        item = order.items.first()
        self.assertEqual(item.product_name, self.product.name)
        self.assertEqual(item.unit_price, Decimal('80.00'))
        self.assertEqual(item.subtotal, Decimal('160.00'))
        self.assertEqual(order.discount, Decimal('16.00'))
        self.assertEqual(order.total, Decimal('173.90'))
        self.product.inventory.refresh_from_db()
        self.assertEqual(self.product.inventory.quantity, 1)
        self.coupon.refresh_from_db()
        self.assertEqual(self.coupon.used_count, 1)

    def test_checkout_blocks_insufficient_stock(self):
        self.auth()
        self.client.post('/api/cart/add/', {'product_id': self.product.id, 'quantity': 3})
        self.product.inventory.quantity = 1
        self.product.inventory.save(update_fields=['quantity'])
        response = self.client.post('/api/orders/checkout/', {'address_id': self.address.id, 'payment_method': 'mock_card'})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Order.objects.exists())

    @patch('commerce.views.ProductImageViewSet._host_is_private', return_value=False)
    @patch('commerce.views.urlrequest.urlopen')
    def test_admin_can_import_product_images_by_url(self, mock_urlopen, _host_mock):
        self.auth(self.admin)

        png_bytes = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
            b'\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf'
            b'\xc0\x00\x00\x03\x01\x01\x00\xc9\xfe\x92\xef\x00\x00\x00\x00IEND\xaeB`\x82'
        )

        class MockResponse:
            def __init__(self, body):
                self._body = body
                self._index = 0
                self.headers = {'Content-Type': 'image/png', 'Content-Length': str(len(body))}

            def read(self, size=-1):
                if self._index >= len(self._body):
                    return b''
                if size < 0:
                    chunk = self._body[self._index:]
                    self._index = len(self._body)
                    return chunk
                chunk = self._body[self._index:self._index + size]
                self._index += size
                return chunk

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, tb):
                return False

        mock_urlopen.return_value = MockResponse(png_bytes)

        response = self.client.post(
            '/api/product-images/import-by-url/',
            {
                'product': self.product.id,
                'urls': ['https://fabricante.com/imagem-1.png', 'https://fabricante.com/imagem-2.png'],
                'set_first_as_primary': True,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['created']), 2)
        self.assertEqual(len(response.data['errors']), 0)
        self.assertEqual(ProductImage.objects.filter(product=self.product).count(), 2)
        self.assertTrue(ProductImage.objects.filter(product=self.product, is_primary=True).exists())

    def test_import_by_url_blocks_private_hosts(self):
        self.auth(self.admin)
        response = self.client.post(
            '/api/product-images/import-by-url/',
            {
                'product': self.product.id,
                'urls': ['http://127.0.0.1/test.png'],
            },
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['created']), 0)
        self.assertEqual(len(response.data['errors']), 1)
