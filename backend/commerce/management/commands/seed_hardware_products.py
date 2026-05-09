from io import BytesIO
from decimal import Decimal

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from PIL import Image, ImageDraw, ImageFont

from commerce.models import Brand, Category, Inventory, Product, ProductImage


class Command(BaseCommand):
    help = "Cria ao menos 15 produtos de hardware com imagem local gerada no backend."

    def _ensure_taxonomy(self):
        categories = [
            ("Placas de vídeo", "placas-de-video"),
            ("Processadores", "processadores"),
            ("Placas-mãe", "placas-mae"),
            ("Memórias RAM", "memorias-ram"),
            ("SSDs e armazenamento", "ssds-e-armazenamento"),
            ("Fontes", "fontes"),
            ("Gabinetes", "gabinetes"),
            ("Monitores", "monitores"),
            ("Periféricos gamer", "perifericos-gamer"),
            ("Notebooks", "notebooks"),
        ]
        brands = [
            ("Intel", "intel"),
            ("AMD", "amd"),
            ("NVIDIA", "nvidia"),
            ("ASUS", "asus"),
            ("Gigabyte", "gigabyte"),
            ("MSI", "msi"),
            ("Corsair", "corsair"),
            ("Kingston", "kingston"),
            ("Samsung", "samsung"),
            ("Dell", "dell"),
            ("Logitech", "logitech"),
        ]
        for idx, (name, slug) in enumerate(categories, start=1):
            Category.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "is_featured": idx <= 6, "sort_order": idx, "is_active": True},
            )
        for idx, (name, slug) in enumerate(brands, start=1):
            Brand.objects.update_or_create(
                slug=slug,
                defaults={"name": name, "is_featured": idx <= 8, "is_active": True},
            )

    def _make_image(self, title, subtitle, seed):
        width, height = 1280, 720
        bg_a = (8 + (seed * 17) % 40, 24 + (seed * 11) % 60, 50 + (seed * 7) % 70)
        bg_b = (20 + (seed * 9) % 70, 130 + (seed * 5) % 90, 170 + (seed * 3) % 70)
        image = Image.new("RGB", (width, height), bg_a)
        draw = ImageDraw.Draw(image)
        for y in range(height):
            ratio = y / max(height - 1, 1)
            color = (
                int(bg_a[0] * (1 - ratio) + bg_b[0] * ratio),
                int(bg_a[1] * (1 - ratio) + bg_b[1] * ratio),
                int(bg_a[2] * (1 - ratio) + bg_b[2] * ratio),
            )
            draw.line([(0, y), (width, y)], fill=color)

        # Moldura e bloco de texto para parecer foto de catálogo consistente.
        draw.rounded_rectangle((40, 40, width - 40, height - 40), radius=28, outline=(255, 255, 255), width=3)
        draw.rounded_rectangle((90, height - 230, width - 90, height - 90), radius=18, fill=(7, 15, 30))
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        draw.text((120, height - 205), title[:80], fill=(255, 255, 255), font=font_title)
        draw.text((120, height - 165), subtitle[:110], fill=(180, 220, 255), font=font_subtitle)
        draw.text((120, height - 125), "Acatalog Tech", fill=(130, 240, 220), font=font_subtitle)

        output = BytesIO()
        image.save(output, format="PNG")
        output.seek(0)
        return output.read()

    def handle(self, *args, **options):
        self._ensure_taxonomy()

        products = [
            ("rtx-4070-super-12gb", "GeForce RTX 4070 SUPER 12GB", "GPU-RTX4070S-12", "placas-de-video", "nvidia", "Placa de vídeo para 1440p com ray tracing avançado.", Decimal("4799.90"), Decimal("4399.90"), 8),
            ("rx-7800-xt-16gb", "Radeon RX 7800 XT 16GB", "GPU-RX7800XT-16", "placas-de-video", "amd", "Placa de vídeo para jogos em alta taxa com 16GB.", Decimal("3999.90"), Decimal("3699.90"), 9),
            ("intel-core-i7-14700k", "Intel Core i7-14700K", "CPU-I7-14700K", "processadores", "intel", "Processador com alta performance para games e criação.", Decimal("2799.90"), Decimal("2599.90"), 15),
            ("amd-ryzen-7-7800x3d", "AMD Ryzen 7 7800X3D", "CPU-R7-7800X3D", "processadores", "amd", "CPU gamer com cache 3D para FPS competitivo.", Decimal("2499.90"), Decimal("2299.90"), 12),
            ("asus-b650-tuf-wifi", "ASUS TUF B650-PLUS WIFI", "MB-B650-TUF-WIFI", "placas-mae", "asus", "Placa-mãe AM5 com Wi-Fi e VRM robusto.", Decimal("1599.90"), Decimal("1499.90"), 11),
            ("gigabyte-z790-aorus-elite", "Gigabyte Z790 AORUS ELITE AX", "MB-Z790-AORUS", "placas-mae", "gigabyte", "Placa-mãe Intel Z790 com recursos premium.", Decimal("1899.90"), Decimal("1799.90"), 10),
            ("corsair-32gb-ddr5-6000", "Corsair Vengeance 32GB DDR5 6000", "RAM-DDR5-32-6000", "memorias-ram", "corsair", "Kit 2x16GB DDR5 para alto desempenho.", Decimal("999.90"), Decimal("899.90"), 20),
            ("kingston-fury-32gb-ddr5-5600", "Kingston Fury Beast 32GB DDR5 5600", "RAM-DDR5-32-5600", "memorias-ram", "kingston", "Memória DDR5 estável para setups modernos.", Decimal("899.90"), Decimal("829.90"), 18),
            ("samsung-990-pro-2tb", "SSD Samsung 990 PRO 2TB NVMe", "SSD-990PRO-2TB", "ssds-e-armazenamento", "samsung", "SSD NVMe PCIe 4.0 para workstation e jogos.", Decimal("1199.90"), Decimal("899.90"), 25),
            ("kingston-nv2-1tb", "SSD Kingston NV2 1TB NVMe", "SSD-NV2-1TB", "ssds-e-armazenamento", "kingston", "SSD NVMe custo-benefício para upgrades.", Decimal("449.90"), Decimal("399.90"), 40),
            ("corsair-rm850x", "Fonte Corsair RM850x 850W Gold", "PSU-RM850X", "fontes", "corsair", "Fonte modular premium com alta eficiência.", Decimal("999.90"), Decimal("929.90"), 14),
            ("msi-a850gl", "Fonte MSI MAG A850GL 850W Gold", "PSU-MSI-A850GL", "fontes", "msi", "Fonte ATX para builds gamers de alta potência.", Decimal("849.90"), Decimal("779.90"), 16),
            ("dell-27-qhd-165hz", "Monitor Dell 27 QHD 165Hz", "MON-DELL-27QHD165", "monitores", "dell", "Monitor 27 pol. QHD com alta fluidez.", Decimal("1899.90"), Decimal("1699.90"), 7),
            ("logitech-g-pro-x-superlight", "Mouse Logitech G PRO X SUPERLIGHT", "PERI-GPROXSL", "perifericos-gamer", "logitech", "Mouse competitivo ultraleve de alta precisão.", Decimal("799.90"), Decimal("699.90"), 30),
            ("asus-tuf-gaming-f15", "Notebook ASUS TUF Gaming F15", "NB-ASUS-TUF-F15", "notebooks", "asus", "Notebook gamer com GPU dedicada e tela 144Hz.", Decimal("5999.90"), Decimal("5499.90"), 6),
        ]

        created_or_updated = 0
        for index, (slug, name, sku, category_slug, brand_slug, description, price, promo_price, quantity) in enumerate(products, start=1):
            category = Category.objects.get(slug=category_slug)
            brand = Brand.objects.get(slug=brand_slug)
            product, _ = Product.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "sku": sku,
                    "category": category,
                    "brand": brand,
                    "description": description,
                    "specifications": {"Segmento": category.name, "Marca": brand.name},
                    "price": price,
                    "promotional_price": promo_price,
                    "is_active": True,
                    "is_featured": index <= 6,
                    "is_new": index <= 5,
                    "is_best_seller": index <= 4,
                },
            )
            Inventory.objects.update_or_create(
                product=product,
                defaults={"quantity": quantity, "reserved": 0, "low_stock_threshold": 4},
            )

            image_bytes = self._make_image(name, description, index)
            filename = f"{slug}.png"
            image_obj = product.images.filter(is_primary=True).first()
            if image_obj is None:
                image_obj = ProductImage(product=product, is_primary=True, sort_order=0)
            image_obj.alt_text = name
            image_obj.image.save(filename, ContentFile(image_bytes), save=True)
            created_or_updated += 1

        self.stdout.write(
            self.style.SUCCESS(f"Catálogo de hardware atualizado com {created_or_updated} produtos e imagens.")
        )
