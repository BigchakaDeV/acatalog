import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category__slug')
    brand = django_filters.CharFilter(field_name='brand__slug')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    rating = django_filters.NumberFilter(field_name='average_rating', lookup_expr='gte')
    available = django_filters.BooleanFilter(method='filter_available')
    promotion = django_filters.BooleanFilter(method='filter_promotion')
    ordering = django_filters.OrderingFilter(
        fields=(
            ('price', 'price'),
            ('created_at', 'created_at'),
            ('sold_count', 'sold_count'),
            ('average_rating', 'average_rating'),
        )
    )

    class Meta:
        model = Product
        fields = ['category', 'brand', 'min_price', 'max_price', 'rating', 'available', 'promotion']

    def filter_available(self, queryset, name, value):
        if value:
            return queryset.filter(inventory__quantity__gt=0)
        return queryset

    def filter_promotion(self, queryset, name, value):
        if value:
            return queryset.filter(promotional_price__isnull=False)
        return queryset
