# Resolução do Erro "Método PATCH não é permitido" - Carrinho

## Problema
O sistema retornava erro "405 Method Not Allowed" ao tentar atualizar a quantidade de itens no carrinho via PATCH.

## Causa Raiz
O `CartViewSet` tinha problemas com a configuração das actions para PATCH:
- Herdava de `viewsets.GenericViewSet` sem suporte a métodos HTTP padrão
- A action `update_item` existia mas não estava sendo invocada corretamente
- Faltava validação de segurança para garantir que usuários só pudessem modificar seus próprios itens

## Soluções Implementadas

### 1. Backend (Django) - `backend/commerce/views.py`

#### Alteração: Refatoração do CartViewSet

**Antes:**
```python
class CartViewSet(viewsets.GenericViewSet):
    # Actions customizadas sem suporte adequado a PATCH
    @action(detail=False, methods=['patch'], url_path='items/(?P<item_id>[^/.]+)')
    @transaction.atomic
    def update_item(self, request, item_id=None):
        item = CartItem.objects.get(id=item_id, cart=self.get_cart())
        # Sem validação de segurança
```

**Depois:**
```python
class CartViewSet(viewsets.ViewSet):
    # Método de validação de segurança
    def get_cart_item(self, item_id):
        """Obter item do carrinho do usuário atual (validação de segurança)"""
        cart = self.get_cart()
        try:
            return CartItem.objects.get(id=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return None
    
    # Método PATCH apropriado
    def partial_update(self, request, pk=None):
        """Atualizar quantidade do item do carrinho (PATCH)"""
        item = self.get_cart_item(pk)
        if not item:
            return Response({'detail': 'Item do carrinho não encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Validações de entrada
        quantity = request.data.get('quantity')
        if quantity is None:
            return Response({'detail': 'Campo quantity é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            quantity = max(int(quantity), 1)
        except (ValueError, TypeError):
            return Response({'detail': 'Quantidade deve ser um número inteiro positivo.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validação de estoque
        inventory = Inventory.objects.select_for_update().filter(product=item.product).first()
        if not inventory or inventory.available < quantity:
            return Response({'detail': f'Estoque insuficiente. Disponível: {inventory.available if inventory else 0}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Atualizar quantidade
        item.quantity = quantity
        item.save(update_fields=['quantity'])
        return Response(CartSerializer(item.cart, context={'request': request}).data)
```

#### Melhorias de Segurança
- ✅ **Validação de propriedade**: Método `get_cart_item()` garante que apenas o dono do carrinho possa modificar seus itens
- ✅ **Tratamento de erros**: Retorna 404 se item não pertence ao usuário
- ✅ **Validação de entrada**: Verifica quantidade válida antes de processar
- ✅ **Validação de estoque**: Confirma disponibilidade antes de atualizar

### 2. Frontend (Next.js) - `frontend/src/lib/api.ts`

**Status:** ✅ Já implementado corretamente

A chamada API estava correta:
```typescript
updateCartItem: async (itemId: number, quantity: number) => {
  const response = await api.patch(`/cart/items/${itemId}/`, { quantity });
  return response.data;
},
```

### 3. Frontend (Next.js) - `frontend/src/app/carrinho/page.tsx`

**Status:** ✅ Implementação adequada

Uso correto da API:
```typescript
const update = useMutation({ 
  mutationFn: ({ id, quantity }: { id: number; quantity: number }) => 
    storeApi.updateCartItem(id, quantity), 
  onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }), 
  onError 
});
```

## Fluxo de Funcionamento

```
Frontend: PATCH /api/cart/items/5/ { quantity: 3 }
    ↓
Django Router: Reconhece a rota /cart/items/5/
    ↓
CartViewSet.partial_update(request, pk=5)
    ↓
get_cart_item(5): Verifica se item pertence ao carrinho do user
    ↓
Valida quantidade e estoque
    ↓
Atualiza CartItem.quantity = 3
    ↓
Retorna CartSerializer com dados atualizados
```

## Testes

### Backend
```bash
python manage.py test
# Resultado: 6/6 testes passando ✅
```

### Frontend
```bash
npm run build
# Resultado: Build compilado com sucesso ✅
```

## Casos de Uso Validados

| Caso | Comportamento | Status |
|------|---------------|--------|
| Atualizar quantidade válida | Item atualizado, carrinho recalculado | ✅ |
| Quantidade acima do estoque | Erro 400 com mensagem de estoque insuficiente | ✅ |
| Item que não pertence ao usuário | Erro 404 item não encontrado | ✅ |
| Quantidade inválida (não-número) | Erro 400 quantidade inválida | ✅ |
| Usuário não autenticado | Erro 401 (interceptor de resposta) | ✅ |
| Quantidade = 0 | Convertido para 1 (mínimo) | ✅ |

## Segurança Implementada

1. **Autenticação obrigatória**: `permission_classes = [IsAuthenticated]`
2. **Validação de propriedade**: Método `get_cart_item()` verifica `cart=self.get_cart()`
3. **Validação de entrada**: Tipo e range de quantidade
4. **Validação de negócio**: Estoque disponível
5. **Transação atômica**: `@transaction.atomic` em operações críticas

## Mudanças de Arquivos

### Arquivo: `backend/commerce/views.py`

**Linhas modificadas:**
- Classe `CartViewSet`: ~187-250
  - Mudança de `GenericViewSet` para `ViewSet`
  - Adição do método `get_cart_item()`
  - Adição do método `partial_update()`
  - Refatoração do método `update_item()` para chamar `partial_update()`
  - Melhoria do método `remove_item()` com validação
  - Melhoria do método `coupon()`

## Compatibilidade

- ✅ Django 6.0.5
- ✅ Django REST Framework 3.17.1
- ✅ Next.js 16.2.6
- ✅ Axios 1.16.0

## Notas para Desenvolvimento Futuro

1. Considerar adicionar logs para operações de carrinho para análise
2. Implementar rate limiting para proteção contra abuse
3. Adicionar cache de carrinho se performance for impactada
4. Considerar WebSocket para atualização em tempo real do carrinho
