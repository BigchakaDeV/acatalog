from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Address, Brand, Cart, CartItem, Category, Coupon, Inventory, Order,
    OrderItem, Payment, Product, ProductImage, Promotion, Review, User, Wishlist,
)


@admin.register(User)
class AcatalogUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (('Acatalog', {'fields': ('role', 'phone')}),)
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class InventoryInline(admin.StackedInline):
    model = Inventory
    can_delete = False


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'brand', 'category', 'price', 'promotional_price', 'is_active')
    list_filter = ('category', 'brand', 'is_active', 'is_featured', 'is_new')
    search_fields = ('name', 'sku', 'brand__name')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [InventoryInline, ProductImageInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}
    list_display = ('name', 'is_featured', 'is_active', 'sort_order')


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}
    list_display = ('name', 'is_featured', 'is_active')


admin.site.register(Address)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Coupon)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Payment)
admin.site.register(Review)
admin.site.register(Wishlist)
admin.site.register(Promotion)
