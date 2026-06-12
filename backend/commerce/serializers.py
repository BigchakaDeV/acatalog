from decimal import Decimal

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.db import models, transaction
from django.db.models import Q
from django.db.models import Avg
from rest_framework import serializers
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from .models import (
    Address, Brand, Cart, CartItem, Category, Coupon, Inventory, Order,
    OrderItem, Payment, Product, ProductImage, Promotion, Review, Wishlist,
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role')
        read_only_fields = ('id', 'role')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'phone')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data, role=User.Role.CUSTOMER)
        user.set_password(password)
        user.save()
        Cart.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(trim_whitespace=True)
    password = serializers.CharField()

    def validate(self, attrs):
        identifier = attrs['email'].strip()
        if not identifier:
            raise serializers.ValidationError('Credenciais invalidas.')
        user_obj = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
        if not user_obj:
            raise serializers.ValidationError('Credenciais invalidas.')
        user = authenticate(username=user_obj.username, password=attrs['password'])
        if not user:
            raise serializers.ValidationError('Credenciais invalidas.')
        attrs['user'] = user
        return attrs


class GoogleLoginSerializer(serializers.Serializer):
    credential = serializers.CharField()

    def validate(self, attrs):
        if not settings.GOOGLE_CLIENT_ID:
            raise serializers.ValidationError('Login Google indisponivel no ambiente atual.')
        try:
            payload = id_token.verify_oauth2_token(
                attrs['credential'],
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError as exc:
            raise serializers.ValidationError('Token Google invalido.') from exc
        email = payload.get('email')
        if not email or not payload.get('email_verified'):
            raise serializers.ValidationError('E-mail Google nao verificado.')
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],
                'first_name': payload.get('given_name', ''),
                'last_name': payload.get('family_name', ''),
                'role': User.Role.CUSTOMER,
            },
        )
        Cart.objects.get_or_create(user=user)
        attrs['user'] = user
        return attrs


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ('user',)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'


class InventorySerializer(serializers.ModelSerializer):
    available = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Inventory
        fields = ('quantity', 'reserved', 'low_stock_threshold', 'available', 'is_low_stock')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'


class ProductImageImportByUrlSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    urls = serializers.ListField(child=serializers.URLField(), allow_empty=False)
    alt_text = serializers.CharField(required=False, allow_blank=True, max_length=160)
    start_sort_order = serializers.IntegerField(required=False, min_value=0)
    set_first_as_primary = serializers.BooleanField(required=False, default=False)


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'sku', 'category', 'brand', 'price',
            'promotional_price', 'current_price', 'average_rating', 'sold_count',
            'is_featured', 'is_new', 'is_best_seller', 'in_stock', 'primary_image',
        )

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first() or obj.images.first()
        return ProductImageSerializer(image, context=self.context).data if image else None


class ProductDetailSerializer(ProductListSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    inventory = InventorySerializer(read_only=True)
    reviews_count = serializers.IntegerField(source='reviews.count', read_only=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + (
            'description', 'specifications', 'images', 'inventory', 'reviews_count',
            'created_at', 'updated_at',
        )


class AdminProductSerializer(serializers.ModelSerializer):
    inventory = InventorySerializer(required=False)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(queryset=Brand.objects.all(), source='brand', write_only=True)
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'sku', 'category', 'brand', 'category_id', 'brand_id',
            'description', 'specifications', 'price', 'promotional_price', 'is_active',
            'is_featured', 'is_new', 'is_best_seller', 'average_rating', 'sold_count',
            'current_price', 'in_stock', 'primary_image', 'inventory',
        )
        read_only_fields = ('category', 'brand', 'average_rating', 'sold_count')

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first() or obj.images.first()
        return ProductImageSerializer(image, context=self.context).data if image else None

    def create(self, validated_data):
        inventory_data = validated_data.pop('inventory', {})
        product = Product.objects.create(**validated_data)
        Inventory.objects.create(product=product, **inventory_data)
        return product

    def update(self, instance, validated_data):
        inventory_data = validated_data.pop('inventory', None)
        product = super().update(instance, validated_data)
        if inventory_data is not None:
            Inventory.objects.update_or_create(product=product, defaults=inventory_data)
        return product


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True), source='product', write_only=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'quantity', 'unit_price', 'subtotal')

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantidade deve ser maior que zero.')
        return value


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    shipping = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)

    class Meta:
        model = Cart
        fields = ('id', 'items', 'coupon_code', 'subtotal', 'discount', 'shipping', 'total', 'updated_at')


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ('user', 'subtotal', 'discount', 'shipping', 'total', 'coupon_code')


class CheckoutSerializer(serializers.Serializer):
    SHIPPING_METHODS = {'economy', 'standard', 'express'}

    address_id = serializers.PrimaryKeyRelatedField(queryset=Address.objects.all(), source='address')
    payment_method = serializers.CharField(default='mock_card')
    shipping_method = serializers.ChoiceField(choices=tuple((item, item) for item in SHIPPING_METHODS), default='standard')

    def validate_address(self, address):
        if address.user != self.context['request'].user:
            raise serializers.ValidationError('Endereco invalido.')
        return address

    def _shipping_price(self, subtotal, discount, method):
        base = max(subtotal - discount, Decimal('0.00'))
        value_score = min(Decimal('30.00'), base / Decimal('350.00'))
        insurance_factor = min(Decimal('10.00'), base * Decimal('0.0015'))
        route_noise = Decimal((int(base / Decimal('10.00')) % 11))
        economy = min(max(
            Decimal('15.00') + value_score * Decimal('0.32') + insurance_factor * Decimal('0.30') + route_noise * Decimal('0.45'),
            Decimal('15.00'),
        ), Decimal('60.00')).quantize(Decimal('0.01'))
        standard = min(max(
            economy + Decimal('7.00') + value_score * Decimal('0.25') + route_noise * Decimal('0.35'),
            Decimal('15.00'),
        ), Decimal('60.00')).quantize(Decimal('0.01'))
        express = min(max(
            standard + Decimal('9.00') + value_score * Decimal('0.30') + insurance_factor * Decimal('0.55') + route_noise * Decimal('0.25'),
            Decimal('15.00'),
        ), Decimal('60.00')).quantize(Decimal('0.01'))
        values = {
            'economy': economy,
            'standard': standard,
            'express': express,
        }
        return values.get(method, standard).quantize(Decimal('0.01'))

    def _cart_totals(self, items, coupon, shipping_method):
        subtotal = sum((item.product.current_price * item.quantity for item in items), Decimal('0.00'))
        discount = coupon.calculate_discount(subtotal) if coupon else Decimal('0.00')
        shipping = self._shipping_price(subtotal, discount, shipping_method) if subtotal else Decimal('0.00')
        total = max(subtotal - discount + shipping, Decimal('0.00'))
        return subtotal, discount, shipping, total

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        cart = (
            Cart.objects.select_for_update()
            .select_related('coupon')
            .get(user=user)
        )
        items = list(
            CartItem.objects.select_for_update()
            .select_related('product')
            .filter(cart=cart)
        )
        if not items:
            raise serializers.ValidationError('Carrinho vazio.')
        product_ids = [item.product_id for item in items]
        inventory_by_product = {
            inventory.product_id: inventory
            for inventory in Inventory.objects.select_for_update().filter(product_id__in=product_ids)
        }
        for item in items:
            inventory = inventory_by_product.get(item.product_id)
            if not inventory:
                raise serializers.ValidationError(f'Estoque nao encontrado para {item.product.name}.')
            if inventory.available < item.quantity:
                raise serializers.ValidationError(f'Estoque insuficiente para {item.product.name}.')
        coupon = None
        if cart.coupon_id:
            coupon = Coupon.objects.select_for_update().get(id=cart.coupon_id)
            if not coupon.is_valid():
                raise serializers.ValidationError('Cupom invalido ou expirado.')
        subtotal, discount, shipping, total = self._cart_totals(items, coupon, validated_data['shipping_method'])
        order = Order.objects.create(
            user=user,
            address=validated_data['address'],
            subtotal=subtotal,
            discount=discount,
            shipping=shipping,
            total=total,
            coupon_code=coupon.code if coupon else '',
        )
        for item in items:
            inventory = inventory_by_product[item.product_id]
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                sku=item.product.sku,
                unit_price=item.unit_price,
                quantity=item.quantity,
                subtotal=item.product.current_price * item.quantity,
            )
            inventory.quantity -= item.quantity
            inventory.save(update_fields=['quantity'])
            item.product.sold_count += item.quantity
            item.product.save(update_fields=['sold_count'])
        Payment.objects.create(order=order, method=validated_data['payment_method'])
        if coupon:
            coupon.used_count = models.F('used_count') + 1
            coupon.save(update_fields=['used_count'])
        CartItem.objects.filter(cart=cart).delete()
        cart.coupon = None
        cart.save(update_fields=['coupon'])
        return order


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True))

    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ('user',)

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Nota deve ficar entre 1 e 5.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        product = attrs.get('product') or getattr(self.instance, 'product', None)
        if request and request.user.is_authenticated and product and self.instance is None:
            if Review.objects.filter(user=request.user, product=product).exists():
                raise serializers.ValidationError('Voce ja avaliou este produto.')
        return attrs

    def create(self, validated_data):
        review = super().create(validated_data)
        avg = Review.objects.filter(product=review.product).aggregate(avg=Avg('rating'))['avg'] or 0
        review.product.average_rating = avg
        review.product.save(update_fields=['average_rating'])
        return review


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True), source='product', write_only=True)

    class Meta:
        model = Wishlist
        fields = ('id', 'product', 'product_id', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate(self, attrs):
        request = self.context.get('request')
        product = attrs.get('product')
        if request and request.user.is_authenticated and product:
            if Wishlist.objects.filter(user=request.user, product=product).exists():
                raise serializers.ValidationError('Produto ja esta na sua wishlist.')
        return attrs


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = '__all__'
