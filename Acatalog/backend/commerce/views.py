from django.contrib.auth import get_user_model
from django.conf import settings
from django.db import models, transaction
from django.db.models import Sum
from django.db.models.functions import TruncDate
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .filters import ProductFilter
from .models import (
    Address, Brand, Cart, CartItem, Category, Coupon, Inventory, Order,
    Product, ProductImage, Promotion, Review, Wishlist,
)
from .permissions import IsAdminRole
from .serializers import (
    AddressSerializer, AdminProductSerializer, BrandSerializer, CartItemSerializer,
    CartSerializer, CategorySerializer, CheckoutSerializer, CouponSerializer,
    GoogleLoginSerializer, LoginSerializer, OrderSerializer, ProductDetailSerializer,
    ProductImageSerializer, ProductListSerializer, PromotionSerializer,
    RegisterSerializer, ReviewSerializer, UserSerializer, WishlistSerializer,
)

User = get_user_model()


def token_response(user, response_status=status.HTTP_200_OK):
    refresh = RefreshToken.for_user(user)
    response = Response(
        {
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
        },
        status=response_status,
    )
    response.set_cookie(
        'refresh_token',
        str(refresh),
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        max_age=7 * 24 * 60 * 60,
    )
    return response


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return token_response(user, status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def customer_login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    if user.is_admin_role:
        return Response({'detail': 'Use o login administrativo.'}, status=status.HTTP_403_FORBIDDEN)
    Cart.objects.get_or_create(user=user)
    return token_response(user)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    if not user.is_admin_role:
        return Response({'detail': 'Acesso administrativo negado.'}, status=status.HTTP_403_FORBIDDEN)
    return token_response(user)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    serializer = GoogleLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return token_response(serializer.validated_data['user'])


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_access(request):
    token = request.COOKIES.get('refresh_token')
    if not token:
        return Response({'detail': 'Refresh token ausente.'}, status=status.HTTP_401_UNAUTHORIZED)
    refresh = RefreshToken(token)
    return Response({'access': str(refresh.access_token)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    response = Response({'detail': 'Logout realizado.'})
    response.delete_cookie('refresh_token')
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminRole()]


class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminRole()]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'brand', 'inventory').prefetch_related('images')
    filterset_class = ProductFilter
    search_fields = ['name', 'brand__name', 'sku', 'description', 'specifications']
    ordering_fields = ['price', 'created_at', 'sold_count', 'average_rating']
    lookup_field = 'slug'

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user.is_authenticated and self.request.user.is_admin_role):
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.request.user.is_authenticated and self.request.user.is_admin_role and self.action != 'retrieve':
            return AdminProductSerializer
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminRole()]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def home(self, request):
        qs = self.get_queryset()
        data = {
            'featured': ProductListSerializer(qs.filter(is_featured=True)[:8], many=True, context={'request': request}).data,
            'promotions': ProductListSerializer(qs.filter(promotional_price__isnull=False)[:8], many=True, context={'request': request}).data,
            'new': ProductListSerializer(qs.filter(is_new=True)[:8], many=True, context={'request': request}).data,
            'best_sellers': ProductListSerializer(qs.order_by('-sold_count')[:8], many=True, context={'request': request}).data,
        }
        return Response(data)


class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.select_related('product')
    serializer_class = ProductImageSerializer
    permission_classes = [IsAdminRole]


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CartViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    def get_cart(self):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return cart

    @action(detail=False, methods=['get'])
    def current(self, request):
        return Response(CartSerializer(self.get_cart(), context={'request': request}).data)

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def add(self, request):
        cart = self.get_cart()
        serializer = CartItemSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data['product']
        quantity = serializer.validated_data.get('quantity', 1)
        inventory = Inventory.objects.select_for_update().filter(product=product).first()
        current_quantity = CartItem.objects.filter(cart=cart, product=product).first()
        requested_total = quantity + (current_quantity.quantity if current_quantity else 0)
        if not inventory or inventory.available < requested_total:
            return Response({'detail': 'Estoque insuficiente.'}, status=status.HTTP_400_BAD_REQUEST)
        item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={'quantity': quantity})
        if not created:
            item.quantity += quantity
            item.save(update_fields=['quantity'])
        return Response(CartSerializer(cart, context={'request': request}).data)

    @action(detail=False, methods=['patch'], url_path='items/(?P<item_id>[^/.]+)')
    @transaction.atomic
    def update_item(self, request, item_id=None):
        item = CartItem.objects.get(id=item_id, cart=self.get_cart())
        quantity = max(int(request.data.get('quantity', 1)), 1)
        inventory = Inventory.objects.select_for_update().filter(product=item.product).first()
        if not inventory or inventory.available < quantity:
            return Response({'detail': 'Estoque insuficiente.'}, status=status.HTTP_400_BAD_REQUEST)
        item.quantity = quantity
        item.save(update_fields=['quantity'])
        return Response(CartSerializer(item.cart, context={'request': request}).data)

    @action(detail=False, methods=['delete'], url_path='items/(?P<item_id>[^/.]+)')
    def remove_item(self, request, item_id=None):
        cart = self.get_cart()
        CartItem.objects.filter(id=item_id, cart=cart).delete()
        return Response(CartSerializer(cart, context={'request': request}).data)

    @action(detail=False, methods=['post'])
    def coupon(self, request):
        cart = self.get_cart()
        code = request.data.get('code', '').strip().upper()
        coupon = Coupon.objects.filter(code__iexact=code).first()
        if not coupon or not coupon.is_valid():
            return Response({'detail': 'Cupom invalido ou expirado.'}, status=status.HTTP_400_BAD_REQUEST)
        cart.coupon = coupon
        cart.save(update_fields=['coupon'])
        return Response(CartSerializer(cart, context={'request': request}).data)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'total']

    def get_queryset(self):
        qs = Order.objects.prefetch_related('items').select_related('user', 'address')
        if self.request.user.is_admin_role:
            return qs
        return qs.filter(user=self.request.user)

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminRole()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        serializer = CheckoutSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order, context={'request': request}).data, status=status.HTTP_201_CREATED)


class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).select_related('product')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        product = self.request.query_params.get('product')
        qs = Review.objects.select_related('user', 'product')
        return qs.filter(product_id=product) if product else qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [IsAdminRole]


class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.prefetch_related('products')
    serializer_class = PromotionSerializer
    permission_classes = [IsAdminRole]


class CustomerViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = User.objects.filter(role=User.Role.CUSTOMER).prefetch_related('addresses', 'orders')
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]


@api_view(['GET'])
@permission_classes([IsAdminRole])
def dashboard_metrics(request):
    orders = Order.objects.all()
    paid_orders = orders.exclude(status=Order.Status.CANCELED)
    total_sales = paid_orders.aggregate(total=Sum('total'))['total'] or 0
    total_orders = paid_orders.count()
    average_ticket = total_sales / total_orders if total_orders else 0
    low_stock = Inventory.objects.filter(quantity__lte=models.F('low_stock_threshold')).count()
    recent_orders = OrderSerializer(orders.order_by('-created_at')[:6], many=True, context={'request': request}).data
    best_sellers = ProductListSerializer(Product.objects.order_by('-sold_count')[:6], many=True, context={'request': request}).data
    sales_chart = list(
        paid_orders.annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(sales=Sum('total'), orders=models.Count('id'))
        .order_by('day')
    )
    for item in sales_chart:
        item['label'] = item.pop('day').strftime('%d/%m')
    return Response({
        'total_sales': total_sales,
        'total_orders': total_orders,
        'average_ticket': average_ticket,
        'low_stock': low_stock,
        'recent_orders': recent_orders,
        'best_sellers': best_sellers,
        'sales_chart': sales_chart,
    })
