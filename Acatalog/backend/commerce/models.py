from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'customer', 'Cliente'
        OPERATOR = 'operator', 'Operador'
        ADMIN = 'admin', 'Admin'

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    phone = models.CharField(max_length=30, blank=True)

    @property
    def is_admin_role(self):
        return self.is_staff or self.role in {self.Role.ADMIN, self.Role.OPERATOR}


class Address(models.Model):
    user = models.ForeignKey(User, related_name='addresses', on_delete=models.CASCADE)
    label = models.CharField(max_length=80, default='Principal')
    recipient = models.CharField(max_length=160)
    phone = models.CharField(max_length=30, blank=True)
    zip_code = models.CharField(max_length=20)
    street = models.CharField(max_length=180)
    number = models.CharField(max_length=30)
    complement = models.CharField(max_length=120, blank=True)
    district = models.CharField(max_length=120)
    city = models.CharField(max_length=120)
    state = models.CharField(max_length=2)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.recipient} - {self.city}/{self.state}'


class Category(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    logo = models.ImageField(upload_to='brands/', blank=True, null=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=180)
    slug = models.SlugField(unique=True)
    sku = models.CharField(max_length=80, unique=True)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.PROTECT)
    brand = models.ForeignKey(Brand, related_name='products', on_delete=models.PROTECT)
    description = models.TextField()
    specifications = models.JSONField(default=dict, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    promotional_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    sold_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def current_price(self):
        active_promo = self.promotions.filter(
            is_active=True,
            starts_at__lte=timezone.now(),
            ends_at__gte=timezone.now(),
        ).order_by('promotional_price').first()
        if active_promo:
            return active_promo.promotional_price
        return self.promotional_price or self.price

    @property
    def in_stock(self):
        return hasattr(self, 'inventory') and self.inventory.quantity > 0

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=160, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']


class Inventory(models.Model):
    product = models.OneToOneField(Product, related_name='inventory', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    reserved = models.PositiveIntegerField(default=0)

    @property
    def available(self):
        return max(self.quantity - self.reserved, 0)

    @property
    def is_low_stock(self):
        return self.available <= self.low_stock_threshold


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENT = 'percent', 'Percentual'
        FIXED = 'fixed', 'Valor fixo'

    code = models.CharField(max_length=40, unique=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    usage_limit = models.PositiveIntegerField(default=0)
    used_count = models.PositiveIntegerField(default=0)

    def is_valid(self):
        now = timezone.now()
        under_limit = self.usage_limit == 0 or self.used_count < self.usage_limit
        return self.is_active and self.valid_from <= now <= self.valid_until and under_limit

    def calculate_discount(self, subtotal):
        if not self.is_valid():
            return Decimal('0.00')
        if self.discount_type == self.DiscountType.PERCENT:
            return (subtotal * self.value / Decimal('100')).quantize(Decimal('0.01'))
        return min(self.value, subtotal)

    def __str__(self):
        return self.code


class Cart(models.Model):
    user = models.OneToOneField(User, related_name='cart', on_delete=models.CASCADE)
    coupon = models.ForeignKey(Coupon, blank=True, null=True, on_delete=models.SET_NULL)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def subtotal(self):
        return sum((item.subtotal for item in self.items.select_related('product')), Decimal('0.00'))

    @property
    def discount(self):
        return self.coupon.calculate_discount(self.subtotal) if self.coupon else Decimal('0.00')

    @property
    def shipping(self):
        return Decimal('0.00') if self.subtotal >= Decimal('500.00') or self.subtotal == 0 else Decimal('29.90')

    @property
    def total(self):
        return max(self.subtotal - self.discount + self.shipping, Decimal('0.00'))


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('cart', 'product')

    @property
    def unit_price(self):
        return self.product.current_price

    @property
    def subtotal(self):
        return self.unit_price * self.quantity


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendente'
        PAID = 'paid', 'Pago'
        SHIPPED = 'shipped', 'Enviado'
        DELIVERED = 'delivered', 'Entregue'
        CANCELED = 'canceled', 'Cancelado'

    user = models.ForeignKey(User, related_name='orders', on_delete=models.PROTECT)
    address = models.ForeignKey(Address, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    coupon_code = models.CharField(max_length=40, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, blank=True, null=True, on_delete=models.SET_NULL)
    product_name = models.CharField(max_length=180)
    sku = models.CharField(max_length=80)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendente'
        APPROVED = 'approved', 'Aprovado'
        REFUSED = 'refused', 'Recusado'

    order = models.OneToOneField(Order, related_name='payment', on_delete=models.CASCADE)
    method = models.CharField(max_length=40)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    transaction_id = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Review(models.Model):
    user = models.ForeignKey(User, related_name='reviews', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name='reviews', on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')


class Wishlist(models.Model):
    user = models.ForeignKey(User, related_name='wishlist_items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name='wishlisted_by', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')


class Promotion(models.Model):
    name = models.CharField(max_length=140)
    products = models.ManyToManyField(Product, related_name='promotions', blank=True)
    old_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    promotional_price = models.DecimalField(max_digits=10, decimal_places=2)
    badge = models.CharField(max_length=40, default='Oferta')
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    def __str__(self):
        return self.name
